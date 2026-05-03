export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://57.158.25.157:3000";

export async function apiFetch(path: string, init?: RequestInit) {
  return fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}
