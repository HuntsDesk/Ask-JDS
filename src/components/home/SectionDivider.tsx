import React from 'react';

interface SectionDividerProps {
  label?: string;
  className?: string;
}

export function SectionDivider({ label, className = '' }: SectionDividerProps) {
  return (
    <div className={`border-t border-gray-200 my-20 ${className}`}>
      {label && (
        <div className="max-w-4xl mx-auto text-center -mt-4">
          <span className="bg-white px-6 py-2 text-sm font-medium text-gray-500 uppercase tracking-wide">
            {label}
          </span>
        </div>
      )}
    </div>
  );
} 