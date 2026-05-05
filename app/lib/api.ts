export const backendUrl = (
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "https://clashdsa.duckdns.org"
).replace(/\/$/, "");

export function backendPath(path: string) {
  if (/^https?:\/\//.test(path)) return path;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return backendUrl ? `${backendUrl}${normalizedPath}` : normalizedPath;
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(backendPath(path), {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}
