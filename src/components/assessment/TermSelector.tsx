"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import { Term } from "@/components/assessment/AssessmentForm.types";

interface TermSelectorProps {
  terms: Term[];
  selectedTermId: string;
  onTermSelect: (termId: string) => void;
  loading?: boolean;
  placeholder?: string;
  className?: string;
  allowEmpty?: boolean;
}

const TermSelector: React.FC<TermSelectorProps> = ({
  terms,
  selectedTermId,
  onTermSelect,
  loading = false,
  placeholder = "Select a term",
  className = "",
  allowEmpty = false,
}) => {
  if (loading) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full px-3 py-2 border border-tl-control rounded-md bg-tl-subtle animate-pulse">
          <div className="h-5 bg-tl-line rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <select
        value={selectedTermId}
        onChange={(e) => onTermSelect(e.target.value)}
        className="w-full px-3 py-2 border border-tl-control rounded-md focus:outline-none focus:ring-2 focus:ring-tl-link focus:border-tl-link appearance-none bg-tl-surface"
      >
        {allowEmpty && <option value="">{placeholder}</option>}
        {!allowEmpty && !selectedTermId && <option value="">{placeholder}</option>}
        {terms.map((term) => (
          <option key={term._id} value={term._id}>
            {term.name} ({new Date(term.startDate).getFullYear()}){term.isCurrent && " - Current"}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-tl-faint pointer-events-none" />
    </div>
  );
};

export default TermSelector;
