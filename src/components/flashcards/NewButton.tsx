import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NewButtonProps {
  label: string;
  to: string;
}

export default function NewButton({ label, to }: NewButtonProps) {
  return (
    <Link
      to={to}
      className="bg-[#F37022] text-white font-semibold flex items-center justify-center rounded-md h-10 md:w-10 lg:w-auto md:aspect-square lg:aspect-auto px-4 shadow-sm transition-all duration-200 hover:bg-[#d75602]"
    >
      <Plus className="h-5 w-5 lg:mr-1.5" />
      <span className="hidden lg:inline whitespace-nowrap">{label}</span>
    </Link>
  );
} 