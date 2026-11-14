// Client component: import it from client modules only (they are the client boundary, so
// its function props never cross from the server).

import { cn } from "cn";
import { format, isValid, parse } from "date-fns";
import { CalendarDays, Check, ChevronDown } from "lucide-react";
import { useId, useState, type ComponentProps } from "react";

import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fieldClass } from "@/features/auth/form-parts";

/*
 * The console's choosers, built from the kit so every page looks the same: a select, a date, a
 * time and a searchable list. Each trigger takes the look of the fields beside it
 * (`fieldClass`); a page passes its own height and rounding.
 */

/** The look of a trigger: the app's field, with its value and a chevron or icon */
export const triggerClass = cn(
  fieldClass,
  "flex items-center justify-between gap-2 text-left data-placeholder:text-muted-foreground/60",
);

/** Radix Select can't hold an empty value, so "any" travels as this */
const ANY = "__any__";

export interface Option {
  value: string;
  label: string;
}

/** Films as options for a SearchSelect, by title */
export function filmOptions(films: readonly { id: string; title: string }[] | undefined): Option[] {
  return (films ?? []).map((film) => ({ value: film.id, label: film.title }));
}

/**
 * A short list (a status, a role, a rating). With `anyLabel`, the first item clears the choice
 * and stands for "" (a filter's "Any status").
 */
export function OptionSelect({
  id,
  value,
  onChange,
  options,
  anyLabel,
  placeholder,
  label,
  className,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly Option[];
  anyLabel?: string;
  placeholder?: string;
  /** For a select without a visible label (filters) */
  label?: string;
  className?: string;
}) {
  return (
    <Select
      value={value === "" && anyLabel ? ANY : value}
      onValueChange={(next) => onChange(next === ANY ? "" : next)}
    >
      <SelectTrigger id={id} aria-label={label} className={cn(triggerClass, className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {anyLabel && <SelectItem value={ANY}>{anyLabel}</SelectItem>}
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * A long list to search (every film): type to narrow it. With `anyLabel`, the first item clears
 * the choice ("All films").
 */
export function SearchSelect({
  id,
  value,
  onChange,
  options,
  anyLabel,
  placeholder,
  searchPlaceholder = "Search",
  emptyText = "Nothing matches.",
  label,
  className,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly Option[];
  anyLabel?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const chosen = options.find((option) => option.value === value);
  const choose = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-label={label}
          data-placeholder={chosen || anyLabel ? undefined : ""}
          className={cn(triggerClass, className)}
        >
          <span className="truncate">{chosen?.label ?? anyLabel ?? placeholder}</span>
          <ChevronDown aria-hidden="true" className="size-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent id={listId} className="w-(--radix-popover-trigger-width) min-w-56 p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            {anyLabel && (
              <CommandItem value={anyLabel} onSelect={() => choose("")}>
                {anyLabel}
                {value === "" && <Check className="absolute right-2 size-3.5 text-brand" />}
              </CommandItem>
            )}
            {options.map((option) => (
              <CommandItem
                // Matched by its label; the id keeps two films of the same name apart
                key={option.value}
                value={`${option.label} ${option.value}`}
                keywords={[option.label]}
                onSelect={() => choose(option.value)}
              >
                <span className="truncate">{option.label}</span>
                {option.value === value && (
                  <Check className="absolute right-2 size-3.5 text-brand" />
                )}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

const DAY_FORMAT = "yyyy-MM-dd";

/** A calendar day as the API and the URL carry it: `yyyy-MM-dd`, or "" for none */
export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Choose a day",
  label,
  disabled,
  className,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  /** Days that can't be chosen (react-day-picker matchers, e.g. `{ before: today }`) */
  disabled?: ComponentProps<typeof Calendar>["disabled"];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const parsed = value ? parse(value, DAY_FORMAT, new Date()) : undefined;
  const day = parsed && isValid(parsed) ? parsed : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          aria-label={label}
          data-placeholder={day ? undefined : ""}
          className={cn(triggerClass, className)}
        >
          <span className="truncate">{day ? format(day, "d MMM yyyy") : placeholder}</span>
          <CalendarDays aria-hidden="true" className="size-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto">
        <Calendar
          mode="single"
          selected={day}
          defaultMonth={day}
          disabled={disabled}
          onSelect={(next) => {
            onChange(next ? format(next, DAY_FORMAT) : "");
            setOpen(false);
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}

/** Every quarter hour of the day, `HH:mm` */
const QUARTER_HOURS: Option[] = Array.from({ length: 96 }, (_, index) => {
  const value = `${String(Math.floor(index / 4)).padStart(2, "0")}:${String((index % 4) * 15).padStart(2, "0")}`;
  return { value, label: value };
});

/**
 * A time of day, `HH:mm`, in quarter hours. A time already saved off the quarter (an older
 * showtime at 18:47) stays in the list, so editing doesn't move it.
 */
export function TimeSelect({
  id,
  value,
  onChange,
  className,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const options =
    value && !QUARTER_HOURS.some((option) => option.value === value)
      ? [...QUARTER_HOURS, { value, label: value }].sort((a, b) => a.value.localeCompare(b.value))
      : QUARTER_HOURS;
  return (
    <OptionSelect
      id={id}
      value={value}
      onChange={onChange}
      options={options}
      placeholder="Choose a time"
      className={className}
    />
  );
}
