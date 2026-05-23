import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 px-4">
      <div className="text-center max-w-lg">
        <div className="text-7xl mb-6">🍚</div>
        <h1 className="text-4xl font-bold text-gray-800 mb-4">밥 메이트</h1>
        <p className="text-lg text-gray-600 mb-2">혼밥은 이제 그만!</p>
        <p className="text-gray-500 mb-10">
          같은 학교 학생들과 함께 밥 먹을 메이트를 찾아보세요.
          <br />
          매칭 성사 시 주변 맛집 쿠폰도 드려요.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="px-8 py-3 bg-orange-500 text-white font-semibold rounded-full hover:bg-orange-600 transition-colors"
          >
            시작하기
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 border-2 border-orange-500 text-orange-500 font-semibold rounded-full hover:bg-orange-50 transition-colors"
          >
            로그인
          </Link>
        </div>
      </div>
    </div>
  );
}
