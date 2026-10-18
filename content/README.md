# Narix Academy curriculum

The curriculum lives here as JSON, one file per module (`modules/NN-key.json`).
`npm run content:sync` validates every file and writes it to the database.
Lesson and module ids from the old database are kept, so student progress survives.
`_legacy/` holds the database export taken before the restructure (2026-10-18).

Edits made in the admin lesson editor are stored in the database only. Running the sync again
makes these files the source of truth and overwrites those edits, so after the first migration
pick one place to author content.

## File format

```jsonc
{
  "id": "cmn0fw5bx0000ggbhwa7k6kb6",   // existing module id, or omit for a new module
  "key": "qa-giris",                    // stable unique key
  "order": 1,
  "title": "QA-ya giriş",
  "description": "One sentence, under 140 characters.",
  "icon": "Sparkles",                   // lucide-react icon name
  "color": "#5B4BFF",
  "lessons": [
    {
      "id": "cmn0lukgu0001cmyrmdt0kxh9",  // existing lesson id, or omit for a new lesson
      "slug": "software-nedir",           // keep existing slugs unchanged; new: kebab-case ascii
      "title": "Software nədir?",
      "shortDescription": "One sentence, under 140 characters.",
      "estimatedMinutes": 8,
      "minQuizScore": 70,
      "blocks": [
        { "type": "OBJECTIVES", "content": { "items": ["..."] } },
        { "type": "TASK", "id": "existing-block-id", "content": { "instructions": "..." } }
      ]
    }
  ]
}
```

Block `content` shapes are defined in `src/types/blocks.ts` (the single source of truth).
A block may carry `"title"`. A block `id` is only given to keep an existing block that has student answers.

## Writing standard

- **Language:** Azerbaijani. Professional terms stay in English, explained in Azerbaijani on first use:
  "Regression testing — dəyişiklikdən sonra köhnə funksiyaların pozulmadığını yoxlamaq".
  Lesson titles are Azerbaijani with the English term where it is the industry name: "Bug Life Cycle (baqın həyat dövrü)".
- **Accuracy:** terminology follows ISTQB Foundation Level v4.0 (test levels: component, integration, system, acceptance; 7 principles; severity vs priority; etc.).
- **Short:** one lesson = one idea, 6–15 minutes, 10–22 blocks. A TEXT block is at most ~80 words. No filler, no repetition of another lesson's topic.
- **Tone:** direct, second person singular ("sən"), plain verbs. No emoji in titles; at most one emoji per CALLOUT. No "📊 Cədvəl" style headings: every table/heading title says what it shows.
- **Lesson template:**
  1. `OBJECTIVES` — 2–4 outcomes ("... fərqləndirə biləcəksən").
  2. `KEY_TERMS` — 3–6 terms (term in English, `az` translation, one-line definition).
  3. 2–4 concept sections: `HEADING` (level 2) + `TEXT` / `TABLE` / `EXAMPLE` / `STEPPER` / `NOTE` / `CODE` / `DIAGRAM`.
  4. At least one interactive check in the middle (`ORDERING`, `CATEGORIZE`, a short `QUIZ` with 1–2 questions, or a builder/playground where it fits).
  5. A practical exercise where it fits (`BUG_HUNT`, `TEST_CASE_BUILDER`, `BUG_REPORT_BUILDER`, `API_PLAYGROUND`, `CODE_EXERCISE`, or `TASK` for open answers).
  6. `SUMMARY` — 3–5 points.
  7. Final `QUIZ` — 4–6 questions, every question with an `explanation`. Plausible distractors, one correct answer, no "all of the above".
- **IDs** inside content (quiz question ids, category ids, item ids) are short kebab-case strings unique within the lesson.
