"use client";

import * as React from "react";
import { DateRange } from "react-day-picker";

import { Calendar } from "@/components/ui/calendar";

type DualCalendarProps = Omit<React.ComponentPropsWithoutRef<typeof Calendar>, 'mode' | 'selected' | 'onSelect'>;

const DualCalendarWithPreset: React.FC<DualCalendarProps> = (props) => {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(2025, 5, 12),
    to: new Date(2025, 5, 20)
  });

  return (
    <Calendar
      {...props}
      mode="range"
      defaultMonth={date?.from}
      numberOfMonths={2}
      selected={date}
      onSelect={setDate}
      className="rounded-lg border shadow-sm"
    />
  );
};

DualCalendarWithPreset.displayName = "DualCalendarWithPreset";

export default DualCalendarWithPreset;