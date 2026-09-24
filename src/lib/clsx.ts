export type ClassValue = string | false | null | undefined | ClassValue[];

export function clsx(...inputs: ClassValue[]): string {
  const out: string[] = [];
  for (const input of inputs) {
    if (!input) continue;
    if (typeof input === "string") out.push(input);
    else if (Array.isArray(input)) out.push(clsx(...input));
  }
  return out.join(" ");
}
