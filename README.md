# Narix Academy

Manual QA və test avtomatlaşdırmasını qısa, interaktiv dərslərlə öyrədən platforma.

## Stack

- **Next.js 16** (App Router, Turbopack), **React 19**, TypeScript
- **Tailwind CSS 4**: tokenlər `src/app/globals.css` faylındadır, light və dark rejim
- **PostgreSQL** (Neon) + **Prisma 5**
- Auth: JWT (`jose`) + bcrypt, `src/proxy.ts`
- CodeMirror 6: kod tapşırıqları, Web Worker-də sandbox-lanmış işə salınma
- Motion, canvas-confetti, Mermaid, Radix UI, dnd-kit
- Şriftlər: Bricolage Grotesque AZ (ə/Ə qlifləri əlavə edilmiş versiya, `src/app/fonts/README.md`), JetBrains Mono (kod).

## Tələbə tərəfi

- **Öyrənmə yolu:** 9 modul, 49 dərs. Hər dərs növbətini açır.
- **Dərs pleyeri** (`/learn/[slug]`): focus rejimi, dərs planı, qeydlər, suallar, irəliləyiş.
- **İnteraktiv bloklar:**
  - Quiz (hər sualdan sonra izah ilə)
  - Sırala, Qruplaşdır
  - Kod tapşırığı (JS)
  - Bug Hunt (3 mini tətbiq)
  - Test Case və Bug Report builder-ləri
  - API Playground
- **Gamification:** XP, səviyyələr, streak, gündəlik hədəf, 14 nailiyyət, həftəlik və ümumi liderlər.
- **Təkrar:** quizdə səhv cavablanan suallar Leitner sistemi ilə qayıdır.
- **Digər:** ev tapşırıqları, qeydlər, suallar, təqvim, sertifikat (çap / PDF və `/verify/[code]` yoxlama səhifəsi).

## Müəllim tərəfi (`/admin`)

Statistika, modul və dərs idarəetməsi, blok redaktoru (auto-save, sürüklə-burax, JSON import), tələbələr, tapşırıqların qiymətləndirilməsi, suallar və təqvim. Önizləmə: `/preview/[lessonId]`.

## Kurikulum

Dərslərin məzmunu `content/modules/*.json` fayllarındadır (format üçün: `content/README.md`). Blok sxemi `src/types/blocks.ts` və `src/lib/block-schema.ts` (zod) fayllarında təyin olunub.

```bash
npm run content:check   # yoxla və planı göstər, heç nə dəyişmir
npm run content:sync    # bazanın ehtiyat nüsxəsini çıxar, sonra yaz
```

Sync necə işləyir:

- Modul və dərs ID-lərini saxlayır, ona görə tələbə irəliləyişi itmir.
- Yeni bloklara sabit ID verir və həmin ID-ni JSON-a geri yazır.
- Dərs silmir.
- Fayllarda olmayan modulları silmir, sadəcə gizlədir.

> **Diqqət:** admin redaktorunda edilən dəyişikliklər bazaya yazılır, JSON fayllarına yox. `content:sync` faylları əsas götürür və o dərslərdəki redaktələri əzir. İlk köçürmədən sonra ya yalnız redaktordan, ya da yalnız fayllardan istifadə et.

## Lokal qurulum

```bash
npm install
cp .env.example .env          # DATABASE_URL, JWT_SECRET, R2_*
npx prisma migrate deploy
npx tsx prisma/seed.ts        # yalnız lokal baza üçün: demo hesablar
npm run content:sync
npm run dev
```

Demo hesablar (seed): `teacher@narix.local` və `student@narix.local`, şifrə: `narix123`.

## Produksiyaya keçid (bir dəfə)

Ardıcıllıq vacibdir. Məzmun yeni kod deploy olunmazdan **əvvəl** sync olunarsa, köhnə sayt yeni blokları göstərə bilməz.

1. `JWT_SECRET` produksiyada mütləq təyin olunmalıdır (yoxdursa tətbiq işə düşmür).
2. `npx prisma migrate deploy` işə sal. Gamification migration-ı yalnız yeni cədvəl və sütunlar əlavə edir.
3. Yeni kodu deploy et.
4. `npm run content:check`, sonra `npm run content:sync` işə sal.
5. `npx tsx scripts/backfill-xp.ts`: əvvəl bitirilmiş dərslər üçün XP verir. Təkrar işə salmaq təhlükəsizdir.

## Skriptlər

| Əmr | Nə edir |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Prisma generate + production build |
| `npm run lint` | ESLint |
| `npm run content:check` / `content:sync` | Kurikulumu yoxla / bazaya yaz |
| `npx tsx scripts/backfill-xp.ts` | Köhnə irəliləyiş üçün XP |

---

Narix Academy © 2026
