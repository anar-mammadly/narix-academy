-- Tracks: which part of the path a module belongs to ("manual" or "automation").
-- Written so that running it twice is harmless.
ALTER TABLE "Module" ADD COLUMN IF NOT EXISTS "track" TEXT NOT NULL DEFAULT 'manual';

-- Site-wide settings the teacher changes from the admin panel (key → JSON value).
CREATE TABLE IF NOT EXISTS "SiteSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("key")
);
