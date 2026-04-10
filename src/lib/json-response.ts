export function safeJsonParse<T>(input: string): T | null {
  try {
    return JSON.parse(input) as T;
  } catch {
    const match = input.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return null;
    }
  }
}
