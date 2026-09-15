/**
 * @fileoverview Leaderboard header component
 */

export function LeaderboardHeader() {
  return (
    <div className="mb-8">
      <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-foreground">
        Leaderboard
      </h1>
      <p className="text-muted-foreground text-lg">
        Compete with other Focusly users and climb to the top!
      </p>
    </div>
  );
}
