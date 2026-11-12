/** Small helpers for the public forms (e-book request, quiz, enquiry). */

/** On the static demo nothing is sent: the forms answer as if they had been received. */
const STATIC_DEMO = process.env.NEXT_PUBLIC_DEMO_STATIC === "1";

/** POST JSON and return the parsed answer; never throws — a failed save must not break the page. */
export async function postJson<T = Record<string, unknown>>(url: string, body: unknown): Promise<{ ok: boolean; status: number; data: T | null }> {
  if (STATIC_DEMO) return { ok: true, status: 200, data: { status: "pending", demo: true } as T };
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), keepalive: true });
    let data: T | null = null;
    try {
      data = (await res.json()) as T;
    } catch {
      /* no body */
    }
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}

/** Fire-and-forget: used right before the page hands over to WhatsApp, so it must survive leaving the page. */
export function beacon(url: string, body: unknown) {
  if (STATIC_DEMO) return;
  try {
    const blob = new Blob([JSON.stringify(body)], { type: "application/json" });
    if (navigator.sendBeacon?.(url, blob)) return;
  } catch {
    /* fall through */
  }
  void postJson(url, body);
}

export const newRef = () => {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
};
