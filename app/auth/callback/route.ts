import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const COUPON_TEMPLATES = [
  { store_name: "스타벅스", benefit: "아메리카노 1잔 무료", days: 30 },
  { store_name: "맥도날드", benefit: "빅맥 세트 20% 할인", days: 30 },
  { store_name: "파리바게뜨", benefit: "음료 1잔 무료", days: 30 },
  { store_name: "CU 편의점", benefit: "3,000원 이상 구매 시 1,000원 할인", days: 60 },
  { store_name: "배스킨라빈스", benefit: "레귤러 싱글 1개 무료", days: 45 },
];

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const user = data.user;

  // upsert user profile
  await supabase.from("users").upsert({
    id: user.id,
    email: user.email,
    nickname: user.user_metadata?.nickname ?? user.email?.split("@")[0],
    school_domain: user.email?.split("@")[1] ?? "",
  });

  // issue coupon if not already issued
  const { count } = await supabase
    .from("coupons")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (count === 0) {
    const template = COUPON_TEMPLATES[Math.floor(Math.random() * COUPON_TEMPLATES.length)];
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + template.days);

    await supabase.from("coupons").insert({
      user_id: user.id,
      store_name: template.store_name,
      benefit: template.benefit,
      expires_at: expiresAt.toISOString(),
      is_used: false,
    });
  }

  return NextResponse.redirect(`${origin}/home`);
}
