import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return ctx;
}

describe("predictions", () => {
  it("should require authentication for submit", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {
        clearCookie: vi.fn(),
      } as unknown as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.predictions.submit({
        imageData: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
        mimeType: "image/jpeg",
      })
    ).rejects.toThrow();
  });

  it("should allow public access to list predictions", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {
        clearCookie: vi.fn(),
      } as unknown as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);

    const result = await caller.predictions.list({ filter: "all" });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("comments", () => {
  it("should require authentication for adding comments", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {
        clearCookie: vi.fn(),
      } as unknown as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.comments.add({
        predictionId: 1,
        content: "Test comment",
      })
    ).rejects.toThrow();
  });

  it("should allow public access to list comments", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {
        clearCookie: vi.fn(),
      } as unknown as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);

    const result = await caller.comments.list({ predictionId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("upvotes", () => {
  it("should require authentication for toggling upvotes", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {
        clearCookie: vi.fn(),
      } as unknown as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.upvotes.toggle({
        predictionId: 1,
      })
    ).rejects.toThrow();
  });
});

describe("notifications", () => {
  it("should require authentication for listing notifications", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {
        clearCookie: vi.fn(),
      } as unknown as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);

    await expect(caller.notifications.list()).rejects.toThrow();
  });

  it("should return notifications for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notifications.list();
    expect(Array.isArray(result)).toBe(true);
  });
});
