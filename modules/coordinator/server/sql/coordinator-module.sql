create extension if not exists pgcrypto;

create table if not exists placement_coordinators (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    enrollment_no text not null unique,
    email text,
    department text not null,
    year text not null,
    created_at timestamptz not null default now()
);

create table if not exists forms (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    description text,
    slug text not null unique,
    status text not null default 'draft',
    is_public boolean not null default true,
    theme_settings jsonb not null default '{}'::jsonb,
    deadline timestamptz,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists form_fields (
    id uuid primary key default gen_random_uuid(),
    form_id uuid not null references forms(id) on delete cascade,
    label text not null,
    field_type text not null,
    required boolean not null default false,
    options jsonb,
    sort_order integer not null default 0,
    created_at timestamptz not null default now()
);

create table if not exists form_responses (
    id uuid primary key default gen_random_uuid(),
    form_id uuid not null references forms(id) on delete cascade,
    answers jsonb not null,
    status text not null default 'pending',
    notes text,
    submitted_at timestamptz not null default now()
);

create index if not exists idx_placement_coordinators_name on placement_coordinators(name);
create index if not exists idx_form_fields_form_id on form_fields(form_id);
create index if not exists idx_form_fields_sort_order on form_fields(form_id, sort_order);
create index if not exists idx_form_responses_form_id on form_responses(form_id);
create index if not exists idx_forms_status_public on forms(status, is_public);
