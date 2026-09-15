import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import UserProfilePage from "./page";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  back: vi.fn(),
  actionSuccess: vi.fn(),
  actionError: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, back: mocks.back }),
  useParams: () => ({ userId: "other-user" }),
}));
vi.mock("@/hooks/useAuth", () => ({
  useSession: () => ({ data: { user: { id: "current-user" } }, status: "authenticated" }),
}));
vi.mock("@/hooks/useAppToast", () => ({
  useAppToast: () => ({ actionSuccess: mocks.actionSuccess, actionError: mocks.actionError }),
}));

describe("UserProfilePage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn((url: string) => {
      if (url === "/api/users/other-user") {
        return Promise.resolve({ ok: true, json: async () => ({ data: { id: "other-user", username: "Other user", avatar_url: null, isFriend: false, stats: null } }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ data: [] }) });
    }));
  });

  it("keeps the friend request action on a non-friend's profile", async () => {
    render(<UserProfilePage />);

    await waitFor(() => expect(screen.getByRole("button", { name: "Send Friend Request" })).toBeInTheDocument());
  });
});
