export const MAX_SUBMISSION_BYTES = 32 * 1024;

export class RequestGuardError extends Error {
  constructor(
    public readonly code: "invalid_content_type" | "request_too_large" | "origin_rejected" | "invalid_json",
    public readonly status: 400 | 403 | 413,
  ) {
    super(code);
  }
}

export function assertJsonContentType(request: Request): void {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim();
  if (contentType !== "application/json") {
    throw new RequestGuardError("invalid_content_type", 400);
  }
}

export function assertSafeRequestOrigin(request: Request, extraOrigins: string[]): void {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  const requestOrigin = new URL(request.url).origin;
  const allowed = new Set([requestOrigin, ...extraOrigins.filter(Boolean)]);

  // Defence-in-depth only: these headers are client-controlled and are not authentication.
  if (!origin || !allowed.has(origin)) {
    throw new RequestGuardError("origin_rejected", 403);
  }
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "same-site") {
    throw new RequestGuardError("origin_rejected", 403);
  }
}

export async function readCappedJson(request: Request): Promise<unknown> {
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_SUBMISSION_BYTES) {
    throw new RequestGuardError("request_too_large", 413);
  }

  if (!request.body) {
    throw new RequestGuardError("invalid_json", 400);
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > MAX_SUBMISSION_BYTES) {
      await reader.cancel();
      throw new RequestGuardError("request_too_large", 413);
    }
    chunks.push(value);
  }

  const merged = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return JSON.parse(new TextDecoder().decode(merged));
  } catch {
    throw new RequestGuardError("invalid_json", 400);
  }
}
