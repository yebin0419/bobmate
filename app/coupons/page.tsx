import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CouponsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: coupons } = await supabase
    .from("coupons")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const active = coupons?.filter((c) => !c.is_used) ?? [];
  const used = coupons?.filter((c) => c.is_used) ?? [];

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">🎫 내 쿠폰함</h1>

      {coupons?.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">🎫</div>
          <p>아직 쿠폰이 없습니다.</p>
          <p className="text-sm mt-1">회원가입 인증을 완료하면 쿠폰을 받을 수 있어요!</p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                사용 가능 ({active.length})
              </h2>
              <div className="space-y-3">
                {active.map((coupon) => (
                  <div
                    key={coupon.id}
                    className="bg-white rounded-2xl border border-orange-200 shadow-sm overflow-hidden flex"
                  >
                    <div className="w-2 bg-orange-400 shrink-0" />
                    <div className="p-5 flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-gray-800">{coupon.store_name}</p>
                          <p className="text-orange-600 font-medium text-sm mt-0.5">{coupon.benefit}</p>
                        </div>
                        <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-medium">
                          사용 가능
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-3">
                        유효기간: {formatDate(coupon.expires_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {used.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                사용 완료 ({used.length})
              </h2>
              <div className="space-y-3 opacity-50">
                {used.map((coupon) => (
                  <div
                    key={coupon.id}
                    className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden flex"
                  >
                    <div className="w-2 bg-gray-300 shrink-0" />
                    <div className="p-5 flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-gray-500 line-through">{coupon.store_name}</p>
                          <p className="text-gray-400 text-sm mt-0.5 line-through">{coupon.benefit}</p>
                        </div>
                        <span className="text-xs bg-gray-200 text-gray-500 px-2 py-1 rounded-full font-medium">
                          사용 완료
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
