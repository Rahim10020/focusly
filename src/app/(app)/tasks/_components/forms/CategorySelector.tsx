/**
 * @fileoverview CategorySelector component for choosing task category/domain.
 */

import { useMemo } from "react";
import { DOMAINS, SubDomain } from "@/types";
import Input from "@/components/ui/Input";
import { TableIcon } from "@/components/shared/icons";

interface CategorySelectorProps {
  selectedSubDomain: SubDomain | undefined;
  onChange: (value: SubDomain | undefined) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  compact?: boolean;
}

export default function CategorySelector({
  selectedSubDomain,
  onChange,
  searchQuery,
  onSearchChange,
  compact = false,
}: CategorySelectorProps) {
  const filteredDomains = useMemo(() => {
    return Object.entries(DOMAINS).filter(([, domainInfo]) => {
      const domainMatch =
        domainInfo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        domainInfo.description
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      const subDomainMatch = Object.values(domainInfo.subDomains).some(
        (subInfo) =>
          subInfo.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      return domainMatch || subDomainMatch;
    });
  }, [searchQuery]);

  return (
    <div className={`${compact ? "p-2 space-y-2 max-h-[50vh] overflow-y-auto" : "space-y-8 pb-10"}`}>
      <Input
        type="text"
        placeholder="Search categories..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className={compact ? "h-8 text-xs" : ""}
      />

      <div className={`space-y-3 ${compact ? "" : "space-y-4"}`}>
        {filteredDomains.map(([domainKey, domainInfo]) => (
          <div key={domainKey} className={`space-y-1 ${compact ? "" : "space-y-2"}`}>
            <div className="flex items-center gap-2">
              <div className={`rounded-lg bg-primary/10 flex items-center justify-center ${compact ? "w-6 h-6" : "w-8 h-8 rounded-lg"}`}>
                <TableIcon size={compact ? 16 : 20} className="text-primary" />
              </div>
              <div>
                <div className={`font-semibold text-foreground ${compact ? "text-xs" : "text-sm"}`}>
                  {domainInfo.name}
                </div>
                {!compact && (
                  <div className="text-xs text-muted-foreground">
                    {domainInfo.description}
                  </div>
                )}
              </div>
            </div>
            <div className={`grid grid-cols-1 gap-1 ${compact ? "ml-8" : "ml-10 gap-2"}`}>
              {Object.entries(domainInfo.subDomains).map(
                ([subDomainKey, subDomainInfo]) => (
                  <button
                    key={subDomainKey}
                    type="button"
                    onClick={() =>
                      onChange(
                        selectedSubDomain === subDomainKey
                          ? undefined
                          : (subDomainKey as SubDomain),
                      )
                    }
                    className={`text-left rounded-lg transition-all cursor-pointer ${
                      compact
                        ? "p-2 text-xs"
                        : "p-3 text-sm"
                    } ${
                      selectedSubDomain === subDomainKey
                        ? "bg-primary text-foreground font-medium"
                        : "bg-card hover:bg-accent text-foreground border border-border"
                    }`}
                  >
                    {subDomainInfo.name}
                  </button>
                ),
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
