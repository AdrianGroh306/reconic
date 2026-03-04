export const WORDS_PER_MINUTE = 130

export function targetWordsForDuration(durationMinutes: number): number {
  return Math.round(durationMinutes * WORDS_PER_MINUTE)
}

/** Stable hash for a script line string (for checkbox state keying) */
export function lineHash(line: string): string {
  let h = 0
  for (let i = 0; i < line.length; i++) {
    h = ((h << 5) - h + line.charCodeAt(i)) | 0
  }
  return String(h >>> 0)
}

/** Parse [B: ...] lines from script */
export function parseBrollLines(script: string): string[] {
  return script
    .split("\n")
    .filter((line) => /^\[B:/i.test(line.trim()))
    .map((line) => line.replace(/^\[B:/i, "").replace(/\]$/, "").trim())
    .filter(Boolean)
}

/** Parse [A] lines from script */
export function parseArollLines(script: string): string[] {
  return script
    .split("\n")
    .filter((line) => /^\[A\]/i.test(line.trim()))
    .map((line) => line.replace(/^\[A\]\s*/i, "").trim())
    .filter(Boolean)
}
