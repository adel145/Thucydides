"use client";

import { useActionState } from "react";
import { saveProfile, type ProfileFormState } from "@/app/profile/actions";
import { NeonButton } from "@/components/ui/NeonButton";

type ProfileValues = Record<string, string | number | null | undefined>;

function valueFor(values: ProfileValues, state: ProfileFormState, name: string) {
  return state.values?.[name] ?? values[name] ?? "";
}

function Field({
  label,
  name,
  values,
  state,
  type = "text",
  required = false,
  placeholder
}: {
  label: string;
  name: string;
  values: ProfileValues;
  state: ProfileFormState;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="text-xs uppercase tracking-[0.16em] text-ink-400">{label}</span>
      <input
        className="mt-2 min-h-11 w-full min-w-0 rounded-lg border border-white/20 bg-navy-950/60 px-3 text-sm text-white outline-none transition placeholder:text-ink-400 focus:border-aqua-400/70 focus:shadow-glow"
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={valueFor(values, state, name)}
      />
    </label>
  );
}

function TextArea({
  label,
  name,
  values,
  state,
  placeholder,
  helper
}: {
  label: string;
  name: string;
  values: ProfileValues;
  state: ProfileFormState;
  placeholder?: string;
  helper?: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="text-xs uppercase tracking-[0.16em] text-ink-400">{label}</span>
      {helper ? <span className="mt-1 block text-xs leading-5 text-ink-400">{helper}</span> : null}
      <textarea
        className="mt-2 min-h-32 w-full min-w-0 rounded-lg border border-white/20 bg-navy-950/60 p-3 text-sm leading-6 text-white outline-none transition placeholder:text-ink-400 focus:border-aqua-400/70 focus:shadow-glow"
        name={name}
        placeholder={placeholder}
        defaultValue={valueFor(values, state, name)}
      />
    </label>
  );
}

export function ProfileForm({ values }: { values: ProfileValues }) {
  const [state, formAction, pending] = useActionState(saveProfile, { ok: false, errors: [] });

  return (
    <form action={formAction} className="mt-8 grid min-w-0 gap-5">
      <input type="hidden" name="id" value={String(values.id ?? "")} />

      {state.message ? (
        <div className="rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-3 text-sm text-aqua-400">{state.message}</div>
      ) : null}
      {state.errors.length > 0 ? (
        <div className="rounded-lg border border-signal-red/40 bg-signal-red/10 p-3 text-sm text-signal-red">
          <div className="font-semibold">הפרופיל לא נשמר.</div>
          <ul className="mt-2 list-inside list-disc">
            {state.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid min-w-0 gap-5 md:grid-cols-2">
        <Field label="שם מלא" name="fullName" values={values} state={state} required />
        <Field label="שם מועדף" name="preferredName" values={values} state={state} />
        <Field label="מיקום" name="location" values={values} state={state} required />
        <Field label="שכר יעד ברוטו NIS" name="targetSalaryGrossNis" type="number" values={values} state={state} />
        <Field label="שכר מינימום זמני ברוטו NIS" name="minimumSalaryGrossNis" type="number" values={values} state={state} />
        <Field label="זמינות" name="availability" values={values} state={state} placeholder="מיידי / חלקי / אחרי מבחנים..." />
        <Field label="סטטוס תואר" name="degreeStatus" values={values} state={state} placeholder="לקראת סיום, נשארו דרישות אחרונות" />
        <Field label="סיום צפוי" name="expectedCompletion" values={values} state={state} placeholder="צפוי סביב ספטמבר" />
      </div>

      <TextArea label="ניידות" name="mobility" values={values} state={state} placeholder="עדיפות לבאר שבע/דרום; אפשרי remote או hybrid..." />
      <div className="grid min-w-0 gap-5 md:grid-cols-2">
        <TextArea label="שפות" name="languages" values={values} state={state} placeholder="Arabic - native&#10;Hebrew - professional&#10;English - professional" />
        <TextArea label="כישורים טכניים" name="technicalSkills" values={values} state={state} helper="מלא טקסט אמיתי לפרופיל." placeholder="JavaScript, TypeScript, React, Node.js, Python, SQL, Git, REST APIs, QA automation..." />
        <TextArea label="כישורים רכים" name="softSkills" values={values} state={state} placeholder="למידה מהירה, עבודת צוות, תקשורת טכנית, אחריות..." />
        <TextArea label="ניסיון מעשי" name="fieldExperience" values={values} state={state} helper="גם פרויקטים או ניסיון מעשי מספיקים." placeholder="בניתי אפליקציית React/Node עבור...&#10;תמכתי במשתמשים דרך troubleshooting...&#10;יצרתי אוטומציה/בדיקות עבור..." />
        <TextArea label="השכלה" name="education" values={values} state={state} placeholder="B.Sc. Computer Science, לקראת סיום, צפוי ספטמבר..." />
        <TextArea label="תעודות" name="certificates" values={values} state={state} helper="קורסים, תעודות או הוכחות אקדמיות." placeholder="שם קורס/תעודה - גוף מנפיק - שנה&#10;Certificate URL אם רלוונטי" />
        <TextArea label="פרויקטי GitHub" name="githubProjects" values={values} state={state} helper="שם פרויקט, טכנולוגיות ו-GitHub URL." placeholder="Thucydides - Next.js, Prisma, SQLite - https://github.com/...&#10;שם פרויקט - Python/React - URL" />
        <TextArea label="קישורי Portfolio" name="portfolioLinks" values={values} state={state} helper="Portfolio, אתר אישי, demos או עמודי פרויקט." placeholder="Portfolio - https://...&#10;LinkedIn featured project - https://..." />
      </div>
      <TextArea label="הערות" name="sourceNotes" values={values} state={state} placeholder="כל דבר שצריך להנחות עבודת CV או הגשה ידנית." />

      <div>
        <NeonButton className="min-h-12 border-aqua-400 bg-aqua-400 px-5 text-base text-navy-950 hover:bg-aqua-500">{pending ? "שומר..." : "שמור פרופיל מקומית"}</NeonButton>
      </div>
    </form>
  );
}
