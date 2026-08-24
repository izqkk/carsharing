-- ---------------------------------------------------------------------------
-- Carshare -- database schema
--
-- Paste this whole file into the Supabase SQL Editor and run it once. It is
-- idempotent: running it again after an update is safe and changes nothing
-- that is already in place.
--
-- Trust model: everyone who can sign in belongs to the same group and can SEE
-- every booking -- that is the point of a shared calendar. Writes are
-- restricted to the row's owner, so nobody can edit or delete somebody else's
-- booking. If you need stricter isolation than that, this is the file to
-- change.
-- ---------------------------------------------------------------------------


-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- One row per person, created automatically on sign-up (see the trigger at the
-- bottom). `id` is the Supabase auth user id.
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#3b82f6',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Older installs predate the avatar feature.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- A single, concrete reservation.
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    is_all_day BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- A rule ("every Wednesday 19:00-22:00"). Occurrences are expanded in the
-- client for the week on screen and are never stored as rows.
CREATE TABLE IF NOT EXISTS recurring_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    recurrence_type TEXT NOT NULL CHECK (recurrence_type IN ('daily', 'weekly', 'monthly')),
    -- Weekly rules store weekdays (0 = Sunday .. 6 = Saturday).
    -- Monthly rules reuse the same column for days of the month (1..31).
    day_of_week INTEGER[] NOT NULL DEFAULT '{}',
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    valid_from DATE NOT NULL,
    valid_until DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_start_time ON bookings(start_time);
CREATE INDEX IF NOT EXISTS idx_recurring_events_user_id ON recurring_events(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_events_active ON recurring_events(is_active);


-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- Without RLS enabled, the anon key -- which ships inside the JavaScript
-- bundle and is readable by anyone -- would grant full table access. These
-- policies are the actual access control.
-- ---------------------------------------------------------------------------

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_events ENABLE ROW LEVEL SECURITY;

-- Postgres has no CREATE POLICY IF NOT EXISTS, so each policy is dropped first
-- to keep this script re-runnable.

DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
CREATE POLICY "Users can view all profiles"
    ON profiles FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view all bookings" ON bookings;
CREATE POLICY "Users can view all bookings"
    ON bookings FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Users can insert own bookings" ON bookings;
CREATE POLICY "Users can insert own bookings"
    ON bookings FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;
CREATE POLICY "Users can update own bookings"
    ON bookings FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own bookings" ON bookings;
CREATE POLICY "Users can delete own bookings"
    ON bookings FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view all recurring events" ON recurring_events;
CREATE POLICY "Users can view all recurring events"
    ON recurring_events FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Users can insert own recurring events" ON recurring_events;
CREATE POLICY "Users can insert own recurring events"
    ON recurring_events FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own recurring events" ON recurring_events;
CREATE POLICY "Users can update own recurring events"
    ON recurring_events FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own recurring events" ON recurring_events;
CREATE POLICY "Users can delete own recurring events"
    ON recurring_events FOR DELETE TO authenticated
    USING (auth.uid() = user_id);


-- ---------------------------------------------------------------------------
-- Avatar storage
--
-- Profile pictures are uploaded to `avatars/<user-id>/<timestamp>.<ext>`, so
-- the first path segment identifies the owner and the write policies can key
-- off it.
--
-- If your project restricts DDL on the storage schema, create the bucket in
-- Dashboard -> Storage (name `avatars`, public) and add the four policies in
-- Storage -> Policies instead. Skipping this section only disables profile
-- pictures; everything else works.
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Public read: the app renders avatars via `getPublicUrl()`, which issues no
-- auth header. Treat uploaded pictures as world-readable.
DROP POLICY IF EXISTS "Avatars are publicly readable" ON storage.objects;
CREATE POLICY "Avatars are publicly readable"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Users can replace own avatar" ON storage.objects;
CREATE POLICY "Users can replace own avatar"
    ON storage.objects FOR UPDATE TO authenticated
    USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
    ON storage.objects FOR DELETE TO authenticated
    USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );


-- ---------------------------------------------------------------------------
-- Realtime
--
-- Drives the live calendar: one person's booking shows up on everyone else's
-- screen without a refresh. `ALTER PUBLICATION ... ADD TABLE` errors when the
-- table is already published, hence the guard.
-- ---------------------------------------------------------------------------

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'bookings'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'recurring_events'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE recurring_events;
    END IF;
END
$$;


-- ---------------------------------------------------------------------------
-- Profile bootstrap
--
-- A signed-up user with no profile row would show up in the calendar with no
-- name and no colour, so the row is created by the same transaction that
-- creates the account.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
-- Pinned explicitly: a SECURITY DEFINER function with a mutable search_path can
-- be tricked into resolving `profiles` to an attacker-controlled table.
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO profiles (id, display_name, color)
    VALUES (
        NEW.id,
        -- Sign-up sends these as user metadata; the email local part is the
        -- fallback for accounts created straight from the dashboard.
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'color', '#3b82f6')
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
