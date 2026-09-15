import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { LeaderboardUser } from "@/types/leaderboard";
import { LeaderboardList } from "./LeaderboardList";
import { LeaderboardPodium } from "./LeaderboardPodium";

const users: LeaderboardUser[] = [
  { id: "first", username: "First", avatar_url: null, stats: { total_sessions: 4, completed_tasks: 9, total_tasks: 10, streak: 3, total_focus_time: 1200, longest_streak: 4 } },
  { id: "second", username: "Second", avatar_url: null, stats: { total_sessions: 3, completed_tasks: 8, total_tasks: 9, streak: 2, total_focus_time: 900, longest_streak: 3 } },
  { id: "third", username: "Third", avatar_url: null, stats: { total_sessions: 2, completed_tasks: 7, total_tasks: 8, streak: 1, total_focus_time: 600, longest_streak: 2 } },
];

describe("leaderboard profile navigation", () => {
  it("renders ranking rows as profile links without friend request controls", () => {
    render(<LeaderboardList leaderboard={users} selectedTab="tasks" currentUserId="current-user" />);

    expect(screen.getByRole("link", { name: "View First's profile" })).toHaveAttribute("href", "/users/first");
    expect(screen.queryByRole("button", { name: /friend|request/i })).not.toBeInTheDocument();
  });

  it("links every podium card to its user's profile", () => {
    render(<LeaderboardPodium leaderboard={users} selectedTab="tasks" />);

    users.forEach((user) => {
      expect(screen.getByRole("link", { name: `View ${user.username}'s profile` })).toHaveAttribute("href", `/users/${user.id}`);
    });
  });
});
