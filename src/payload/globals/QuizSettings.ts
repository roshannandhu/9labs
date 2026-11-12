import type { GlobalConfig } from "payload";
import { ACTIVITIES, area, bool, num, select, text } from "../fields";
import { signedIn } from "../access";
import { revalidateGlobal } from "../hooks/revalidate";

type Opt = { label?: string; points?: Record<string, number | null | undefined> };
type Q = { q?: string; options?: Opt[] };

export const QuizSettings: GlobalConfig = {
  slug: "quiz-settings",
  label: "Quiz settings",
  admin: {
    group: "Quiz",
    description:
      "How the quiz works: every answer gives points to one or more of the nine activities. The activities with the most points are recommended, with a match percentage, and the visitor can send the result to you on WhatsApp.",
  },
  access: { read: signedIn, update: signedIn },
  versions: { max: 20 },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Questions",
          fields: [
            {
              name: "simulator",
              type: "ui",
              admin: { components: { Field: "/payload/components/QuizSimulator#QuizSimulator" } },
            },
            {
              name: "questions",
              label: "Questions",
              type: "array",
              minRows: 1,
              labels: { singular: "Question", plural: "Questions" },
              admin: {
                description: "Add, remove or drag to reorder. The first question is also shown on the homepage.",
                initCollapsed: true,
                components: { RowLabel: "/payload/components/RowLabels#QuestionLabel" },
              },
              validate: (value: unknown) => {
                const qs = (value as Q[] | undefined) ?? [];
                if (!qs.length) return "Add at least one question.";
                const short = qs.find((q) => (q.options?.length ?? 0) < 2);
                if (short) return `“${short.q ?? "A question"}” needs at least two answers.`;
                const scoring = new Set<string>();
                for (const q of qs) for (const o of q.options ?? []) for (const [k, v] of Object.entries(o.points ?? {})) if (Number(v) > 0) scoring.add(k);
                const never = ACTIVITIES.filter((a) => !scoring.has(a.value)).map((a) => a.label);
                if (never.length) return `No answer gives points to: ${never.join(", ")}. It could never be recommended — give it points in at least one answer.`;
                return true;
              },
              fields: [
                area("q", "Question", undefined, { required: true }),
                {
                  type: "row",
                  fields: [
                    text("label", "Short name", "Used in the WhatsApp summary, e.g. “Main goal”.", { required: true }),
                    select(
                      "role",
                      "Used in the result sentence as",
                      [
                        { label: "— not used —", value: "none" },
                        { label: "Who they are ({who})", value: "who" },
                        { label: "Their main goal ({goal})", value: "goal" },
                        { label: "Their timing ({when})", value: "when" },
                      ],
                      "none",
                      "The result opens with a sentence built from these three answers.",
                    ),
                    bool("multi", "Several answers allowed", false),
                  ],
                },
                text("hint", "Hint under the question", "Optional, e.g. “Pick all that apply”."),
                {
                  name: "options",
                  label: "Answers",
                  type: "array",
                  minRows: 2,
                  labels: { singular: "Answer", plural: "Answers" },
                  admin: { initCollapsed: true, components: { RowLabel: "/payload/components/RowLabels#OptionLabel" } },
                  fields: [
                    {
                      type: "row",
                      fields: [
                        text("label", "Answer", undefined, { required: true }),
                        bool("only", "Stands alone", false, "For answers like “Nothing yet”: choosing it clears the other choices."),
                      ],
                    },
                    {
                      name: "points",
                      label: "Points for each activity (0 = none, 3 = strong)",
                      type: "group",
                      fields: [
                        { type: "row", fields: ACTIVITIES.slice(0, 5).map((a) => num(a.value, a.label, undefined, { min: 0, max: 5, defaultValue: 0, admin: { step: 1 } })) },
                        { type: "row", fields: ACTIVITIES.slice(5).map((a) => num(a.value, a.label, undefined, { min: 0, max: 5, defaultValue: 0, admin: { step: 1 } })) },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: "Section on the homepage",
          fields: [
            text("label", "Section label"),
            { type: "row", fields: [text("heading", "Heading"), text("accent", "Heading — highlighted ending")] },
            area("text", "Text"),
            text("cta", "Button"),
            text("meta", "Small line under the button", "{count} becomes the number of questions."),
          ],
        },
        {
          name: "result",
          label: "Result screen",
          fields: [
            { type: "row", fields: [text("label", "Label"), text("heading", "Heading")] },
            area("summary", "Opening sentence", "{who}, {goal} and {when} are replaced by the visitor's answers to the questions marked with those roles."),
            text("why", "“Why” line", "{answers} becomes the visitor's own answers that pushed this activity up."),
            {
              name: "steps",
              label: "The three-step plan",
              type: "array",
              minRows: 1,
              maxRows: 3,
              admin: { description: "{first} = the top activity, {firstDescription} = its description, {next} = the other recommended activities." },
              fields: [text("title", "Title", undefined, { required: true }), area("text", "Text")],
            },
            num("matches", "How many activities to recommend", undefined, { min: 1, max: 5, defaultValue: 3 }),
            { type: "row", fields: [text("whatsappCta", "WhatsApp button"), text("retake", "Retake link"), text("ebooksCta", "E-books link")] },
            { type: "row", fields: [text("whatsappIntro", "WhatsApp message — first line"), text("whatsappOutro", "WhatsApp message — last line")] },
            bool("emailEnabled", "Offer “e-mail me this plan”", true),
            { type: "row", fields: [text("emailPlaceholder", "E-mail box hint"), text("emailCta", "E-mail button"), text("emailSent", "After sending", "{email} is replaced by their address.")] },
          ],
        },
      ],
    },
  ],
};
