
// app/api/campus.ts
const BASE_URL = "http://127.0.0.1:8000/api";

export async function fetchWithAuth(endpoint: string, token: string, options: any = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(JSON.stringify(err));
  }
  return res.json();
}
export async function getEvents(token: string) {
  return fetchWithAuth("/events/", token);
}
export async function getClubs(token: string) {
  return fetchWithAuth("/clubs/", token);
}