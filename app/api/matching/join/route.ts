import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { meal_time } = await request.json();
  if (!["아침", "점심", "저녁"].includes(meal_time)) {
    return NextResponse.json({ error: "잘못된 시간대입니다." }, { status: 400 });
  }

  // 이미 대기 중인지 확인
  const { data: existing } = await supabase
    .from("match_queue")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "waiting")
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "이미 매칭 대기 중입니다." }, { status: 409 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("school_domain")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "프로필 정보가 없습니다." }, { status: 400 });
  }

  // admin 클라이언트로 상대방 큐 조회 및 업데이트
  const admin = createAdminClient();

  // 같은 학교 + 같은 시간대 대기자 찾기
  const { data: candidates } = await admin
    .from("match_queue")
    .select("id, user_id")
    .eq("meal_time", meal_time)
    .eq("status", "waiting")
    .neq("user_id", user.id)
    .order("created_at", { ascending: true });

  let partner: { id: string; user_id: string } | null = null;

  for (const candidate of candidates ?? []) {
    const { data: partnerProfile } = await admin
      .from("users")
      .select("school_domain")
      .eq("id", candidate.user_id)
      .single();

    if (partnerProfile?.school_domain === profile.school_domain) {
      partner = candidate;
      break;
    }
  }

  if (partner) {
    // 매칭 레코드 생성
    const { data: matchData, error: matchError } = await admin
      .from("matches")
      .insert({ user_a_id: user.id, user_b_id: partner.user_id, meal_time })
      .select("id")
      .single();

    if (matchError) {
      return NextResponse.json({ error: matchError.message }, { status: 500 });
    }

    // 파트너 큐 상태 업데이트
    await admin
      .from("match_queue")
      .update({ status: "matched" })
      .eq("id", partner.id);

    // 본인 큐 matched 상태로 삽입
    await admin.from("match_queue").insert({
      user_id: user.id,
      meal_time,
      status: "matched",
    });

    return NextResponse.json({ status: "matched", match_id: matchData.id });
  }

  // 대기 등록
  const { data: queued, error: queueError } = await supabase
    .from("match_queue")
    .insert({ user_id: user.id, meal_time, status: "waiting" })
    .select("id")
    .single();

  if (queueError) {
    return NextResponse.json({ error: queueError.message }, { status: 500 });
  }

  return NextResponse.json({ status: "waiting", queue_id: queued.id });
}
