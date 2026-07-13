import { describe, it, expect, vi, beforeEach } from "vitest";
import { Logger } from "@/lib/logger";

describe("Logger", () => {
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger();
    vi.clearAllMocks();
  });

  it("should format message with timestamp and level", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    logger.info("Test message");
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const output = consoleSpy.mock.calls[0][0] as string;
    expect(output).toContain("[INFO] Test message");
    expect(output).toMatch(/\[\d{4}-\d{2}-\d{2}T/);
    consoleSpy.mockRestore();
  });

  it("should include context in formatted message", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    logger.info("Action", { action: "createTask", userId: "123" });
    const output = consoleSpy.mock.calls[0][0] as string;
    expect(output).toContain("createTask");
    expect(output).toContain("123");
    consoleSpy.mockRestore();
  });

  it("should create child logger with inherited context", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const child = logger.child({ userId: "123" });
    child.info("Child message", { action: "test" });
    const output = consoleSpy.mock.calls[0][0] as string;
    expect(output).toContain("123");
    expect(output).toContain("test");
    consoleSpy.mockRestore();
  });

  it("should serialize error with stack in error log", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("Test error");
    error.stack = "Error: Test error\n    at test";
    logger.error("Failed", error, { action: "test" });
    const output = consoleSpy.mock.calls[0][0] as string;
    expect(output).toContain("[ERROR] Failed");
    expect(output).toContain("Test error");
    consoleSpy.mockRestore();
  });

  it("should log debug in test environment", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    logger.debug("Debug message");
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const output = consoleSpy.mock.calls[0][0] as string;
    expect(output).toContain("[DEBUG] Debug message");
    consoleSpy.mockRestore();
  });
});
