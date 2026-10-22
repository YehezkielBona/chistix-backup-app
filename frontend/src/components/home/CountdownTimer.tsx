'use client';

import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate?: string;
}

export default function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const getRemainingTime = () => {
      const target = targetDate ? new Date(targetDate).getTime() : new Date().getTime() + 2 * 3600 * 1000;
      const now = new Date().getTime();
      return Math.max(0, Math.floor((target - now) / 1000));
    };

    setTimeLeft(getRemainingTime());

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!isMounted) {
    return (
      <div className="flex flex-col items-end">
        <span className="text-[10px] text-gray-500 mb-0.5">Ends at</span>
        <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const formatNumber = (num: number) => String(num).padStart(2, '0');

  return (
    <div className="flex flex-col items-end">
      <span className="text-[10px] text-gray-500 font-medium mb-0.5">Ends at</span>
      <div className="flex items-center gap-1 text-[11px] font-bold text-gray-800">
        <span className="rounded bg-gray-200 px-1.5 py-0.5 min-w-[22px] text-center">{formatNumber(hours)}</span>
        <span>:</span>
        <span className="rounded bg-gray-200 px-1.5 py-0.5 min-w-[22px] text-center">{formatNumber(minutes)}</span>
        <span>:</span>
        <span className="rounded bg-gray-200 px-1.5 py-0.5 min-w-[22px] text-center">{formatNumber(seconds)}</span>
      </div>
    </div>
  );
}