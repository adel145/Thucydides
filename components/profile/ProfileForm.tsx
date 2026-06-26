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
  required = false
}: {
  label: string;
  name: string;
  values: ProfileValues;
  state: ProfileFormState;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.16em] text-ink-400">{label}</span>
      <input
        className="mt-2 min-h-11 w-full rounded-lg border border-white/10 bg-navy-950/70 px-3 text-sm text-white outline-none transition focus:border-aqua-400/70 focus:shadow-glow"
        name={name}
        type={type}
        required={required}
        defaultValue={valueFor(values, state, name)}
      />
    </label>
  );
}

function TextArea({
  label,
  name,
  values,
  state
}: {
  label: string;
  name: string;
  values: ProfileValues;
  state: ProfileFormState;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.16em] text-ink-400">{label}</span>
      <textarea
        className="mt-2 min-h-28 w-full rounded-lg border border-white/10 bg-navy-950/70 p-3 text-sm leading-6 text-white outline-none transition focus:border-aqua-400/70 focus:shadow-glow"
        name={name}
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
        <Field label="Availability" name="availability" values={values} state={state} />
        <Field label="Degree status" name="degreeStatus" values={values} state={state} />
        <Field label="Expected completion" name="expectedCompletion" values={values} state={state} />
      </div>

      <TextArea label="Mobility" name="mobility" values={values} state={state} />
      <div className="grid gap-5 md:grid-cols-2">
        <TextArea label="Languages" name="languages" values={values} state={state} />
        <TextArea label="Technical skills" name="technicalSkills" values={values} state={state} />
        <TextArea label="Soft skills" name="softSkills" values={values} state={state} />
        <TextArea label="Field experience" name="fieldExperience" values={values} state={state} />
        <TextArea label="Education" name="education" values={values} state={state} />
        <TextArea label="Certificates" name="certificates" values={values} state={state} />
        <TextArea label="GitHub projects" name="githubProjects" values={values} state={state} />
        <TextArea label="Portfolio links" name="portfolioLinks" values={values} state={state} />
      </div>
      <TextArea label="Notes" name="sourceNotes" values={values} state={state} />

      <div>
        <NeonButton>{pending ? "Saving..." : "Save profile locally"}</NeonButton>
      </div>
    </form>
  );
}
