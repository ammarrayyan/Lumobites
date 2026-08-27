'use client';

import React from 'react';
import { Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { PartnerHours } from '@/lib/partnerProfileHelper';

interface PartnerHoursEditorProps {
  hours: PartnerHours;
  onChange: (updatedHours: PartnerHours) => void;
  showEmergencyToggle?: boolean;
}

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
] as const;

export default function PartnerHoursEditor({
  hours,
  onChange,
  showEmergencyToggle = true,
}: PartnerHoursEditorProps) {
  const currentHours = hours || {};

  const handleDayChange = (day: string, field: 'open' | 'close' | 'closed', value: any) => {
    const prevDay = (currentHours as any)[day] || { open: '08:00', close: '18:00', closed: false };
    const updated = {
      ...currentHours,
      [day]: {
        ...prevDay,
        [field]: value,
      },
    };
    onChange(updated);
  };

  const handleEmergencyToggle = (checked: boolean) => {
    onChange({
      ...currentHours,
      emergency24x7: checked,
    });
  };

  const handle24x7Toggle = (checked: boolean) => {
    onChange({
      ...currentHours,
      is24x7: checked,
    });
  };

  return (
    <div className="bg-[#FAF6F2] border border-[#E2D5C8] rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-black text-[#2E2419] flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-[#8B5E3C]" /> Hours of Operation
        </h3>

        <div className="flex items-center gap-3 flex-wrap">
          {showEmergencyToggle && (
            <label className="flex items-center gap-1.5 text-xs font-bold text-[#8B5E3C] cursor-pointer">
              <input
                type="checkbox"
                checked={!!currentHours.emergency24x7}
                onChange={(e) => handleEmergencyToggle(e.target.checked)}
                className="w-4 h-4 rounded text-[#8B5E3C] accent-[#8B5E3C] cursor-pointer"
              />
              24/7 Emergency Care
            </label>
          )}

          <label className="flex items-center gap-1.5 text-xs font-bold text-[#2E2419] cursor-pointer">
            <input
              type="checkbox"
              checked={!!currentHours.is24x7}
              onChange={(e) => handle24x7Toggle(e.target.checked)}
              className="w-4 h-4 rounded text-[#8B5E3C] accent-[#8B5E3C] cursor-pointer"
            />
            Open 24 Hours
          </label>
        </div>
      </div>

      {!currentHours.is24x7 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {DAYS.map(({ key, label }) => {
            const dayConfig = (currentHours as any)[key] || { open: '08:00', close: '18:00', closed: false };
            const isClosed = !!dayConfig.closed;

            return (
              <div
                key={key}
                className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 text-xs ${
                  isClosed
                    ? 'bg-gray-50 border-gray-200 opacity-60'
                    : 'bg-white border-[#E2D5C8]'
                }`}
              >
                <div className="w-24 font-black text-[#2E2419]">{label}</div>

                <div className="flex items-center gap-1.5 flex-1 justify-end">
                  {!isClosed ? (
                    <>
                      <input
                        type="time"
                        value={dayConfig.open || '08:00'}
                        onChange={(e) => handleDayChange(key, 'open', e.target.value)}
                        className="bg-[#FAF6F2] border border-[#E2D5C8] rounded-lg px-2 py-1 text-xs text-[#2E2419] focus:outline-hidden"
                      />
                      <span className="text-gray-400 font-bold">–</span>
                      <input
                        type="time"
                        value={dayConfig.close || '18:00'}
                        onChange={(e) => handleDayChange(key, 'close', e.target.value)}
                        className="bg-[#FAF6F2] border border-[#E2D5C8] rounded-lg px-2 py-1 text-xs text-[#2E2419] focus:outline-hidden"
                      />
                    </>
                  ) : (
                    <span className="text-xs font-semibold text-gray-500 italic pr-2">Closed</span>
                  )}

                  <label className="flex items-center gap-1 text-[11px] font-bold text-gray-500 cursor-pointer ml-1">
                    <input
                      type="checkbox"
                      checked={isClosed}
                      onChange={(e) => handleDayChange(key, 'closed', e.target.checked)}
                      className="w-3.5 h-3.5 rounded accent-[#8B5E3C] cursor-pointer"
                    />
                    Closed
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div>
        <label className="text-xs font-bold text-[#2E2419] block mb-1">Custom Hours Note / Holiday Policy (Optional)</label>
        <input
          type="text"
          value={currentHours.customNote || ''}
          onChange={(e) => onChange({ ...currentHours, customNote: e.target.value })}
          placeholder="e.g. Call ahead for holiday boarding drop-off times"
          className="w-full bg-white border border-[#E2D5C8] rounded-xl px-3 py-2 text-xs text-[#2E2419] focus:outline-hidden focus:border-[#8B5E3C]"
        />
      </div>
    </div>
  );
}
