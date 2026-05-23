import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("nickname")
    .eq("id", user.id)
    .single();

  const { data: queue } = await supabase
    .from("match_queue")
    .select("id, meal_time, status, created_at")
    .eq("user_id", user.id)
    .eq("status", "waiting")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: match } = await supabase
    .from("matches")
    .select("id, meal_time, created_at, user_a_id, user_b_id")
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nickname = profile?.nickname ?? user.email?.split("@")[0];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          안녕하세요, {nickname}님 👋
        </h1>
        <p className="text-gray-500 mt-1 text-sm">오늘 같이 밥 먹을 메이트를 찾아보세요!</p>
      </div>

      {/* 현재 상태 카드 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="font-semibold text-gray-700 mb-4">현재 매칭 상태</h2>

        {queue ? (
          <div className="flex items-center justify-between">
            <div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700">
                대기 중
              </span>
              <p className="text-sm text-gray-500 mt-2">
                {queue.meal_time} 식사 메이트를 찾는 중입니다...
              </p>
            </div>
            <Link
              href="/matching"
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              상세 보기
            </Link>
          </div>
        ) : match ? (
          <div className="flex items-center justify-between">
            <div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                매칭 완료
              </span>
              <p className="text-sm text-gray-500 mt-2">
                {match.meal_time} 메이트와 채팅을 시작해보세요!
              </p>
            </div>
            <Link
              href={`/chats/${match.id}`}
              className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              채팅하기
            </Link>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-400 text-sm mb-4">현재 매칭 신청이 없습니다.</p>
            <Link
              href="/matching"
              className="px-6 py-2.5 bg-orange-500 text-white font-semibold rounded-full hover:bg-orange-600 transition-colors text-sm"
            >
              밥 메이트 찾기
            </Link>
          </div>
        )}
      </div>

      {/* 빠른 링크 */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/matching"
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:border-orange-200 transition-colors group"
        >
          <div className="text-3xl mb-2">🤝</div>
          <h3 className="font-semibold text-gray-700 group-hover:text-orange-500">매칭 신청</h3>
          <p className="text-xs text-gray-400 mt-1">새 메이트 찾기</p>
        </Link>
        <Link
          href="/coupons"
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:border-orange-200 transition-colors group"
        >
          <div className="text-3xl mb-2">🎫</div>
          <h3 className="font-semibold text-gray-700 group-hover:text-orange-500">내 쿠폰</h3>
          <p className="text-xs text-gray-400 mt-1">보유 쿠폰 확인</p>
        </Link>
      </div>
    </div>
  );
}
