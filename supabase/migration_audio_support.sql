-- ============================================
-- MIGRATION: Audio Support for Knowledge Base
-- ============================================
-- Dodaje wsparcie dla plików audio w Bazie Wiedzy
-- Analogicznie do knowledge-base-images bucket
--
-- Autor: AI Assistant
-- Data: 2025-11-14
-- ============================================

-- ============================================
-- SUPABASE STORAGE: Audio Bucket
-- ============================================

-- Utworzenie publicznego bucketa dla plików audio Bazy Wiedzy
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'knowledge-base-audio',
    'knowledge-base-audio',
    true,  -- Publiczny bucket (wszyscy mogą pobierać)
    20971520,  -- 20MB limit (20 * 1024 * 1024 bytes)
    ARRAY[
        'audio/mpeg',       -- MP3
        'audio/mp3',        -- MP3 (alternatywny MIME)
        'audio/ogg',        -- OGG Vorbis
        'audio/wav',        -- WAV
        'audio/wave',       -- WAV (alternatywny MIME)
        'audio/x-wav',      -- WAV (alternatywny MIME)
        'audio/mp4',        -- M4A/AAC
        'audio/x-m4a',      -- M4A (alternatywny MIME)
        'audio/aac',        -- AAC
        'audio/flac',       -- FLAC
        'audio/x-flac'      -- FLAC (alternatywny MIME)
    ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- RLS POLICIES: Audio Storage
-- ============================================

-- Usuń stare policies jeśli istnieją
DROP POLICY IF EXISTS "Public read access for KB audio" ON storage.objects;
DROP POLICY IF EXISTS "Admin can upload KB audio" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete KB audio" ON storage.objects;

-- Policy 1: Wszyscy mogą pobierać pliki audio (publiczny dostęp)
CREATE POLICY "Public read access for KB audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'knowledge-base-audio');

-- Policy 2: Tylko admin może uploadować pliki audio
CREATE POLICY "Admin can upload KB audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'knowledge-base-audio' AND
  (
    (auth.jwt() -> 'user_metadata' -> 'role')::text = 'admin'
    OR
    (auth.jwt() -> 'is_super_admin')::boolean = TRUE
  )
);

-- Policy 3: Tylko admin może usuwać pliki audio
CREATE POLICY "Admin can delete KB audio"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'knowledge-base-audio' AND
  (
    (auth.jwt() -> 'user_metadata' -> 'role')::text = 'admin'
    OR
    (auth.jwt() -> 'is_super_admin')::boolean = TRUE
  )
);

-- ============================================
-- INFORMACJE
-- ============================================

-- Struktura URL pliku audio:
-- https://[PROJECT_ID].supabase.co/storage/v1/object/public/knowledge-base-audio/[filename]

-- Dozwolone formaty:
-- - MP3 (audio/mpeg, audio/mp3)
-- - OGG (audio/ogg)
-- - WAV (audio/wav, audio/wave, audio/x-wav)
-- - M4A/AAC (audio/mp4, audio/x-m4a, audio/aac)
-- - FLAC (audio/flac, audio/x-flac)

-- Maksymalny rozmiar: 20MB
-- Uprawnienia: Tylko admini mogą uploadować i usuwać, wszyscy mogą pobierać

-- ============================================
-- ROLLBACK (jeśli potrzebne)
-- ============================================

-- DROP POLICY IF EXISTS "Public read access for KB audio" ON storage.objects;
-- DROP POLICY IF EXISTS "Admin can upload KB audio" ON storage.objects;
-- DROP POLICY IF EXISTS "Admin can delete KB audio" ON storage.objects;
-- DELETE FROM storage.buckets WHERE id = 'knowledge-base-audio';

