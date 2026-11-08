const DEFAULT_MESSAGE = "Não foi possível concluir a solicitação.";

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function errorMessageFromResponse(response: Response): Promise<string> {
  const payload: unknown = await response.json().catch(() => null);

  if (typeof payload === "object" && payload !== null && "message" in payload) {
    const { message } = payload as { message?: unknown };

    if (Array.isArray(message)) {
      return message
        .filter((item): item is string => typeof item === "string")
        .join(" ");
    }

    if (typeof message === "string") {
      return message;
    }
  }

  return DEFAULT_MESSAGE;
}

/** Lança ApiError quando a resposta não é ok; devolve a resposta quando é. */
export async function ensureOk(response: Response): Promise<Response> {
  if (response.ok) {
    return response;
  }

  throw new ApiError(await errorMessageFromResponse(response), response.status);
}

export function isPlanLimitError(reason: unknown): reason is ApiError {
  return reason instanceof ApiError && reason.status === 403;
}
