import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ChatsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: matches } = await supabase
    .from("matches")
    .select("id, meal_time, created_at, user_a_id, user_b_id")
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  const matchesWithInfo = await Promise.all(
    (matches ?? []).map(async (match) => {
      const partnerId = match.user_a_id === user.id ? match.user_b_id : match.user_a_id;

      const { data: partner } = await supabase
        .from("users")
        .select("nickname")
        .eq("id", partnerId)
        .single();

      const { data: lastMsg } = await supabase
        .from("messages")
        .select("content, created_at")
        .eq("match_id", match.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        ...match,
        partnerNickname: partner?.nickname ?? "알 수 없음",
        lastMessage: lastMsg?.content ?? null,
        lastMessageAt: lastMsg?.created_at ?? match.created_at,
      };
    })
  );

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "방금";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
    return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">💬 채팅</h1>

      {matchesWithInfo.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">💬</div>
          <p>아직 채팅방이 없습니다.</p>
          <p className="text-sm mt-1">밥 메이트 매칭 후 채팅이 시작돼요!</p>
          <Link
            href="/matching"
            className="mt-4 inline-block px-6 py-2.5 bg-orange-500 text-white font-semibold rounded-full hover:bg-orange-600 text-sm"
          >
            매칭 신청하기
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {matchesWithInfo.map((m) => (
            <Link
              key={m.id}
              href={`/chats/${m.id}`}
              className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-4 hover:border-orange-200 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-xl shrink-0">
                🍽️
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="font-semibold text-gray-800 truncate">{m.partnerNickname}</p>
                  <span className="text-xs text-gray-400 shrink-0 ml-2">{formatTime(m.lastMessageAt)}</span>
                </div>
                <p className="text-sm text-gray-500 truncate">
                  {m.lastMessage ?? `${m.meal_time} 메이트와 채팅을 시작해보세요!`}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
