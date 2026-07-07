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
}

export default function CategorySelector({
  selectedSubDomain,
  onChange,
  searchQuery,
  onSearchChange,
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
    <div className="space-y-8 pb-10">
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
                <TableIcon size={20} className="text-primary" />
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
                    className={`p-3 text-left text-sm rounded-lg transition-all cursor-pointer ${
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
