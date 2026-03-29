
import { Achievement } from "@/types";

interface AchievementCardProps {
  achievement: Achievement;
  isLocked: boolean;
}

export default function AchievementCard({
  achievement,
  isLocked,
}: AchievementCardProps) {
  const progress = achievement.progress || 0;
  const target = achievement.target || 1;
  const percentage = Math.min((progress / target) * 100, 100);

  return (
    <div
      key={achievement.id}
      className={`p-4 rounded-xl border-2 transition-all ${
        isLocked
          ? "bg-muted/50 border-border opacity-60"
          : "bg-primary/10 border-primary shadow-sm"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`text-4xl ${isLocked ? "grayscale" : ""}`}>
          {achievement.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground mb-1">{achievement.title}</h3>
          <p className="text-sm text-muted-foreground mb-2">
            {achievement.description}
          </p>

          {isLocked && achievement.target && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>
                  {progress} / {target}
                </span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )}

          {!isLocked && achievement.unlockedAt && (
            <p className="text-xs text-primary font-medium">
              Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
