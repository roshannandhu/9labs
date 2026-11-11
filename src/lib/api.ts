/** Small helpers for the public forms (e-book request, quiz, enquiry). */

/** POST JSON and return the parsed answer; never throws — a failed save must not break the page. */
export async function postJson<T = Record<string, unknown>>(url: string, body: unknown): Promise<{ ok: boolean; status: number; data: T | null }> {
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
