create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'employee'
    check (role in ('owner','employee','developer')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text unique,
  barcode text unique,
  category_id uuid references public.categories(id) on delete set null,
  unit text not null default 'piece',
  cost_price numeric(14,2) not null default 0 check (cost_price >= 0),
  selling_price numeric(14,2) not null default 0 check (selling_price >= 0),
  stock_quantity numeric(14,3) not null default 0 check (stock_quantity >= 0),
  reorder_level numeric(14,3) not null default 5 check (reorder_level >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  address text,
  created_at timestamptz not null default now()
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  address text,
  created_at timestamptz not null default now()
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  receipt_number text not null unique,
  customer_id uuid references public.customers(id) on delete set null,
  cashier_id uuid references public.profiles(id) on delete set null,
  subtotal numeric(14,2) not null default 0,
  discount numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  amount_paid numeric(14,2) not null default 0,
  balance numeric(14,2) not null default 0,
  payment_method text not null default 'cash',
  status text not null default 'completed'
    check (status in ('completed','voided','refunded')),
  created_at timestamptz not null default now()
);

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete restrict,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity numeric(14,3) not null check (quantity > 0),
  unit_price numeric(14,2) not null,
  unit_cost numeric(14,2) not null default 0,
  line_total numeric(14,2) not null
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete restrict,
  received_by uuid references public.profiles(id) on delete set null,
  amount numeric(14,2) not null check (amount > 0),
  method text not null default 'cash',
  reference_number text,
  created_at timestamptz not null default now()
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  user_id uuid references public.profiles(id) on delete set null,
  movement_type text not null,
  quantity_change numeric(14,3) not null,
  quantity_before numeric(14,3) not null,
  quantity_after numeric(14,3) not null,
  reference_id uuid,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references public.suppliers(id) on delete set null,
  invoice_number text,
  total numeric(14,2) not null default 0,
  amount_paid numeric(14,2) not null default 0,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity numeric(14,3) not null check (quantity > 0),
  unit_cost numeric(14,2) not null check (unit_cost >= 0),
  line_total numeric(14,2) not null
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'Other',
  amount numeric(14,2) not null check (amount > 0),
  payment_method text not null default 'cash',
  notes text,
  recorded_by uuid references public.profiles(id) on delete set null,
  expense_date date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.business_settings (
  id integer primary key default 1 check (id = 1),
  business_name text not null default 'StationeryPro',
  business_address text,
  business_phone text,
  business_email text,
  logo_url text,
  currency text not null default 'TZS',
  receipt_footer text default 'Thank you for your business.',
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

insert into public.business_settings(id)
values (1)
on conflict (id) do nothing;

create index if not exists products_name_idx
  on public.products(name);

create index if not exists sales_date_idx
  on public.sales(created_at desc);

create index if not exists sale_items_sale_idx
  on public.sale_items(sale_id);

create index if not exists expenses_date_idx
  on public.expenses(expense_date desc);

create or replace function public.current_role()
returns text
language sql stable security definer
set search_path = ''
as $$
  select role from public.profiles
  where id = (select auth.uid()) and is_active = true
  limit 1;
$$;

create or replace function public.is_manager()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and is_active = true
      and role in ('owner','developer')
  );
$$;

create or replace function public.create_profile_for_signup()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.profiles(id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name',''),
    'employee'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists auth_user_profile_trigger on auth.users;
create trigger auth_user_profile_trigger
after insert on auth.users
for each row execute function public.create_profile_for_signup();

-- Enable row-level security.
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.suppliers enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.payments enable row level security;
alter table public.stock_movements enable row level security;
alter table public.purchases enable row level security;
alter table public.purchase_items enable row level security;
alter table public.expenses enable row level security;
alter table public.business_settings enable row level security;
alter table public.audit_logs enable row level security;

-- Profiles: users read their own profile; managers read profiles.
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles
for select to authenticated
using (id = (select auth.uid()) or public.is_manager());

drop policy if exists profiles_manager_update on public.profiles;
create policy profiles_manager_update on public.profiles
for update to authenticated
using (public.is_manager())
with check (public.is_manager());

-- Products.
drop policy if exists products_read on public.products;
create policy products_read on public.products
for select to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.is_active
  )
);

