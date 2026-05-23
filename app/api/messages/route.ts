import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { match_id, content } = await request.json();
  if (!match_id || !content?.trim()) {
    return NextResponse.json({ error: "필수 항목이 없습니다." }, { status: 400 });
  }

  // 해당 match에 속한 사용자인지 확인
  const { data: match } = await supabase
    .from("matches")
    .select("id")
    .eq("id", match_id)
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .maybeSingle();

  if (!match) {
    return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({ match_id, sender_id: user.id, content: content.trim() })
    .select("id, content, created_at, sender_id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
