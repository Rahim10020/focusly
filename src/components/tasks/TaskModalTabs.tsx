/**
 * @fileoverview TaskModalTabs component for tab navigation in compact mode.
 */

interface TaskModalTabsProps {
    activeTab: 'details' | 'categories' | 'subtasks';
    onTabChange: (tab: 'details' | 'categories' | 'subtasks') => void;
    selectedSubDomain?: string;
    subTasksCount: number;
}

export default function TaskModalTabs({
    activeTab,
    onTabChange,
    selectedSubDomain,
    subTasksCount,
}: TaskModalTabsProps) {
    const tabs = [
        { id: 'details', label: 'Details', badge: null },
        { id: 'categories', label: 'Categories', badge: selectedSubDomain ? '1' : null },
        { id: 'subtasks', label: 'Subtasks', badge: subTasksCount > 0 ? subTasksCount.toString() : null }
    ];

    return (
        <div className="sticky top-[89px] bg-card border-b border-border px-6 z-10">
            <div className="flex">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id as 'details' | 'categories' | 'subtasks')}
                        className={`flex-1 cursor-pointer flex items-center justify-center gap-2 py-2 text-sm font-medium transition-all border-b-2 ${
                            activeTab === tab.id
                                ? 'text-primary border-primary bg-primary/5'
                                : 'text-muted-foreground border-transparent hover:text-foreground hover:bg-accent/50'
                        }`}
                    >
                        <span>{tab.label}</span>
                        {tab.badge && (
                            <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                                {tab.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
