/**
 * @fileoverview Leaderboard header component
 */

export function LeaderboardHeader() {
  return (
    <div className="mb-8">
      <h1 className="text-4xl font-bold mb-2 bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
        Leaderboard
      </h1>
      <p className="text-muted-foreground text-lg">
        Compete with other Focusly users and climb to the top!
      </p>
    </div>
  );
}
