export async function parseApiResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let json: T | null = null;
  try {
    json = JSON.parse(text) as T;
  } catch {
    if (!response.ok) {
      throw new Error("Server returned an HTML error page.");
    }
    throw new Error("Server returned an invalid JSON response.");
  }

  if (!response.ok) {
    const message =
      typeof json === "object" && json && "error" in json
        ? String((json as { error?: string }).error ?? "Request failed")
        : "Request failed";
    throw new Error(message);
  }

  return json;
}
