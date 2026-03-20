import React, { useMemo } from "react";
import { CalendarIcon } from "lucide-react";
import { format, isValid, parse } from "date-fns";

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type DateInputProps = {
  label: string;
  value?: string;
  placeholder?: string;
  onChange: (nextValue: string) => void;
};

const supportedInputFormats = [
  "dd-MMM-yy",
  "yyyy-MM-dd",
  "dd-MM-yyyy",
  "dd/MM/yyyy",
  "MM/dd/yyyy",
];

function parseSupportedDate(value: string | undefined) {
  if (!value) return undefined;

  const normalized = value.trim();
  if (!normalized) return undefined;

  for (const dateFormat of supportedInputFormats) {
    const parsedDate = parse(normalized, dateFormat, new Date());
    if (isValid(parsedDate)) {
      return parsedDate;
    }
  }

  const parsedNativeDate = new Date(normalized);
  if (isValid(parsedNativeDate)) {
    return parsedNativeDate;
  }

  return undefined;
}

export function DateInput({ label, value, placeholder, onChange }: DateInputProps) {
  const selectedDate = useMemo(() => parseSupportedDate(value), [value]);

  return (
    <div className="w-full">
      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">
        {label}
      </label>

      <div className="relative">
        <input
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="
            w-full px-4 py-2.5 pr-12 rounded-xl
            bg-white border-2 border-border
            text-foreground placeholder:text-muted-foreground/50
            focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10
            transition-all duration-200 text-sm font-medium
          "
        />

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="
                absolute right-2 top-1/2 -translate-y-1/2
                h-8 w-8 inline-flex items-center justify-center rounded-md
                text-slate-500 hover:text-slate-700 hover:bg-slate-100
                transition-colors
              "
              aria-label={`Select ${label.toLowerCase()} from calendar`}
            >
              <CalendarIcon className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-white border-slate-200 shadow-xl" align="end">
            <Calendar
              className="bg-white rounded-md"
              mode="single"
              selected={selectedDate}
              classNames={{
                months: "bg-white",
                day_selected:
                  "bg-emerald-600 text-white hover:bg-emerald-700 focus:bg-emerald-700",
                day_today: "bg-emerald-100 text-emerald-700",
                nav_button:
                  "h-7 w-7 bg-emerald-50 text-emerald-700 p-0 opacity-100 hover:bg-emerald-100 hover:text-emerald-800",
                caption_label: "text-sm font-semibold text-emerald-700",
              }}
              onSelect={(date) => {
                if (!date) return;
                onChange(format(date, "dd-MMM-yy"));
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
