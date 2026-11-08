import { describe, expect, it } from "vitest";
import { ApiError, ensureOk, errorMessageFromResponse } from "@/lib/api-error";

describe("errorMessageFromResponse", () => {
  it("reads a string message", async () => {
    const response = Response.json({ message: "Campo inválido." }, { status: 400 });
    expect(await errorMessageFromResponse(response)).toBe("Campo inválido.");
  });

  it("joins an array message", async () => {
    const response = Response.json(
      { message: ["Nome obrigatório.", "Hashtag inválida."] },
      { status: 400 },
    );
    expect(await errorMessageFromResponse(response)).toBe(
      "Nome obrigatório. Hashtag inválida.",
    );
  });

  it("falls back when the body is not JSON", async () => {
    const response = new Response("not-json", { status: 500 });
    expect(await errorMessageFromResponse(response)).toBe(
      "Não foi possível concluir a solicitação.",
    );
  });
});

describe("ensureOk", () => {
  it("returns the response when ok", async () => {
    const response = Response.json({ ok: true });
    await expect(ensureOk(response)).resolves.toBe(response);
  });

  it("throws ApiError with status for failures", async () => {
    const response = Response.json({ message: "Proibido." }, { status: 403 });
    await expect(ensureOk(response)).rejects.toMatchObject({
      message: "Proibido.",
      status: 403,
    });

    const other = Response.json({ message: "Proibido." }, { status: 403 });
    await expect(ensureOk(other)).rejects.toBeInstanceOf(ApiError);
  });
});
