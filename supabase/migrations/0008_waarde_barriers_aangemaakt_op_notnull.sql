-- Migration 0005 added the aangemaakt_op column and back-filled it from
-- created_at::date, so every existing row now has a value. Enforce NOT NULL
-- and set the DEFAULT so new inserts that omit the column get today's date.

alter table public.waarde_barriers
  alter column aangemaakt_op set default current_date,
  alter column aangemaakt_op set not null;
