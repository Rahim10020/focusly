import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("@/hooks/useAuth", () => ({
  useSession: () => ({
    data: { user: { id: "user-1" } },
    status: "authenticated",
  }),
}));

vi.mock("@/components/providers/ToastProvider", () => ({
  useToastContext: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  }),
}));

const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

function thenable(promise: Promise<{ data: any; error: any }>) {
  const chain: any = () => {};
  chain.then = (resolve: any, reject: any) => promise.then(resolve, reject);
  return chain;
}

function queryChain(result: { data: any; error: any } | Promise<{ data: any; error: any }>) {
  const chain: any = () => {};
  const resolved = Promise.resolve(result);
  Object.assign(chain, {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    single: vi.fn(() => resolved),
  });
  chain.then = (resolve: any, reject: any) => resolved.then(resolve, reject);
  return chain;
}

function mutation(mockFn: ReturnType<typeof vi.fn>) {
  return (payload?: any) => {
    const call = mockFn as (value?: any) => Promise<{ data: any; error: any }>;
    const promise = call(payload);
    const chain = thenable(promise);
    chain.select = () => chain;
    chain.eq = vi.fn(() => chain);
    chain.order = vi.fn(() => chain);
    chain.single = vi.fn(() => promise);
    return chain;
  };
}

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseClientOrNull: vi.fn(() => ({
    from: vi.fn(() => ({
      // Never resolve the initial load query so it can't wipe test state
      select: () => queryChain(new Promise<{ data: any; error: any }>(() => {})),
      insert: mutation(mockInsert),
      update: mutation(mockUpdate),
      delete: mutation(mockDelete),
    })),
  })),
}));

import { useTasks } from "@/hooks/useTasks";

describe("useTasks", () => {
  beforeEach(() => {
    localStorage.clear();
    mockInsert.mockClear();
    mockUpdate.mockClear();
    mockDelete.mockClear();
    mockInsert.mockResolvedValue({
      data: null,
      error: { message: "RLS violation" },
    });
    mockUpdate.mockResolvedValue({
      data: null,
      error: { message: "update failed" },
    });
    mockDelete.mockResolvedValue({ data: null, error: null });
  });

  it("adds a task optimistically and rolls it back when insert fails", async () => {
    const { result } = renderHook(() => useTasks());

    await act(async () => {
      await result.current.addTask({ title: "Test task" });
    });

    // Insert failed -> optimistic task must be rolled back
    expect(result.current.tasks).toHaveLength(0);
  });

  it("generates a stable id that is sent to the db insert", async () => {
    mockInsert.mockResolvedValue({ data: { id: "x" }, error: null });
    const { result } = renderHook(() => useTasks());

    await act(async () => {
      await result.current.addTask({ title: "Stable id" });
    });

    const added = result.current.tasks[0];
    expect(added).toBeDefined();
    const insertPayload = mockInsert.mock.calls[0][0];
    expect(insertPayload.id).toBe(added.id);
  });

  it("rolls back completion toggle when the update fails", async () => {
    mockInsert.mockResolvedValue({ data: { id: "x" }, error: null });
    const { result } = renderHook(() => useTasks());

    await act(async () => {
      await result.current.addTask({ title: "Toggle me" });
    });

    const taskId = result.current.tasks[0]?.id;
    expect(taskId).toBeDefined();

    mockUpdate.mockResolvedValue({
      data: null,
      error: { message: "update failed" },
    });

    await act(async () => {
      await result.current.toggleTask(taskId);
    });

    const after = result.current.tasks.find((t) => t.id === taskId);
    expect(after?.completed).toBe(false);
  });
});