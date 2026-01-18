-- ==========================================
-- SCRIPT DE REPARACIÓN DE BASE DE DATOS
-- Ejecuta TODO este script en el Editor SQL de Supabase
-- ==========================================
-- 1. Crear tabla de eventos si no existe (corrige error "relation events does not exist")
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES club_members(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    event_time TEXT,
    -- Nueva columna
    location TEXT,
    -- Nueva columna
    event_type TEXT DEFAULT 'general',
    emoji TEXT DEFAULT '📅',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 2. Asegurarse de que las columnas nuevas existan (si la tabla ya existía parcialmente)
ALTER TABLE events
ADD COLUMN IF NOT EXISTS event_time TEXT;
ALTER TABLE events
ADD COLUMN IF NOT EXISTS location TEXT;
-- 3. Habilitar seguridad (RLS) para eventos
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
-- 4. Crear políticas de seguridad para eventos (si no existen, el 'DO block' maneja errores de duplicados, o usamos CREATE POLICY IF NOT EXISTS en Postgres 9+)
-- Nota: Supabase usa Postgres 15+, IF NOT EXISTS es válido.
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'events'
        AND policyname = 'Anyone can read events'
) THEN CREATE POLICY "Anyone can read events" ON events FOR
SELECT USING (true);
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'events'
        AND policyname = 'Anyone can insert events'
) THEN CREATE POLICY "Anyone can insert events" ON events FOR
INSERT WITH CHECK (true);
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'events'
        AND policyname = 'Anyone can delete events'
) THEN CREATE POLICY "Anyone can delete events" ON events FOR DELETE USING (true);
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'events'
        AND policyname = 'Anyone can update events'
) THEN CREATE POLICY "Anyone can update events" ON events FOR
UPDATE USING (true);
END IF;
END $$;
-- 5. Añadir columna 'story' para la funcionalidad de historias de usuario
ALTER TABLE club_members
ADD COLUMN IF NOT EXISTS story TEXT;
-- 6. Habilitar Realtime para 'events' (Instrucción manual)
-- Recuerda ir a Database -> Replication y activar events si quieres actualizaciones en tiempo real.