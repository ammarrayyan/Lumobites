'use client';

import React from 'react';
import { Send, CheckCircle2, Calendar, Sparkles, Award, AlertCircle } from 'lucide-react';

interface BookingProgressStepperProps {
  status?: string;
  dates?: string;
  createdAt?: string;
}

export default function BookingProgressStepper({ status, dates, createdAt }: BookingProgressStepperProps) {
  if (!status) return null;

  const normalizedStatus = status.toLowerCase().trim();

  // If declined or cancelled, show clean alert banner
  if (normalizedStatus === 'declined' || normalizedStatus === 'cancelled' || normalizedStatus === 'canceled') {
    return (
      <div className="bg-[#FAF6F4] border-b border-[#E8DDD4] px-4 py-2.5 flex items-center justify-between text-xs text-[#8B7E7D]">
        <div className="flex items-center gap-2 font-semibold">
          <AlertCircle className="w-4 h-4 text-rose-500" />
          <span className="capitalize text-gray-700">Booking {normalizedStatus}</span>
        </div>
        {dates && <span className="text-[11px] text-gray-500 font-medium">{dates}</span>}
      </div>
    );
  }

  // Parse dates to determine if Upcoming vs In Progress vs Completed
  let currentStep = 1; // 1: Inquiry, 2: Accepted, 3: Upcoming, 4: In Progress, 5: Completed
  let stageLabel = 'Inquiry Sent';
  let stageSubtext = 'Awaiting sitter confirmation';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (normalizedStatus === 'pending') {
    currentStep = 1;
    stageLabel = 'Inquiry Sent';
    stageSubtext = 'Awaiting sitter response';
  } else if (normalizedStatus === 'completed') {
    currentStep = 5;
    stageLabel = 'Completed';
    stageSubtext = 'Stay successfully completed';
  } else if (normalizedStatus === 'accepted') {
    // Attempt date parsing
    let isUpcoming = true;
    let isInProgress = false;
    let isPast = false;
    let dayProgress = '';

    if (dates) {
      // Matches formats like "Aug 30, 2026 → Aug 30, 2026", "2026-08-25 to 2026-08-27", or "Aug 25 - Aug 27, 2026"
      const dateParts = dates.split(/\s*(?:-|–|—|→|->|to)\s*/i);
      if (dateParts.length === 2) {
        const start = new Date(dateParts[0].trim());
        const end = new Date(dateParts[1].trim());

        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);

          if (today < start) {
            isUpcoming = true;
            const diffDays = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            stageSubtext = diffDays === 1 ? 'Starts tomorrow' : `Starts in ${diffDays} days`;
          } else if (today >= start && today <= end) {
            isInProgress = true;
            isUpcoming = false;
            const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
            const currentDay = Math.min(totalDays, Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
            dayProgress = `Day ${currentDay} of ${totalDays}`;
            stageSubtext = `Active stay happening now (${dayProgress})`;
          } else if (today > end) {
            isPast = true;
            isUpcoming = false;
            stageSubtext = 'Stay finished • Ready for check-out';
          }
        }
      }
    }

    if (isInProgress) {
      currentStep = 4;
      stageLabel = 'In Progress';
    } else if (isUpcoming) {
      currentStep = 3;
      stageLabel = 'Upcoming';
    } else if (isPast) {
      currentStep = 4;
      stageLabel = 'Awaiting Completion';
    } else {
      currentStep = 2;
      stageLabel = 'Accepted';
      stageSubtext = 'Booking confirmed';
    }
  }

  const steps = [
    { num: 1, label: 'Inquiry', icon: Send },
    { num: 2, label: 'Accepted', icon: CheckCircle2 },
    { num: 3, label: 'Upcoming', icon: Calendar },
    { num: 4, label: 'In Progress', icon: Sparkles },
    { num: 5, label: 'Completed', icon: Award },
  ];

  return (
    <div className="bg-[#FDFAF7] border-b border-[#E8DDD4] px-4 py-3 select-none">
      {/* Top stage info line */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-black text-[#2B231D] tracking-tight">{stageLabel}</span>
        </div>
        <span className="text-[11px] font-medium text-[#8B7E7D]">{stageSubtext}</span>
      </div>

      {/* Visual Stepper Track */}
      <div className="relative flex items-center justify-between">
        {/* Background connector line */}
        <div className="absolute left-3 right-3 top-1/2 -translate-y-1/2 h-0.5 bg-[#E8DDD4] z-0" />

        {/* Active colored connector progress line */}
        <div
          className="absolute left-3 top-1/2 -translate-y-1/2 h-0.5 bg-[#8B5E3C] transition-all duration-500 z-0"
          style={{ width: `${Math.min(100, Math.max(0, ((currentStep - 1) / (steps.length - 1)) * 100))}%` }}
        />

        {/* Stepper Nodes */}
        {steps.map((step) => {
          const Icon = step.icon;
          const isDone = currentStep > step.num;
          const isCurrent = currentStep === step.num;

          return (
            <div key={step.num} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isDone
                    ? 'bg-[#8B5E3C] text-white shadow-xs'
                    : isCurrent
                    ? 'bg-[#8B5E3C] text-white ring-4 ring-[#8B5E3C]/20 shadow-sm scale-110'
                    : 'bg-white text-gray-400 border border-[#E8DDD4]'
                }`}
              >
                <Icon className="w-3 h-3" />
              </div>
              <span
                className={`text-[9.5px] mt-1 tracking-tight font-medium ${
                  isCurrent ? 'font-bold text-[#8B5E3C]' : isDone ? 'text-gray-700' : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
