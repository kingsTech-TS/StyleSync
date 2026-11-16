export class ApiError extends Error {
  status: number;
  /** Field name → message, built from FastAPI's 422 `detail[].loc`. */
  fields: Record<string, string>;

  constructor(status: number, message: string, fields: Record<string, string> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields;
  }
}

interface ValidationItem {
  loc?: (string | number)[];
  msg?: string;
}

function cleanMessage(msg: string): string {
  // Pydantic prefixes custom validator messages with "Value error, ".
  return msg.replace(/^Value error, /, "");
}

export async function toApiError(res: Response): Promise<ApiError> {
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // not JSON
  }
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (typeof detail === "string") return new ApiError(res.status, detail);
  if (Array.isArray(detail)) {
    const fields: Record<string, string> = {};
    let first = "";
    for (const item of detail as ValidationItem[]) {
      const msg = cleanMessage(item.msg ?? "Invalid value");
      const loc = (item.loc ?? []).filter((p) => p !== "body" && p !== "query");
      const key = loc.length ? String(loc[loc.length - 1]) : "";
      if (key && !fields[key]) fields[key] = msg;
      if (!first) first = msg;
    }
    return new ApiError(res.status, first || "Please check the form", fields);
  }
  return new ApiError(res.status, defaultMessage(res.status));
}

function defaultMessage(status: number): string {
  if (status === 401) return "Please log in again";
  if (status === 403) return "You don't have permission to do that";
  if (status === 404) return "Not found";
  if (status === 429) return "Too many requests, try again in a moment";
  if (status === 503) return "This feature is resting right now";
  if (status >= 500) return "Something went wrong on our side";
  return "Request failed";
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}