drop policy if exists products_manager_write on public.products;
create policy products_manager_write on public.products
for all to authenticated
using (public.is_manager())
with check (public.is_manager());

-- Categories.
drop policy if exists categories_manager_all on public.categories;
create policy categories_manager_all on public.categories
for all to authenticated
using (public.is_manager())
with check (public.is_manager());

-- Customers: authenticated staff may manage customers.
drop policy if exists customers_staff_all on public.customers;
create policy customers_staff_all on public.customers
for all to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.is_active
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.is_active
  )
);

-- Sales can be created only through the transaction function below.
drop policy if exists sales_read on public.sales;
create policy sales_read on public.sales
for select to authenticated
using (cashier_id = (select auth.uid()) or public.is_manager());

drop policy if exists sales_manager_update on public.sales;
create policy sales_manager_update on public.sales
for update to authenticated
using (public.is_manager())
with check (public.is_manager());

drop policy if exists sale_items_read on public.sale_items;
create policy sale_items_read on public.sale_items
for select to authenticated
using (
  exists (
    select 1 from public.sales s
    where s.id = sale_id
      and (s.cashier_id = (select auth.uid()) or public.is_manager())
  )
);

drop policy if exists payments_read on public.payments;
create policy payments_read on public.payments
for select to authenticated
using (received_by = (select auth.uid()) or public.is_manager());

drop policy if exists stock_read on public.stock_movements;
create policy stock_read on public.stock_movements
for select to authenticated
using (public.is_manager());

-- Purchases and suppliers: managers only.
drop policy if exists suppliers_manager_all on public.suppliers;
create policy suppliers_manager_all on public.suppliers
for all to authenticated
using (public.is_manager())
with check (public.is_manager());

drop policy if exists purchases_manager_all on public.purchases;
create policy purchases_manager_all on public.purchases
for all to authenticated
using (public.is_manager())
with check (public.is_manager());

drop policy if exists purchase_items_manager_all on public.purchase_items;
create policy purchase_items_manager_all on public.purchase_items
for all to authenticated
using (public.is_manager())
with check (public.is_manager());

-- Expenses: employees may record expenses; only managers can read all.
drop policy if exists expenses_read on public.expenses;
create policy expenses_read on public.expenses
for select to authenticated
using (recorded_by = (select auth.uid()) or public.is_manager());

drop policy if exists expenses_insert on public.expenses;
create policy expenses_insert on public.expenses
for insert to authenticated
with check (
  recorded_by = (select auth.uid())
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.is_active
  )
);

drop policy if exists expenses_manager_update on public.expenses;
create policy expenses_manager_update on public.expenses
for update to authenticated
using (public.is_manager())
with check (public.is_manager());

-- Settings.
drop policy if exists settings_read on public.business_settings;
create policy settings_read on public.business_settings
for select to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.is_active
  )
);

drop policy if exists settings_manager_update on public.business_settings;
create policy settings_manager_update on public.business_settings
for update to authenticated
using (public.is_manager())
with check (public.is_manager());

-- Audit trail: managers can view it.
drop policy if exists audit_manager_read on public.audit_logs;
create policy audit_manager_read on public.audit_logs
for select to authenticated
using (public.is_manager());

