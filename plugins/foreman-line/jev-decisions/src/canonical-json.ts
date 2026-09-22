import { createHash } from "node:crypto";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function serialize(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("non-finite number");
    if (Object.is(value, -0)) return "0";
    const encoded = JSON.stringify(value);
    if (encoded === undefined) throw new TypeError("unsupported number");
    return encoded;
  }
  if (Array.isArray(value)) return `[${value.map(serialize).join(",")}]`;
  if (isRecord(value)) {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => {
      const child = value[key];
      if (child === undefined) throw new TypeError("undefined value");
      return `${JSON.stringify(key)}:${serialize(child)}`;
    }).join(",")}}`;
  }
  throw new TypeError("unsupported value");
}

export function canonicalize(value: unknown): string {
  return serialize(value);
}

export function canonicalDigest(value: unknown): string {
  return createHash("sha256").update(canonicalize(value), "utf8").digest("hex");
}
