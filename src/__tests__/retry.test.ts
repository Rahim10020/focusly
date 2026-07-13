import { describe, it, expect, vi } from "vitest";
import { retryWithBackoff, withRetry } from "@/lib/utils/retry";

describe("retryWithBackoff", () => {
  it("should return result on first success", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const result = await retryWithBackoff(fn);
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should retry on transient error then succeed", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValue("recovered");

    const result = await retryWithBackoff(fn, {
      maxRetries: 2,
      initialDelay: 10,
      maxDelay: 100,
      exponentialBackoff: false,
    });

    expect(result).toBe("recovered");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("should not retry on 404 error", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("404 not found"));
    await expect(
      retryWithBackoff(fn, {
        maxRetries: 3,
        initialDelay: 10,
        maxDelay: 100,
        exponentialBackoff: false,
      }),
    ).rejects.toThrow("404 not found");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should not retry on 401 error", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("401 unauthorized"));
    await expect(
      retryWithBackoff(fn, {
        maxRetries: 3,
        initialDelay: 10,
        maxDelay: 100,
        exponentialBackoff: false,
      }),
    ).rejects.toThrow("401 unauthorized");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should not retry on validation error", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("validation failed"));
    await expect(
      retryWithBackoff(fn, {
        maxRetries: 3,
        initialDelay: 10,
        maxDelay: 100,
        exponentialBackoff: false,
      }),
    ).rejects.toThrow("validation failed");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should throw last error after max retries", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("Persistent error"));
    await expect(
      retryWithBackoff(fn, {
        maxRetries: 2,
        initialDelay: 10,
        maxDelay: 100,
        exponentialBackoff: false,
      }),
    ).rejects.toThrow("Persistent error");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("should call onRetry callback", async () => {
    const onRetry = vi.fn();
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValue("ok");

    await retryWithBackoff(fn, {
      maxRetries: 2,
      initialDelay: 10,
      maxDelay: 100,
      exponentialBackoff: false,
      onRetry,
    });

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(
      1,
      expect.any(Error),
      expect.any(Number),
    );
  });

  it("should use exponential backoff", async () => {
    const delays: number[] = [];
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValue("ok");

    await retryWithBackoff(
      fn,
      {
        maxRetries: 3,
        initialDelay: 100,
        maxDelay: 1000,
        factor: 2,
        onRetry: (_attempt, _error, delay) => {
          delays.push(delay);
        },
      },
    );

    expect(delays.length).toBe(2);
    expect(delays[1]).toBeGreaterThan(delays[0]);
  });
});

describe("withRetry", () => {
  it("should wrap function with retry logic", async () => {
    const fn = withRetry(
      async () => {
        if (Math.random() > 0.5) throw new Error("fail");
        return "ok";
      },
      { maxRetries: 3, initialDelay: 10, maxDelay: 100, exponentialBackoff: false },
    );

    const result = await fn();
    expect(result).toBe("ok");
  });
});
