-- Tracks: which part of the path a module belongs to ("manual" or "automation").
ALTER TABLE "Module" ADD COLUMN "track" TEXT NOT NULL DEFAULT 'manual';

-- Site-wide settings the teacher changes from the admin panel (key → JSON value).
CREATE TABLE "SiteSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("key")
);
