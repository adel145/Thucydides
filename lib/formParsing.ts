export function optionalString(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > 0 ? text : null;
}

export function requiredString(value: FormDataEntryValue | null, fallback = "") {
  return optionalString(value) ?? fallback;
}

export function optionalInt(value: FormDataEntryValue | null) {
  const text = optionalString(value);
  if (!text) return null;
  const parsed = Number.parseInt(text.replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseTextareaJson(value: FormDataEntryValue | null) {
  const text = optionalString(value);
  if (!text) return [];

  if (text.startsWith("[") || text.startsWith("{")) {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
    }
  }

  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function jsonToTextarea(value: unknown) {
  if (Array.isArray(value)) {
    return value.join("\n");
  }

  if (value && typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return typeof value === "string" ? value : "";
}

export function jsonToStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }

  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }

  return [];
}
