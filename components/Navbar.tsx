"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const links = [
    { href: "/home", label: "홈" },
    { href: "/chats", label: "채팅" },
    { href: "/coupons", label: "쿠폰함" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-16">
      <div className="max-w-2xl mx-auto px-4 h-full flex items-center justify-between">
        <Link href="/home" className="text-orange-500 font-bold text-xl">
          🍚 밥 메이트
        </Link>
        <div className="flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith(link.href)
                  ? "bg-orange-100 text-orange-600"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="ml-2 px-3 py-2 text-sm font-medium text-gray-500 hover:text-red-500 transition-colors"
          >
            로그아웃
          </button>
        </div>
      </div>
    </nav>
  );
}
