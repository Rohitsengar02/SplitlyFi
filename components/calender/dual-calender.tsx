// component.tsx
"use client";

import * as React from "react";
import { DateRange } from "react-day-picker";
import { Calendar } from "@/components/calender/calender";
import { cn } from "@/lib/utils";

interface DualCalendarProps {
  selected?: DateRange;
  onSelect?: (range: DateRange | undefined) => void;
  className?: string;
}

const DualCalendarWithPreset = React.forwardRef<
  HTMLDivElement,
  DualCalendarProps
>(({ selected, onSelect, className, ...props }, ref) => {
  const [firstMonth, setFirstMonth] = React.useState<Date>(selected?.from || new Date());
  const [secondMonth, setSecondMonth] = React.useState<Date>(() => {
    const next = new Date(selected?.from || new Date());
    next.setMonth(next.getMonth() + 1);
    return next;
  });

  return (
    <div ref={ref} className={cn("max-w-full overflow-x-auto", className)}>
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 p-4 min-w-min">
        {/* First Calendar */}
        <div className="flex-shrink-0">
          <Calendar
            mode="range"
            month={firstMonth}
            onMonthChange={setFirstMonth}
            selected={selected}
            onSelect={onSelect}
            numberOfMonths={1}
            showOutsideDays={true}
            className="rounded-xl border-2 shadow-lg p-4 bg-card w-full max-w-[320px]"
            classNames={{
              month: "space-y-3 w-full",
              day: "group h-9 w-9 px-0 text-sm relative [&:has([aria-selected].range-start)]:bg-primary [&:has([aria-selected].range-start)]:rounded-full [&:has([aria-selected].range-start)]:text-primary-foreground [&:has([aria-selected].range-start)]:font-bold [&:has([aria-selected].range-end)]:bg-primary [&:has([aria-selected].range-end)]:rounded-full [&:has([aria-selected].range-end)]:text-primary-foreground [&:has([aria-selected].range-end)]:font-bold [&:has([aria-selected].range-middle)]:bg-primary/10 [&:has([aria-selected].range-middle)]:text-foreground [&:has([aria-selected].range-middle)]:font-medium [&:has([aria-selected].range-middle)]:rounded-none",
              day_button: "relative flex h-9 w-9 items-center justify-center whitespace-nowrap p-0 text-sm font-medium text-foreground outline-offset-2 transition-all duration-200 focus:outline-none focus-visible:z-10 hover:bg-accent/50 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 z-10",
              weekday: "w-9 h-9 p-0 text-xs font-semibold text-muted-foreground flex items-center justify-center",
              range_start: "range-start",
              range_end: "range-end",
              range_middle: "range-middle",
            } as any}
            {...props}
          />
        </div>

        {/* Second Calendar */}
        <div className="flex-shrink-0">
          <Calendar
            mode="range"
            month={secondMonth}
            onMonthChange={setSecondMonth}
            selected={selected}
            onSelect={onSelect}
            numberOfMonths={1}
            showOutsideDays={true}
            className="rounded-xl border-2 shadow-lg p-4 bg-card w-full max-w-[320px]"
            classNames={{
              month: "space-y-3 w-full",
              day: "group h-9 w-9 px-0 text-sm relative [&:has([aria-selected].range-start)]:bg-primary [&:has([aria-selected].range-start)]:rounded-full [&:has([aria-selected].range-start)]:text-primary-foreground [&:has([aria-selected].range-start)]:font-bold [&:has([aria-selected].range-end)]:bg-primary [&:has([aria-selected].range-end)]:rounded-full [&:has([aria-selected].range-end)]:text-primary-foreground [&:has([aria-selected].range-end)]:font-bold [&:has([aria-selected].range-middle)]:bg-primary/10 [&:has([aria-selected].range-middle)]:text-foreground [&:has([aria-selected].range-middle)]:font-medium [&:has([aria-selected].range-middle)]:rounded-none",
              day_button: "relative flex h-9 w-9 items-center justify-center whitespace-nowrap p-0 text-sm font-medium text-foreground outline-offset-2 transition-all duration-200 focus:outline-none focus-visible:z-10 hover:bg-accent/50 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 z-10",
              weekday: "w-9 h-9 p-0 text-xs font-semibold text-muted-foreground flex items-center justify-center",
              range_start: "range-start",
              range_end: "range-end",
              range_middle: "range-middle",
            } as any}
            {...props}
          />
        </div>
      </div>
    </div>
  );
});

DualCalendarWithPreset.displayName = "DualCalendarWithPreset";

export default DualCalendarWithPreset;