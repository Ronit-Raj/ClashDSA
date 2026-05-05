// All API calls use relative paths (/v1/api/...) so the browser sends them to
// the same origin as the Next.js app. next.config.ts rewrites then forward
// each request server-side to the real backend. This keeps cookies same-origin,
// bypassing all cross-origin Secure/SameSite restrictions.

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = path.startsWith("/") ? path : `/${path}`;

  return fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}
