-- ============================================================
-- 밥 메이트 매칭 서비스 - Supabase Schema
-- Supabase SQL Editor에서 순서대로 실행하세요.
-- ============================================================

-- 1. users 테이블
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nickname text not null,
  school_domain text not null,
  created_at timestamptz default now()
);

-- 2. coupons 테이블
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  store_name text not null,
  benefit text not null,
  expires_at timestamptz not null,
  is_used boolean not null default false,
  created_at timestamptz default now()
);

-- 3. match_queue 테이블
create table if not exists public.match_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  meal_time text not null check (meal_time in ('아침', '점심', '저녁')),
  status text not null default 'waiting' check (status in ('waiting', 'matched', 'cancelled')),
  created_at timestamptz default now()
);

-- 4. matches 테이블
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references public.users(id) on delete cascade,
  user_b_id uuid not null references public.users(id) on delete cascade,
  meal_time text not null check (meal_time in ('아침', '점심', '저녁')),
  created_at timestamptz default now()
);

-- 5. messages 테이블
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

-- ============================================================
-- RLS (Row Level Security) 설정
-- ============================================================

alter table public.users enable row level security;
alter table public.coupons enable row level security;
alter table public.match_queue enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;

-- users: 본인 프로필 읽기/쓰기, 다른 사람 프로필 읽기(닉네임 조회용)
create policy "users_select" on public.users for select using (true);
create policy "users_insert" on public.users for insert with check (auth.uid() = id);
create policy "users_update" on public.users for update using (auth.uid() = id);

-- coupons: 본인 쿠폰만
create policy "coupons_select" on public.coupons for select using (auth.uid() = user_id);
create policy "coupons_insert" on public.coupons for insert with check (auth.uid() = user_id);
create policy "coupons_update" on public.coupons for update using (auth.uid() = user_id);

-- match_queue: 본인 항목만
create policy "queue_select" on public.match_queue for select using (auth.uid() = user_id);
create policy "queue_insert" on public.match_queue for insert with check (auth.uid() = user_id);
create policy "queue_update" on public.match_queue for update using (auth.uid() = user_id);

-- matches: 본인이 포함된 매칭만
create policy "matches_select" on public.matches
  for select using (auth.uid() = user_a_id or auth.uid() = user_b_id);
create policy "matches_insert" on public.matches for insert with check (
  auth.uid() = user_a_id or auth.uid() = user_b_id
);

-- messages: 해당 match에 속한 사용자만
create policy "messages_select" on public.messages
  for select using (
    exists (
      select 1 from public.matches m
      where m.id = match_id
        and (m.user_a_id = auth.uid() or m.user_b_id = auth.uid())
    )
  );
create policy "messages_insert" on public.messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.matches m
      where m.id = match_id
        and (m.user_a_id = auth.uid() or m.user_b_id = auth.uid())
    )
  );

-- ============================================================
-- Realtime 활성화 (messages 테이블)
-- Supabase Dashboard > Database > Replication 에서도 설정 가능
-- ============================================================
alter publication supabase_realtime add table public.messages;

-- ============================================================
-- API Route에서 서비스 롤로 match_queue/matches 업데이트를 위한 정책
-- (match join API는 서버에서 service_role key를 사용하므로 별도 정책 불필요)
-- 단, anon/authenticated 역할로 상대방 queue를 update해야 하는 경우 추가:
-- ============================================================
create policy "queue_update_matched" on public.match_queue
  for update using (true);  -- API route에서만 호출됨 (필요 시 service_role key 사용으로 대체)

create policy "matches_insert_any" on public.matches
  for insert with check (true);  -- API route에서만 호출됨
