'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Building2 } from 'lucide-react';

interface CityAutocompleteInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  inputClassName?: string;
  label?: string;
}

export default function CityAutocompleteInput({
  value,
  onChange,
  placeholder = 'e.g. Austin, TX, USA',
  required = false,
  className = '',
  inputClassName = 'w-full bg-[#FAF6F0] border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#8B5E3C]',
  label
}: CityAutocompleteInputProps) {
  const [options, setOptions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!value || value.trim().length < 2) {
      setOptions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/city-board/autocomplete?input=${encodeURIComponent(value.trim())}`);
        if (res.ok) {
          const data = await res.json();
          const rawOptions = data.options || [];
          const stringOptions: string[] = rawOptions
            .map((opt: any) => (typeof opt === 'string' ? opt : opt?.clean_city || opt?.formatted_address || ''))
            .filter((str: string) => str && str.trim() !== '');
          setOptions(stringOptions);
        }
      } catch {
        setOptions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      {label && <label className="font-bold text-gray-700 block mb-1 text-xs">{label}</label>}
      <div className="relative">
        <input
          type="text"
          required={required}
          value={value}
          onChange={e => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={inputClassName}
        />
      </div>

      {isOpen && options.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-[#E8DDD4] rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-gray-100 text-xs">
          {options.map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
              className="w-full text-left p-2.5 hover:bg-amber-50 text-gray-700 font-medium cursor-pointer border-none bg-transparent flex items-center gap-2"
            >
              <Building2 className="w-3.5 h-3.5 text-[#8B5E3C] shrink-0" />
              <span className="truncate">{opt}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
