// Small fetch wrapper for admin screens: JSON in, JSON out, readable errors.

export class RequestError extends Error {
  constructor(message: string, public status: number, public data: unknown) {
    super(message);
  }
}

type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export async function requestJson<T = unknown>(url: string, method: Method = "GET", body?: unknown, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...init,
    });
  } catch {
    throw new RequestError("Şəbəkə xətası. İnternet bağlantısını yoxlayın.", 0, null);
  }
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      data && typeof data === "object" && "error" in data && typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : `Xəta baş verdi (${res.status})`;
    throw new RequestError(message, res.status, data);
  }
  return data as T;
}

export function errorMessage(e: unknown) {
  return e instanceof Error ? e.message : "Xəta baş verdi";
}
