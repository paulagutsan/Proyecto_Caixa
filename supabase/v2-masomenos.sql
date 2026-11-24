-- Horizonte v2 · añade el juego «Más o menos» a Amigos. Ejecutar una vez en SQL Editor → Run.

-- Juegos y límites (se puede ejecutar aunque la tabla ya existiera): «Más o menos» guarda la racha, sin tope de 10
do $$ declare c record; begin
    for c in select conname from pg_constraint where conrelid = 'public.v2_partidas'::regclass and contype = 'c' loop
        execute format('alter table public.v2_partidas drop constraint %I', c.conname);
    end loop;
end $$;
alter table public.v2_partidas add constraint v2_partidas_juego_check check (juego in ('titular', 'duelo', 'masomenos'));
alter table public.v2_partidas add constraint v2_partidas_limites check (aciertos between 0 and 500 and rondas between 1 and 501 and aciertos <= rondas);
