import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ChatRoom from "./ChatRoom";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ChatPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: match } = await supabase
    .from("matches")
    .select("id, meal_time, user_a_id, user_b_id")
    .eq("id", id)
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .single();

  if (!match) redirect("/chats");

  const partnerId = match.user_a_id === user.id ? match.user_b_id : match.user_a_id;

  const { data: partner } = await supabase
    .from("users")
    .select("nickname")
    .eq("id", partnerId)
    .single();

  const { data: messages } = await supabase
    .from("messages")
    .select("id, content, sender_id, created_at")
    .eq("match_id", id)
    .order("created_at", { ascending: true });

  return (
    <ChatRoom
      matchId={id}
      currentUserId={user.id}
      partnerNickname={partner?.nickname ?? "상대방"}
      mealTime={match.meal_time}
      initialMessages={messages ?? []}
    />
  );
}
