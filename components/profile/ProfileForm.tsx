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
    <label className="block">
      <span className="text-xs uppercase tracking-[0.16em] text-ink-400">{label}</span>
      <input
        className="mt-2 min-h-11 w-full rounded-lg border border-white/20 bg-navy-950/60 px-3 text-sm text-white outline-none transition placeholder:text-ink-400 focus:border-aqua-400/70 focus:shadow-glow"
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
    <label className="block">
      <span className="text-xs uppercase tracking-[0.16em] text-ink-400">{label}</span>
      {helper ? <span className="mt-1 block text-xs leading-5 text-ink-400">{helper}</span> : null}
      <textarea
        className="mt-2 min-h-32 w-full rounded-lg border border-white/20 bg-navy-950/60 p-3 text-sm leading-6 text-white outline-none transition placeholder:text-ink-400 focus:border-aqua-400/70 focus:shadow-glow"
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
    <form action={formAction} className="mt-8 grid gap-5">
      <input type="hidden" name="id" value={String(values.id ?? "")} />

      {state.message ? (
        <div className="rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-3 text-sm text-aqua-400">{state.message}</div>
      ) : null}
      {state.errors.length > 0 ? (
        <div className="rounded-lg border border-signal-red/40 bg-signal-red/10 p-3 text-sm text-signal-red">
          <div className="font-semibold">Profile was not saved.</div>
          <ul className="mt-2 list-inside list-disc">
            {state.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Full name" name="fullName" values={values} state={state} required />
        <Field label="Preferred name" name="preferredName" values={values} state={state} />
        <Field label="Location" name="location" values={values} state={state} required />
        <Field label="Target salary gross NIS" name="targetSalaryGrossNis" type="number" values={values} state={state} />
        <Field label="Temporary minimum salary gross NIS" name="minimumSalaryGrossNis" type="number" values={values} state={state} />
        <Field label="Availability" name="availability" values={values} state={state} placeholder="Immediate / part-time / after exams..." />
        <Field label="Degree status" name="degreeStatus" values={values} state={state} placeholder="Near completion, final requirements remain" />
        <Field label="Expected completion" name="expectedCompletion" values={values} state={state} placeholder="Expected around September" />
      </div>

      <TextArea label="Mobility" name="mobility" values={values} state={state} placeholder="Beersheba/South preferred; remote or hybrid possible..." />
      <div className="grid gap-5 md:grid-cols-2">
        <TextArea label="Languages" name="languages" values={values} state={state} placeholder="Arabic - native&#10;Hebrew - professional&#10;English - professional" />
        <TextArea label="Technical skills" name="technicalSkills" values={values} state={state} helper="Fill profile text / عبي بياناتك" placeholder="JavaScript, TypeScript, React, Node.js, Python, SQL, Git, REST APIs, QA automation..." />
        <TextArea label="Soft skills" name="softSkills" values={values} state={state} placeholder="Fast learner, teamwork, technical communication, ownership..." />
        <TextArea label="Field experience" name="fieldExperience" values={values} state={state} helper="Project or practical experience is enough." placeholder="Built a React/Node app for...&#10;Supported users by troubleshooting...&#10;Created automation/tests for..." />
        <TextArea label="Education" name="education" values={values} state={state} placeholder="B.Sc. Computer Science, near completion, expected September..." />
        <TextArea label="Certificates" name="certificates" values={values} state={state} helper="Courses, certificates, or academic proof." placeholder="Course/certificate name - issuer - year&#10;Certificate URL if useful" />
        <TextArea label="GitHub projects" name="githubProjects" values={values} state={state} helper="Add project name, stack, and GitHub URL." placeholder="Thucydides - Next.js, Prisma, SQLite - https://github.com/...&#10;Project name - Python/React - URL" />
        <TextArea label="Portfolio links" name="portfolioLinks" values={values} state={state} helper="Portfolio, personal site, demos, or project pages." placeholder="Portfolio - https://...&#10;LinkedIn featured project - https://..." />
      </div>
      <TextArea label="Notes" name="sourceNotes" values={values} state={state} placeholder="Anything that should guide manual CV/application work." />

      <div>
        <NeonButton className="min-h-12 border-aqua-400 bg-aqua-400 px-5 text-base text-navy-950 hover:bg-aqua-500">{pending ? "Saving..." : "Save profile locally"}</NeonButton>
      </div>
    </form>
  );
}
