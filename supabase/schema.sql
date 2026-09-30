-- Initial schema for InventarioWeb. Apply once to a new Supabase project.
-- Ownership is enforced in Postgres; browser filtering is not an authorization boundary.

create table public.inventory_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 100),
  created_at timestamptz not null default now(),
  constraint inventory_categories_user_name_key unique (user_id, name),
  constraint inventory_categories_id_user_key unique (id, user_id)
);

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  code text not null check (char_length(btrim(code)) between 1 and 50),
  name text not null check (char_length(btrim(name)) between 1 and 150),
  sku text,
  brand text,
  model text,
  department text not null check (char_length(btrim(department)) between 1 and 100),
  notes text check (notes is null or char_length(notes) <= 500),
  category_id uuid not null,
  price numeric(12, 2) check (price is null or price >= 0),
  quantity integer not null default 0 check (quantity >= 0),
  reorder_level integer not null default 8 check (reorder_level >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inventory_items_user_code_key unique (user_id, code),
  constraint inventory_items_id_user_key unique (id, user_id),
  constraint inventory_items_category_owner_fkey
    foreign key (category_id, user_id)
    references public.inventory_categories (id, user_id)
    on delete restrict
);

create index inventory_items_user_updated_idx
  on public.inventory_items (user_id, updated_at desc);
create index inventory_items_user_category_idx
  on public.inventory_items (user_id, category_id);
create index inventory_items_user_quantity_idx
  on public.inventory_items (user_id, quantity);

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  item_id uuid not null,
  delta integer not null check (delta <> 0),
  reason text not null check (char_length(btrim(reason)) between 1 and 120),
  created_at timestamptz not null default now(),
  constraint stock_movements_item_owner_fkey
    foreign key (item_id, user_id)
    references public.inventory_items (id, user_id)
    on delete cascade
);

create index stock_movements_user_created_idx
  on public.stock_movements (user_id, created_at desc);
create index stock_movements_item_created_idx
  on public.stock_movements (item_id, created_at desc);

alter table public.inventory_categories enable row level security;
alter table public.inventory_items enable row level security;
alter table public.stock_movements enable row level security;

revoke all on table public.inventory_categories from public, anon, authenticated;
revoke all on table public.inventory_items from public, anon, authenticated;
revoke all on table public.stock_movements from public, anon, authenticated;
grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.inventory_categories to authenticated;
grant select, insert, update, delete on table public.inventory_items to authenticated;
grant select on table public.stock_movements to authenticated;
grant insert (item_id, delta, reason) on table public.stock_movements to authenticated;

create policy "Users read their own categories"
  on public.inventory_categories for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users create their own categories"
  on public.inventory_categories for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users update their own categories"
  on public.inventory_categories for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users delete their own categories"
  on public.inventory_categories for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users read their own items"
  on public.inventory_items for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users create their own items"
  on public.inventory_items for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users update their own items"
  on public.inventory_items for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users delete their own items"
  on public.inventory_items for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users read their own stock movements"
  on public.stock_movements for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users record their own stock movements"
  on public.stock_movements for insert to authenticated
  with check ((select auth.uid()) = user_id);

create function public.set_inventory_item_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

create trigger inventory_items_set_updated_at
  before update on public.inventory_items
  for each row execute function public.set_inventory_item_updated_at();

-- Appending a movement updates quantity under the same transaction. RLS on the
-- items table still applies because this is an invoker (not definer) trigger.
create function public.apply_stock_movement()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or new.user_id <> (select auth.uid()) then
    raise exception 'A signed-in owner is required to record stock movements'
      using errcode = '42501';
  end if;

  update public.inventory_items as item
     set quantity = item.quantity + new.delta
   where item.id = new.item_id
     and item.user_id = new.user_id
     and item.quantity + new.delta >= 0;
  if not found then
    raise exception 'Item not found or stock would become negative'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger stock_movements_apply_delta
  after insert on public.stock_movements
  for each row execute function public.apply_stock_movement();

revoke all on function public.set_inventory_item_updated_at() from public, anon, authenticated;
revoke all on function public.apply_stock_movement() from public, anon, authenticated;
