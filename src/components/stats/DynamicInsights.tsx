'use client';

import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Insight } from '@/lib/utils/insightGenerator';
import { AlertCircle, TrendingUp, Info, Award } from 'lucide-react';

interface DynamicInsightsProps {
    insights: Insight[];
}

const getInsightColor = (type: Insight['type']) => {
    switch (type) {
        case 'positive':
            return 'border-green-500 bg-green-50 dark:bg-green-950';
        case 'warning':
            return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950';
        case 'achievement':
            return 'border-purple-500 bg-purple-50 dark:bg-purple-950';
        default:
            return 'border-blue-500 bg-blue-50 dark:bg-blue-950';
    }
};

const getInsightIcon = (type: Insight['type']) => {
    switch (type) {
        case 'positive':
            return <TrendingUp className="h-5 w-5 text-green-600" />;
        case 'warning':
            return <AlertCircle className="h-5 w-5 text-yellow-600" />;
        case 'achievement':
            return <Award className="h-5 w-5 text-purple-600" />;
        default:
            return <Info className="h-5 w-5 text-blue-600" />;
    }
};

export default function DynamicInsights({ insights }: DynamicInsightsProps) {
    if (insights.length === 0) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Insights et Recommandations</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {insights.map((insight, index) => (
                        <div
                            key={index}
                            className={`border-l-4 p-4 rounded-r-lg ${getInsightColor(insight.type)}`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5">{getInsightIcon(insight.type)}</div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-2xl">{insight.icon}</span>
                                        <h4 className="font-semibold text-sm">{insight.title}</h4>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        {insight.message}
                                    </p>
                                    {insight.suggestion && (
                                        <p className="text-xs text-muted-foreground italic">
                                            💡 {insight.suggestion}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