-- The transaction function validates price and stock in the database.
create or replace function public.complete_sale(
  p_items jsonb,
  p_payment_method text default 'cash',
  p_amount_paid numeric default null,
  p_customer_id uuid default null,
  p_discount numeric default 0
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_sale_id uuid := gen_random_uuid();
  v_receipt text;
  v_subtotal numeric(14,2) := 0;
  v_total numeric(14,2);
  v_paid numeric(14,2);
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty numeric(14,3);
  v_line numeric(14,2);
begin
  if v_uid is null then raise exception 'Login required'; end if;

  if not exists (
    select 1 from public.profiles
    where id = v_uid and is_active = true
  ) then raise exception 'Account inactive'; end if;

  if jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 then
    raise exception 'Cart is empty';
  end if;

  if p_payment_method not in ('cash','mobile_money','bank','card','credit','other') then
    raise exception 'Invalid payment method';
  end if;

  if coalesce(p_discount,0) < 0 then
    raise exception 'Invalid discount';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::numeric;
    if v_qty <= 0 then raise exception 'Invalid quantity'; end if;

    select * into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid
      and is_active = true
    for update;

    if not found then raise exception 'Product unavailable'; end if;
    if v_product.stock_quantity < v_qty then
      raise exception 'Insufficient stock: %', v_product.name;
    end if;

    v_subtotal := v_subtotal + v_qty * v_product.selling_price;
  end loop;

  if p_discount > v_subtotal then raise exception 'Discount too high'; end if;

  v_total := v_subtotal - coalesce(p_discount,0);
  v_paid := least(v_total, greatest(0, coalesce(p_amount_paid,0)));

  v_receipt := 'SP-' ||
    to_char(clock_timestamp(),'YYYYMMDD-HH24MISS') || '-' ||
    upper(substr(replace(v_sale_id::text,'-',''),1,6));

  insert into public.sales(
    id, receipt_number, customer_id, cashier_id,
    subtotal, discount, total, amount_paid, balance, payment_method
  )
  values (
    v_sale_id, v_receipt, p_customer_id, v_uid,
    v_subtotal, coalesce(p_discount,0), v_total, v_paid,
    v_total-v_paid, p_payment_method
  );

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::numeric;

    select * into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid
    for update;

    v_line := v_qty * v_product.selling_price;

    insert into public.sale_items(
      sale_id, product_id, product_name, quantity,
      unit_price, unit_cost, line_total
    )
    values (
      v_sale_id, v_product.id, v_product.name, v_qty,
      v_product.selling_price, v_product.cost_price, v_line
    );

    update public.products
    set stock_quantity = stock_quantity - v_qty,
        updated_at = now()
    where id = v_product.id;

    insert into public.stock_movements(
      product_id, user_id, movement_type, quantity_change,
      quantity_before, quantity_after, reference_id, reason
    )
    values (
      v_product.id, v_uid, 'sale', -v_qty,
      v_product.stock_quantity, v_product.stock_quantity-v_qty,
      v_sale_id, 'Sale ' || v_receipt
    );
  end loop;

  if v_paid > 0 then
    insert into public.payments(sale_id,received_by,amount,method)
    values (v_sale_id,v_uid,v_paid,p_payment_method);
  end if;

  insert into public.audit_logs(user_id,action,entity_type,entity_id,details)
  values (
    v_uid,'complete_sale','sale',v_sale_id,
    jsonb_build_object('receipt',v_receipt,'total',v_total,'paid',v_paid)
  );

  return jsonb_build_object(
    'success',true,
    'sale_id',v_sale_id,
    'receipt_number',v_receipt,
    'subtotal',v_subtotal,
    'discount',p_discount,
    'total',v_total,
    'amount_paid',v_paid,
    'balance',v_total-v_paid
  );
end;
$$;

revoke all on function public.complete_sale(jsonb,text,numeric,uuid,numeric) from public;
grant execute on function public.complete_sale(jsonb,text,numeric,uuid,numeric) to authenticated;

grant usage on schema public to authenticated;
grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant select, insert, update, delete on public.customers to authenticated;
grant select, insert, update, delete on public.suppliers to authenticated;
grant select, update on public.sales to authenticated;
grant select on public.sale_items to authenticated;
grant select on public.payments to authenticated;
grant select on public.stock_movements to authenticated;
grant select, insert, update, delete on public.purchases to authenticated;
grant select, insert, update, delete on public.purchase_items to authenticated;
grant select, insert, update on public.expenses to authenticated;
grant select, update on public.business_settings to authenticated;
grant select on public.audit_logs to authenticated;

-- Backfill profiles for accounts that already exist.
insert into public.profiles(id,full_name,role)
select id, coalesce(raw_user_meta_data->>'full_name',''), 'employee'
from auth.users
on conflict (id) do nothing;