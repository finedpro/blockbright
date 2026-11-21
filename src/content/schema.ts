import { z } from 'zod';

/**
 * Lesson structure. A lesson file holds structure only; every text lives in the
 * locale namespace `lesson-<id>` and is referenced by key, so all languages share
 * the same structure.
 */

const key = z.string().regex(/^[a-z0-9][a-zA-Z0-9_.-]*$/, 'Use a simple i18n key');

export const choiceSchema = z.object({
  id: z.string(),
  /** Button label key. */
  label: key,
  /** "Why?" text shown before choosing: what the action will do, not whether it is wise. */
  before: key,
  /** Consequence card key prefix: <explain>.what / .why / .how / .realLife, optional .more */
  explain: key,
  tone: z.enum(['good', 'warn', 'bad']),
  /** Practice coins lost with this choice: a negative number, or "all". */
  coins: z.union([z.number().int().max(-1), z.literal('all')]).optional(),
  /** Next simulation node, if the story continues. */
  next: z.string().optional(),
});

export const simNodeSchema = z.object({
  prompt: key,
  choices: z.array(choiceSchema).min(2),
});

export const quizOptionSchema = z.object({
  id: z.string(),
  correct: z.boolean(),
  /** Key of the misconception text shown when this wrong option is picked. */
  misconception: key.optional(),
});

export const quizQuestionSchema = z.object({
  id: z.string(),
  prompt: key,
  options: z.array(quizOptionSchema).min(2),
  explanation: key,
});

/** A learn card: plain text, an everyday analogy, or a step-through walkthrough. */
export const cardSchema = z.union([
  key,
  z.object({ kind: z.literal('analogy'), key }),
  z.object({ kind: z.literal('walkthrough'), title: key, frames: z.array(key).min(2) }),
]);

export const storySchema = z.object({
  title: key,
  body: key,
  question: key,
  answer: key,
  sources: z.array(z.object({ title: z.string(), url: z.url() })).min(1),
});

export const badAdviceSchema = z.object({
  intro: key,
  author: z.string(),
  lines: z.array(z.object({ id: z.string(), bad: z.boolean() })).min(3),
});

export const lessonSchema = z
  .object({
    id: z.string(),
    module: z.number().int().min(1).max(7),
    title: key,
    hook: key,
    /** Quiz question ids asked once before the lesson and again in the quiz (before/after). */
    before: z.array(z.string()).optional(),
    cards: z.array(cardSchema).min(1),
    story: storySchema.optional(),
    badAdvice: badAdviceSchema.optional(),
    /** Questions to talk through at home. */
    talk: z.array(key).optional(),
    simulation: z.object({
      start: z.string(),
      nodes: z.record(z.string(), simNodeSchema),
    }),
    quiz: z.array(quizQuestionSchema).min(1),
    takeaways: z.array(key).min(1),
  })
  .superRefine((lesson, ctx) => {
    if (!lesson.simulation.nodes[lesson.simulation.start]) {
      ctx.addIssue({ code: 'custom', message: `Simulation start node "${lesson.simulation.start}" is missing` });
    }
    for (const [nodeId, node] of Object.entries(lesson.simulation.nodes)) {
      for (const choice of node.choices) {
        if (choice.next && !lesson.simulation.nodes[choice.next]) {
          ctx.addIssue({ code: 'custom', message: `Choice ${nodeId}/${choice.id} points to missing node "${choice.next}"` });
        }
      }
    }
    for (const id of lesson.before ?? []) {
      if (!lesson.quiz.some((q) => q.id === id)) ctx.addIssue({ code: 'custom', message: `before: unknown quiz question "${id}"` });
    }
    for (const q of lesson.quiz) {
      if (q.options.filter((o) => o.correct).length !== 1) {
        ctx.addIssue({ code: 'custom', message: `Quiz question ${q.id} must have exactly one correct option` });
      }
      for (const o of q.options) {
        if (!o.correct && !o.misconception) {
          ctx.addIssue({ code: 'custom', message: `Wrong option ${q.id}/${o.id} needs a misconception tag` });
        }
      }
    }
  });

export type Lesson = z.infer<typeof lessonSchema>;
export type LessonCard = z.infer<typeof cardSchema>;

/** Text keys of one learn card, in reading order. */
export function cardKeys(card: LessonCard): string[] {
  if (typeof card === 'string') return [card];
  if (card.kind === 'analogy') return [card.key];
  return [card.title, ...card.frames];
}
export type SimChoice = z.infer<typeof choiceSchema>;
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;

/** Every text key a lesson needs, in reading order. Used by the content check and the term rule. */
export function lessonTextKeys(lesson: Lesson): string[] {
  const keys = [lesson.title, lesson.hook, ...lesson.cards.flatMap(cardKeys)];
  if (lesson.story) keys.push(lesson.story.title, lesson.story.body, lesson.story.question, lesson.story.answer);
  const seen = new Set<string>();
  const walk = (nodeId: string) => {
    if (seen.has(nodeId)) return;
    seen.add(nodeId);
    const node = lesson.simulation.nodes[nodeId];
    keys.push(node.prompt);
    for (const c of node.choices) {
      keys.push(c.label, c.before, `${c.explain}.what`, `${c.explain}.why`, `${c.explain}.how`, `${c.explain}.realLife`);
      if (c.next) walk(c.next);
    }
  };
  walk(lesson.simulation.start);
  if (lesson.badAdvice) {
    keys.push(lesson.badAdvice.intro);
    for (const l of lesson.badAdvice.lines) keys.push(`advice.${l.id}.text`, `advice.${l.id}.why`);
  }
  for (const q of lesson.quiz) {
    keys.push(q.prompt, ...q.options.map((o) => `${q.id}.${o.id}`), q.explanation);
    for (const o of q.options) if (o.misconception) keys.push(o.misconception);
  }
  keys.push(...lesson.takeaways, ...(lesson.talk ?? []));
  return keys;
}
