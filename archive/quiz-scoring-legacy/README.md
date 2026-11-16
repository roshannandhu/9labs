# Archived: weights-based quiz scoring

Moved here when the quiz's points/weights system was replaced by an AI + RAG result (see
docs/AI_RAG_SYSTEM.md). Nothing in this folder is imported by the live app — it's a historical
safety copy only, excluded from the build and tests (tsconfig.json, eslint.config.mjs).

## What's here

- `score.ts` / `score.test.ts` — `scoreQuiz()`, the weight-summing ranker.
- `analyze.ts` / `analyze.test.ts` — `totalsFor`, `maxReachable`, `balanceReport` (live
  `randomAnswers` was kept in `src/lib/quiz/analyze.ts`, not archived — it isn't weights logic).
- `default-quiz-weights.json` — the original `site.quiz.questions` literal data, weights included,
  frozen before the live literals were rewritten to `pointsTo`.

## How to restore, if ever needed

1. Revert `QuizOption` in `src/content/types.ts` / `src/content/site.ts` back to
   `weights: Partial<Record<IconKey, number>>` (drop `pointsTo`).
2. Copy `default-quiz-weights.json`'s questions back over `site.quiz.questions`.
3. Copy `score.ts` / `analyze.ts` back to `src/lib/quiz/`, delete `backup.ts`.
4. Point `QuizOverlay.tsx`, `api/public/quiz-results/route.ts`, `api/public/quiz-email/route.ts`,
   `quiz/mail.ts`, `admin/quiz/page.tsx` back at `scoreQuiz` instead of the AI chain / backup.
5. Copy `score.test.ts` / `analyze.test.ts` back next to the restored files.
6. `pnpm lint && pnpm exec tsc --noEmit && pnpm test && pnpm build`.
