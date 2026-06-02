import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  icon?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  variant?: 'popover' | 'layout'; // 'popover' is for sage green forms, 'layout' is for workspace layouts
  className?: string;
}

export function CustomSelect({ value, onChange, options, variant = 'popover', className = '' }: CustomSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  const buttonClass = variant === 'popover'
    ? "w-full py-2.5 px-4 bg-black/5 hover:bg-black/10 rounded-2xl flex justify-between items-center text-xs font-semibold text-zinc-900 focus:outline-none transition-colors"
    : "w-full py-3 px-4.5 bg-zinc-950/40 hover:bg-zinc-900/60 border border-white/[0.06] rounded-2xl flex justify-between items-center text-xs font-semibold text-zinc-300 transition-colors";

  const chevronClass = variant === 'popover' ? "text-zinc-800" : "text-zinc-500";

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={buttonClass}
      >
        <span className="flex items-center gap-2">
          {selectedOption?.icon && <span>{selectedOption.icon}</span>}
          <span>{selectedOption?.label}</span>
        </span>
        <ChevronDown className={`w-3.5 h-3.5 ${chevronClass}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40 cursor-default"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="absolute left-0 right-0 mt-1 bg-[#060c09] text-zinc-200 border border-white/[0.08] rounded-[24px] p-4 shadow-xl z-50 flex flex-col space-y-1.5"
            >
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={isSelected
                      ? "w-full bg-[#0c5c36] text-white px-5 py-2.5 rounded-full font-bold text-left text-xs tracking-wide flex items-center gap-2.5 transition-all"
                      : "w-full flex items-center gap-2.5 px-5 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-white/[0.04] rounded-xl text-left transition-all"
                    }
                  >
                    {opt.icon && <span>{opt.icon}</span>}
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
