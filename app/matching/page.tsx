"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type QueueStatus = "idle" | "waiting" | "matched";

export default function MatchingPage() {
  const [status, setStatus] = useState<QueueStatus>("idle");
  const [mealTime, setMealTime] = useState("점심");
  const [matchId, setMatchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkCurrentStatus();
  }, []);

  const checkCurrentStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: queue } = await supabase
      .from("match_queue")
      .select("id, status, meal_time")
      .eq("user_id", user.id)
      .eq("status", "waiting")
      .maybeSingle();

    if (queue) {
      setStatus("waiting");
      setMealTime(queue.meal_time);
      return;
    }

    const { data: match } = await supabase
      .from("matches")
      .select("id")
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (match) {
      setStatus("matched");
      setMatchId(match.id);
    }
  };

  const handleJoin = async () => {
    setLoading(true);
    setError("");
    const res = await fetch("/api/matching/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meal_time: mealTime }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "오류가 발생했습니다.");
    } else if (data.status === "matched") {
      setStatus("matched");
      setMatchId(data.match_id);
    } else {
      setStatus("waiting");
    }
    setLoading(false);
  };

  const handleCancel = async () => {
    setLoading(true);
    const res = await fetch("/api/matching/cancel", { method: "DELETE" });
    if (res.ok) {
      setStatus("idle");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">밥 메이트 매칭</h1>

      {status === "matched" && matchId ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-xl font-bold text-green-700 mb-2">매칭 성공!</h2>
          <p className="text-green-600 text-sm mb-6">메이트를 찾았어요! 채팅방이 열렸습니다.</p>
          <button
            onClick={() => router.push(`/chats/${matchId}`)}
            className="px-8 py-3 bg-green-500 text-white font-semibold rounded-full hover:bg-green-600 transition-colors"
          >
            채팅하러 가기
          </button>
        </div>
      ) : status === "waiting" ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4 animate-pulse">⏳</div>
          <h2 className="text-xl font-bold text-yellow-700 mb-2">메이트 찾는 중...</h2>
          <p className="text-yellow-600 text-sm mb-1">
            <span className="font-medium">{mealTime}</span> 식사 메이트를 기다리고 있어요.
          </p>
          <p className="text-yellow-500 text-xs mb-6">같은 학교 학생이 신청하면 자동으로 매칭됩니다.</p>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="px-6 py-2.5 border-2 border-yellow-400 text-yellow-600 font-semibold rounded-full hover:bg-yellow-100 transition-colors disabled:opacity-50"
          >
            {loading ? "처리 중..." : "대기 취소"}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="font-semibold text-gray-700 mb-6">식사 시간대를 선택하세요</h2>

          <div className="flex gap-3 mb-8">
            {["아침", "점심", "저녁"].map((t) => (
              <button
                key={t}
                onClick={() => setMealTime(t)}
                className={`flex-1 py-4 rounded-xl border-2 font-medium transition-all ${
                  mealTime === t
                    ? "border-orange-400 bg-orange-50 text-orange-600"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <span className="block text-2xl mb-1">
                  {t === "아침" ? "🌅" : t === "점심" ? "☀️" : "🌙"}
                </span>
                {t}
              </button>
            ))}
          </div>

          {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

          <button
            onClick={handleJoin}
            disabled={loading}
            className="w-full py-3 bg-orange-500 text-white font-semibold rounded-full hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {loading ? "신청 중..." : "매칭 신청하기"}
          </button>
        </div>
      )}
    </div>
  );
}
