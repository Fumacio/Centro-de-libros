-- Esquema de la base (Postgres / Neon). Se puede volver a correr sin romper nada.

create table if not exists usuarios (
  id bigserial primary key,
  nombre text not null,
  email text not null unique,
  clave_hash text not null,
  creado timestamptz not null default now()
);

create table if not exists sesiones (
  token_hash text primary key,
  usuario_id bigint not null references usuarios(id) on delete cascade,
  vence timestamptz not null
);
create index if not exists sesiones_usuario on sesiones(usuario_id);

-- Un libro que el usuario abrió para leer, y por dónde va.
create table if not exists lecturas (
  usuario_id bigint not null references usuarios(id) on delete cascade,
  libro text not null,
  pagina int not null default 0,
  total int,
  actualizado timestamptz not null default now(),
  primary key (usuario_id, libro)
);

create table if not exists busquedas (
  id bigserial primary key,
  usuario_id bigint not null references usuarios(id) on delete cascade,
  texto text not null,
  categoria text,
  creado timestamptz not null default now()
);
create index if not exists busquedas_usuario on busquedas(usuario_id, creado desc);

create table if not exists favoritos (
  usuario_id bigint not null references usuarios(id) on delete cascade,
  libro text not null,
  creado timestamptz not null default now(),
  primary key (usuario_id, libro)
);
