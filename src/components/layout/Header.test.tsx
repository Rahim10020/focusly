import { act, fireEvent, render, screen, within } from "@testing-library/react";
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

const mainContentId = "main-content";

describe("Header mobile drawer", () => {
  beforeEach(() => {
    mocks.pathname = "/dashboard";
    mocks.session = null;
    mocks.push.mockReset();
    mocks.signOut.mockClear();
    document.body.style.overflow = "";
    history.replaceState(null, "");
  });

  it("opens below the header and closes with Escape while restoring scroll", () => {
    render(<Header mainContentId={mainContentId} />);

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
    render(<Header mainContentId={mainContentId} />);

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
    render(<Header mainContentId={mainContentId} />);

    fireEvent.click(screen.getByRole("button", { name: "Toggle menu" }));
    expect(screen.getByRole("link", { name: "Profile" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Settings" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Sign Out" }));

    expect(screen.queryByLabelText("Mobile navigation")).not.toBeInTheDocument();
    expect(mocks.signOut).toHaveBeenCalledOnce();
  });

  it("closes when clicking outside the drawer and button", () => {
    render(
      <div>
        <Header mainContentId={mainContentId} />
        <button type="button" id="outside">
          Outside
        </button>
      </div>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Toggle menu" }));
    expect(screen.getByLabelText("Mobile navigation")).toBeInTheDocument();

    fireEvent.mouseDown(document.getElementById("outside")!);

    expect(screen.queryByLabelText("Mobile navigation")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Toggle menu" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("does not close when clicking inside the drawer", () => {
    render(<Header mainContentId={mainContentId} />);

    fireEvent.click(screen.getByRole("button", { name: "Toggle menu" }));

    const drawer = screen.getByLabelText("Mobile navigation");
    fireEvent.mouseDown(drawer);

    expect(screen.getByLabelText("Mobile navigation")).toBeInTheDocument();
  });

  it("sets aria-hidden on main content when menu is open", () => {
    const mainContentId = "test-main";
    render(
      <div>
        <main id={mainContentId}>Content</main>
        <Header mainContentId={mainContentId} />
      </div>,
    );

    const toggle = screen.getByRole("button", { name: "Toggle menu" });
    fireEvent.click(toggle);
    const main = document.getElementById(mainContentId);
    expect(main).toHaveAttribute("aria-hidden", "true");

    fireEvent.click(toggle);
    expect(main).not.toHaveAttribute("aria-hidden");
  });

  it("implements focus trap for tab navigation", () => {
    render(<Header mainContentId={mainContentId} />);

    fireEvent.click(screen.getByRole("button", { name: "Toggle menu" }));

    const firstLink = within(screen.getByLabelText("Mobile navigation")).getByRole("link", {
      name: "Dashboard",
    });
    const links = within(screen.getByLabelText("Mobile navigation")).getAllByRole("link");
    const lastLink = links[links.length - 1];

    firstLink.focus();
    expect(document.activeElement).toBe(firstLink);

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(lastLink);

    lastLink.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(firstLink);
  });

  it("closes on swipe gesture exceeding threshold", () => {
    render(<Header mainContentId={mainContentId} />);

    fireEvent.click(screen.getByRole("button", { name: "Toggle menu" }));
    expect(screen.getByLabelText("Mobile navigation")).toBeInTheDocument();

    act(() => {
      const touchStartEvent = new TouchEvent("touchstart", {
        touches: [{ clientX: 100, clientY: 100 } as Touch],
      });
      document.dispatchEvent(touchStartEvent);

      const touchEndEvent = new TouchEvent("touchend", {
        changedTouches: [{ clientX: 200, clientY: 100 } as Touch],
      });
      document.dispatchEvent(touchEndEvent);
    });

    expect(screen.queryByLabelText("Mobile navigation")).not.toBeInTheDocument();
  });

  it("does not close on swipe below threshold", () => {
    render(<Header mainContentId={mainContentId} />);

    fireEvent.click(screen.getByRole("button", { name: "Toggle menu" }));
    expect(screen.getByLabelText("Mobile navigation")).toBeInTheDocument();

    const touchStartEvent = new TouchEvent("touchstart", {
      touches: [{ clientX: 100, clientY: 100 } as Touch],
    });
    document.dispatchEvent(touchStartEvent);

    const touchEndEvent = new TouchEvent("touchend", {
      changedTouches: [{ clientX: 130, clientY: 100 } as Touch],
    });
    document.dispatchEvent(touchEndEvent);

    expect(screen.getByLabelText("Mobile navigation")).toBeInTheDocument();
  });

  it("handles back button navigation when menu is open", () => {
    render(<Header mainContentId={mainContentId} />);

    const toggle = screen.getByRole("button", { name: "Toggle menu" });
    fireEvent.click(toggle);
    expect(screen.getByLabelText("Mobile navigation")).toBeInTheDocument();

    fireEvent(window, new PopStateEvent("popstate"));

    expect(screen.queryByLabelText("Mobile navigation")).not.toBeInTheDocument();
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("updates button aria-label when menu state changes", () => {
    render(<Header mainContentId={mainContentId} />);

    const toggle = screen.getByRole("button", { name: "Toggle menu" });
    fireEvent.click(toggle);

    expect(screen.getByRole("button", { name: "Close menu" })).toBeInTheDocument();
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: "Toggle menu" })).toBeInTheDocument();
  });
});
