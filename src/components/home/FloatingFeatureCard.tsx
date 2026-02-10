/**
 * @fileoverview Floating feature card component for landing page.
 */

import Card, { CardContent } from '@/components/ui/Card';

interface FloatingFeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  className?: string;
  animationDelay?: string;
}

export function FloatingFeatureCard({
  title,
  description,
  icon,
  className = '',
  animationDelay = '0s',
}: FloatingFeatureCardProps) {
  return (
    <div
      className={`absolute opacity-70 blur-[0.1px] animate-float ${className}`}
      style={{ animationDelay }}
    >
      <Card variant="elevated" className="group bg-card/80 backdrop-blur-sm">
        <CardContent className="p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-primary/10 rounded-2xl flex items-center justify-center">
            {icon}
          </div>
          <h3 className="text-lg text-foreground font-semibold mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
