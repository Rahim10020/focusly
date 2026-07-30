/**
 * @fileoverview Domain distribution component displaying task distribution across domains.
 */

"use client";

import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

interface DomainData {
  domain: string;
  count: number;
  completed: number;
}

interface DomainDistributionProps {
  domains: DomainData[];
}

export function DomainDistribution({ domains }: DomainDistributionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Domain Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 mt-12">
          {domains.map((domain, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between text-xl">
                <span className="font-normal">
                  {domain.domain.split("(")[0].trim()}
                </span>
                <span className="text-muted-foreground">
                  {domain.completed}/{domain.count}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{
                    width: `${domain.count > 0 ? (domain.completed / domain.count) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
