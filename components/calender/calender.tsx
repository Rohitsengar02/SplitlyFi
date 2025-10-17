"use client";

import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import * as React from "react";
import { DayPicker, CaptionProps } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  components: userComponents,
  month: controlledMonth,
  onMonthChange,
  ...props
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(controlledMonth || new Date());
  const defaultClassNames = {
    months: "relative flex flex-col sm:flex-row gap-4 lg:gap-6",
    month: "w-full min-w-[260px] lg:min-w-[280px] space-y-3 lg:space-y-4",
    month_caption: "relative flex h-10 lg:h-12 items-center justify-center z-20 mb-3 lg:mb-4",
    caption_label: "text-base lg:text-lg font-bold text-primary hidden",
    nav: "hidden",
    button_previous: cn(
      buttonVariants({ variant: "ghost" }),
      "h-8 w-8 lg:h-9 lg:w-9 bg-transparent p-0 opacity-60 hover:opacity-100 hover:bg-accent rounded-lg transition-all",
    ),
    button_next: cn(
      buttonVariants({ variant: "ghost" }),
      "h-8 w-8 lg:h-9 lg:w-9 bg-transparent p-0 opacity-60 hover:opacity-100 hover:bg-accent rounded-lg transition-all",
    ),
    weekday: "w-9 h-9 lg:w-10 lg:h-10 p-0 text-xs font-bold text-muted-foreground uppercase flex items-center justify-center",
    day_button:
      "relative flex h-9 w-9 lg:h-10 lg:w-10 items-center justify-center whitespace-nowrap p-0 text-sm font-normal text-foreground outline-offset-2 transition-all duration-200 focus:outline-none focus-visible:z-10 hover:bg-primary/10 hover:rounded-full hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 z-10",
    day: "group h-9 w-9 lg:h-10 lg:w-10 px-0 text-sm relative [&:has([aria-selected].range-start)]:bg-gradient-to-br [&:has([aria-selected].range-start)]:from-primary [&:has([aria-selected].range-start)]:via-primary [&:has([aria-selected].range-start)]:to-primary/80 [&:has([aria-selected].range-start)]:rounded-full [&:has([aria-selected].range-start)]:text-primary-foreground [&:has([aria-selected].range-start)]:font-bold [&:has([aria-selected].range-start)]:shadow-lg [&:has([aria-selected].range-end)]:bg-gradient-to-br [&:has([aria-selected].range-end)]:from-primary [&:has([aria-selected].range-end)]:via-primary [&:has([aria-selected].range-end)]:to-primary/80 [&:has([aria-selected].range-end)]:rounded-full [&:has([aria-selected].range-end)]:text-primary-foreground [&:has([aria-selected].range-end)]:font-bold [&:has([aria-selected].range-end)]:shadow-lg [&:has([aria-selected].range-middle)]:bg-gradient-to-r [&:has([aria-selected].range-middle)]:from-primary/5 [&:has([aria-selected].range-middle)]:via-primary/15 [&:has([aria-selected].range-middle)]:to-primary/5 [&:has([aria-selected].range-middle)]:text-foreground [&:has([aria-selected].range-middle)]:font-normal [&:has([aria-selected].range-middle)]:rounded-none",
    range_start: "range-start",
    range_end: "range-end",
    range_middle: "range-middle",
    today:
      "*:after:pointer-events-none *:after:absolute *:after:bottom-1.5 *:after:start-1/2 *:after:z-10 *:after:size-1 *:after:-translate-x-1/2 *:after:rounded-full *:after:bg-primary [&[data-selected]:not(.range-middle)>*]:after:bg-background [&[data-disabled]>*]:after:bg-foreground/30 *:after:transition-colors",
    outside: "text-muted-foreground/30 opacity-40",
    hidden: "invisible",
    week_number: "h-9 w-9 lg:h-10 lg:w-10 p-0 text-xs font-medium text-muted-foreground/80",
  };

  const mergedClassNames: typeof defaultClassNames = Object.keys(defaultClassNames).reduce(
    (acc, key) => ({
      ...acc,
      [key]: classNames?.[key as keyof typeof classNames]
        ? cn(
            defaultClassNames[key as keyof typeof defaultClassNames],
            classNames[key as keyof typeof classNames],
          )
        : defaultClassNames[key as keyof typeof defaultClassNames],
    }),
    {} as typeof defaultClassNames,
  );

  React.useEffect(() => {
    if (controlledMonth) {
      setCurrentMonth(controlledMonth);
    }
  }, [controlledMonth]);

  const CustomCaption = ({ displayMonth }: CaptionProps) => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - 50 + i);

    const handleMonthChange = (month: string) => {
      const newDate = new Date(displayMonth);
      newDate.setMonth(months.indexOf(month));
      setCurrentMonth(newDate);
      onMonthChange?.(newDate);
    };

    const handleYearChange = (year: string) => {
      const newDate = new Date(displayMonth);
      newDate.setFullYear(parseInt(year));
      setCurrentMonth(newDate);
      onMonthChange?.(newDate);
    };

    return (
      <div className="flex items-center justify-center gap-1.5 lg:gap-2 mb-2 lg:mb-3">
        <Select
          value={months[displayMonth.getMonth()]}
          onValueChange={handleMonthChange}
        >
          <SelectTrigger className="h-9 w-[110px] lg:h-10 lg:w-[120px] text-sm lg:text-base font-bold text-primary border-none shadow-none hover:bg-accent/50 transition-colors">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {months.map((month) => (
              <SelectItem key={month} value={month} className="text-sm cursor-pointer">
                {month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={displayMonth.getFullYear().toString()}
          onValueChange={handleYearChange}
        >
          <SelectTrigger className="h-9 w-[75px] lg:h-10 lg:w-[85px] text-sm lg:text-base font-bold text-primary border-none shadow-none hover:bg-accent/50 transition-colors">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()} className="text-sm cursor-pointer">
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  const defaultComponents = {
    Chevron: (props: any) => {
      if (props.orientation === "left") {
        return <ChevronLeft size={16} strokeWidth={2} {...props} aria-hidden="true" />;
      }
      return <ChevronRight size={16} strokeWidth={2} {...props} aria-hidden="true" />;
    },
    Caption: CustomCaption,
  };

  const mergedComponents = {
    ...defaultComponents,
    ...userComponents,
  };

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("w-fit", className)}
      classNames={mergedClassNames}
      components={mergedComponents}
      month={currentMonth}
      onMonthChange={(newMonth) => {
        setCurrentMonth(newMonth);
        onMonthChange?.(newMonth);
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };