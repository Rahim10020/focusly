import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Header from "./Header";

const mocks = vi.hoisted(() => ({
  pathname: "/dashboard",
  push: vi.fn(),
  signOut: vi.fn().mockResolvedValue(undefined),
  session: null as { user?: { name?: string; email?: string } } | null,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useSession: () => ({ data: mocks.session }),
  signOut: mocks.signOut,
}));

vi.mock("@/components/providers/NotificationsProvider", () => ({
  useNotificationsContext: () => ({ unreadCount: 0 }),
}));

vi.mock("../shared/AppLogo", () => ({
  default: () => <span>Focusly</span>,
}));

vi.mock("../shared/UserMenu", () => ({ default: () => null }));

describe("Header mobile drawer", () => {
  beforeEach(() => {
    mocks.pathname = "/dashboard";
    mocks.session = null;
    mocks.push.mockReset();
    mocks.signOut.mockClear();
    document.body.style.overflow = "";
  });

  it("opens below the header and closes with Escape while restoring scroll", () => {
    render(<Header />);

    const toggle = screen.getByRole("button", { name: "Toggle menu" });
    fireEvent.click(toggle);

    const drawer = screen.getByLabelText("Mobile navigation").parentElement;
    expect(drawer).toHaveAttribute("id", "mobile-navigation-drawer");
    expect(drawer).toHaveClass("fixed", "top-14", "bottom-0", "z-40");
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByLabelText("Mobile navigation")).not.toBeInTheDocument();
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(document.body.style.overflow).toBe("");
    expect(document.activeElement).toBe(toggle);
  });

  it("closes after selecting a navigation link", () => {
    render(<Header />);

    fireEvent.click(screen.getByRole("button", { name: "Toggle menu" }));
    fireEvent.click(
      within(screen.getByLabelText("Mobile navigation")).getByRole("link", {
        name: "Tasks",
      }),
    );

    expect(screen.queryByLabelText("Mobile navigation")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
  });

  it("shows authenticated account actions and closes before signing out", async () => {
    mocks.session = { user: { name: "Ada" } };
    render(<Header />);

    fireEvent.click(screen.getByRole("button", { name: "Toggle menu" }));
    expect(screen.getByRole("link", { name: "Profile" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Settings" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Sign Out" }));

    expect(screen.queryByLabelText("Mobile navigation")).not.toBeInTheDocument();
    expect(mocks.signOut).toHaveBeenCalledOnce();
  });
});
