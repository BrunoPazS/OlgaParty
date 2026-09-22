-- Festa da Olga: cole tudo no Supabase em SQL Editor > New query > Run.
-- Antes de executar, substitua os dois e-mails abaixo pelos e-mails que Bruno
-- e Mariana usarão para entrar na aplicação.

create table if not exists public.party_boards (
  id text primary key,
  data jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.party_boards enable row level security;

create or replace function public.is_olga_party_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (auth.jwt() ->> 'email') in (
    'oi@brunoasilva.com',
    'marianaopaz@gmail.com'
  );
$$;

grant usage on schema public to authenticated;
grant select, insert, update on public.party_boards to authenticated;

drop policy if exists "Membros podem ver o planejamento" on public.party_boards;
drop policy if exists "Membros podem criar o planejamento" on public.party_boards;
drop policy if exists "Membros podem atualizar o planejamento" on public.party_boards;

create policy "Membros podem ver o planejamento"
on public.party_boards for select to authenticated
using (public.is_olga_party_member() and id = 'olga');

create policy "Membros podem criar o planejamento"
on public.party_boards for insert to authenticated
with check (public.is_olga_party_member() and id = 'olga');

create policy "Membros podem atualizar o planejamento"
on public.party_boards for update to authenticated
using (public.is_olga_party_member() and id = 'olga')
with check (public.is_olga_party_member() and id = 'olga');

alter publication supabase_realtime add table public.party_boards;
