begin;

create table public.post_tags (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  tagged_by uuid not null references public.profiles(id) on delete cascade,
  tagged_user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status = any (array['pending'::text, 'accepted'::text, 'hidden'::text, 'removed'::text])),
  created_at timestamptz not null default now(),
  constraint post_tags_unique_user_per_post unique (post_id, tagged_user_id),
  constraint post_tags_no_self_tag check (tagged_by <> tagged_user_id)
);

create index post_tags_recipient_status_created_idx
  on public.post_tags (tagged_user_id, status, created_at desc);

alter table public.post_tags enable row level security;
revoke all on public.post_tags from anon, authenticated;
grant select on public.post_tags to anon, authenticated;
grant insert on public.post_tags to authenticated;
grant update (status) on public.post_tags to authenticated;

create policy post_tags_select_relevant
  on public.post_tags for select to anon, authenticated
  using (
    tagged_by = (select auth.uid())
    or tagged_user_id = (select auth.uid())
    or (
      status = 'accepted'
      and exists (select 1 from public.posts p where p.id = post_tags.post_id)
    )
  );

create policy post_tags_insert_by_post_author
  on public.post_tags for insert to authenticated
  with check (
    tagged_by = (select auth.uid())
    and exists (
      select 1 from public.posts p
      where p.id = post_tags.post_id and p.author_id = (select auth.uid())
    )
  );

create policy post_tags_update_by_tagged_user
  on public.post_tags for update to authenticated
  using (tagged_user_id = (select auth.uid()))
  with check (
    tagged_user_id = (select auth.uid())
    and status = any (array['accepted'::text, 'hidden'::text, 'removed'::text])
  );

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  tag_id uuid not null references public.post_tags(id) on delete cascade,
  type text not null default 'post_tag' check (type = 'post_tag'),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_unique_tag unique (recipient_id, tag_id)
);

create index notifications_recipient_created_idx
  on public.notifications (recipient_id, created_at desc);

alter table public.notifications enable row level security;
revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

create policy notifications_select_own
  on public.notifications for select to authenticated
  using (recipient_id = (select auth.uid()));

create policy notifications_mark_own_read
  on public.notifications for update to authenticated
  using (recipient_id = (select auth.uid()))
  with check (recipient_id = (select auth.uid()));

create function public.notify_post_tag_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (recipient_id, actor_id, post_id, tag_id)
  values (new.tagged_user_id, new.tagged_by, new.post_id, new.id)
  on conflict (recipient_id, tag_id) do nothing;
  return new;
end;
$$;

revoke all on function public.notify_post_tag_created() from public, anon, authenticated;

create trigger post_tags_notify_recipient
  after insert on public.post_tags
  for each row execute function public.notify_post_tag_created();

commit;
