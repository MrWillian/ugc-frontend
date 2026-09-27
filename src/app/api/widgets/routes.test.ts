import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cookieSpies = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieSpies),
}));

import { GET as listGet, POST as createPost } from "@/app/api/widgets/route";
import {
  DELETE as deleteById,
  GET as getById,
  PATCH as patchById,
} from "@/app/api/widgets/[id]/route";

const widget = {
  id: "11111111-1111-4111-8111-111111111111",
  clientId: "client-1",
  name: "Galeria",
  layout: "GRID",
  filters: { maxPosts: 10 },
  embedCode:
    '<div id="ugc-widget-11111111-1111-4111-8111-111111111111"></div>',
  createdAt: "2026-08-01T12:00:00.000Z",
  updatedAt: "2026-08-01T12:00:00.000Z",
};

describe("Widgets BFF routes", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.test";
    cookieSpies.get.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("forwards the cookie token and returns the widgets list", async () => {
    cookieSpies.get.mockReturnValue({ value: "jwt-value" });
    const fetchMock = vi.fn().mockResolvedValueOnce(Response.json([widget]));
    vi.stubGlobal("fetch", fetchMock);

    const response = await listGet();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/widgets",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer jwt-value",
        }),
      }),
    );
    expect(await response.json()).toEqual([widget]);
  });

  it("forwards only documented create fields to POST /widgets", async () => {
    cookieSpies.get.mockReturnValue({ value: "jwt-value" });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json(widget, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await createPost(
      new Request("http://localhost/api/widgets", {
        method: "POST",
        body: JSON.stringify({
          name: "Galeria",
          layout: "GRID",
          filters: { maxPosts: 10 },
          extra: "must-not-be-forwarded",
        }),
      }),
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/widgets",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer jwt-value",
        }),
        body: JSON.stringify({
          name: "Galeria",
          layout: "GRID",
          filters: { maxPosts: 10 },
        }),
      }),
    );
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual(widget);
  });

  it("forwards GET /widgets/:id with the route id", async () => {
    cookieSpies.get.mockReturnValue({ value: "jwt-value" });
    const fetchMock = vi.fn().mockResolvedValueOnce(Response.json(widget));
    vi.stubGlobal("fetch", fetchMock);

    const response = await getById(
      new Request(
        "http://localhost/api/widgets/11111111-1111-4111-8111-111111111111",
      ),
      {
        params: Promise.resolve({
          id: "11111111-1111-4111-8111-111111111111",
        }),
      },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/widgets/11111111-1111-4111-8111-111111111111",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer jwt-value",
        }),
      }),
    );
    expect(await response.json()).toEqual(widget);
  });

  it("forwards only documented patch fields to PATCH /widgets/:id", async () => {
    cookieSpies.get.mockReturnValue({ value: "jwt-value" });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ ...widget, name: "Vitrine" }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await patchById(
      new Request(
        "http://localhost/api/widgets/11111111-1111-4111-8111-111111111111",
        {
          method: "PATCH",
          body: JSON.stringify({
            name: "Vitrine",
            layout: "CAROUSEL",
            filters: { maxPosts: 5 },
            extra: "must-not-be-forwarded",
          }),
        },
      ),
      {
        params: Promise.resolve({
          id: "11111111-1111-4111-8111-111111111111",
        }),
      },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/widgets/11111111-1111-4111-8111-111111111111",
      expect.objectContaining({
        method: "PATCH",
        headers: expect.objectContaining({
          Authorization: "Bearer jwt-value",
        }),
        body: JSON.stringify({
          name: "Vitrine",
          layout: "CAROUSEL",
          filters: { maxPosts: 5 },
        }),
      }),
    );
    expect(await response.json()).toEqual({ ...widget, name: "Vitrine" });
  });

  it("forwards DELETE /widgets/:id and allows an empty 204 body", async () => {
    cookieSpies.get.mockReturnValue({ value: "jwt-value" });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await deleteById(
      new Request(
        "http://localhost/api/widgets/11111111-1111-4111-8111-111111111111",
        {
          method: "DELETE",
        },
      ),
      {
        params: Promise.resolve({
          id: "11111111-1111-4111-8111-111111111111",
        }),
      },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/widgets/11111111-1111-4111-8111-111111111111",
      expect.objectContaining({
        method: "DELETE",
        headers: expect.objectContaining({
          Authorization: "Bearer jwt-value",
        }),
      }),
    );
    expect(response.status).toBe(204);
  });

  it.each([
    ["list", () => listGet()],
    [
      "create",
      () =>
        createPost(
          new Request("http://localhost/api/widgets", {
            method: "POST",
            body: JSON.stringify({ name: "Galeria", layout: "GRID" }),
          }),
        ),
    ],
    [
      "get by id",
      () =>
        getById(new Request("http://localhost/api/widgets/w1"), {
          params: Promise.resolve({ id: "w1" }),
        }),
    ],
    [
      "patch",
      () =>
        patchById(
          new Request("http://localhost/api/widgets/w1", {
            method: "PATCH",
            body: JSON.stringify({ name: "X" }),
          }),
          { params: Promise.resolve({ id: "w1" }) },
        ),
    ],
    [
      "delete",
      () =>
        deleteById(
          new Request("http://localhost/api/widgets/w1", { method: "DELETE" }),
          { params: Promise.resolve({ id: "w1" }) },
        ),
    ],
  ])("rejects %s without an access-token cookie", async (_route, requestRoute) => {
    cookieSpies.get.mockReturnValue(undefined);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await requestRoute();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: "Não autenticado." });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("preserves a backend 403 status and Nest message", async () => {
    cookieSpies.get.mockReturnValue({ value: "jwt-value" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        Response.json(
          { message: "Limite de widgets do plano atingido." },
          { status: 403 },
        ),
      ),
    );

    const response = await createPost(
      new Request("http://localhost/api/widgets", {
        method: "POST",
        body: JSON.stringify({ name: "Galeria", layout: "GRID" }),
      }),
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      message: "Limite de widgets do plano atingido.",
    });
  });
});
