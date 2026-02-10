/**
 * @fileoverview CategorySelector component for choosing task category/domain.
 */

import { useMemo } from 'react';
import { DOMAINS, SubDomain } from '@/types';
import Input from '../ui/Input';

interface CategorySelectorProps {
    selectedSubDomain: SubDomain | undefined;
    onChange: (value: SubDomain | undefined) => void;
    searchQuery: string;
    onSearchChange: (value: string) => void;
}

export default function CategorySelector({
    selectedSubDomain,
    onChange,
    searchQuery,
    onSearchChange,
}: CategorySelectorProps) {
    const filteredDomains = useMemo(() => {
        return Object.entries(DOMAINS).filter(([, domainInfo]) => {
            const domainMatch = domainInfo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                domainInfo.description.toLowerCase().includes(searchQuery.toLowerCase());
            const subDomainMatch = Object.values(domainInfo.subDomains).some(subName =>
                subName.toLowerCase().includes(searchQuery.toLowerCase())
            );
            return domainMatch || subDomainMatch;
        });
    }, [searchQuery]);

    return (
        <div className="space-y-4">
            <Input
                type="text"
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
            />

            <div className="space-y-4">
                {filteredDomains.map(([domainKey, domainInfo]) => (
                    <div key={domainKey} className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                                </svg>
                            </div>
                            <div>
                                <div className="text-sm font-semibold text-foreground">
                                    {domainInfo.name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {domainInfo.description}
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-2 ml-10">
                            {Object.entries(domainInfo.subDomains).map(([subDomainKey, subDomainName]) => (
                                <button
                                    key={subDomainKey}
                                    type="button"
                                    onClick={() => onChange(
                                        selectedSubDomain === subDomainKey ? undefined : subDomainKey as SubDomain
                                    )}
                                    className={`p-3 text-left text-sm rounded-lg transition-all cursor-pointer ${
                                        selectedSubDomain === subDomainKey
                                            ? 'bg-primary text-primary-foreground font-medium'
                                            : 'bg-card hover:bg-accent text-foreground border border-border'
                                    }`}
                                >
                                    {subDomainName}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
