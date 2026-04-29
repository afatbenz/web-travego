import React, { useMemo, useState } from 'react';
import { Calendar as CalendarIcon, Check, ChevronDown, X } from 'lucide-react';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type FilterOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

export type FilterFieldType = 'text' | 'select' | 'multiselect' | 'date' | 'daterange';

export type FilterField<V extends Record<string, unknown>> =
  | {
      name: keyof V & string;
      type: 'text';
      label: string;
      placeholder?: string;
      className?: string;
      inputClassName?: string;
    }
  | {
      name: keyof V & string;
      type: 'select';
      label: string;
      placeholder?: string;
      options: FilterOption[];
      className?: string;
      triggerClassName?: string;
    }
  | {
      name: keyof V & string;
      type: 'multiselect';
      label: string;
      placeholder?: string;
      options: FilterOption[];
      className?: string;
      triggerClassName?: string;
    }
  | {
      name: keyof V & string;
      type: 'date';
      label: string;
      placeholder?: string;
      className?: string;
      triggerClassName?: string;
      fromYear?: number;
      toYear?: number;
    }
  | {
      name: keyof V & string;
      type: 'daterange';
      label: string;
      placeholder?: string;
      className?: string;
      triggerClassName?: string;
    };

export type QuickFilterChip = {
  label: string;
  active?: boolean;
  onClick: () => void;
};

export type FilterBarProps<V extends Record<string, unknown>> = {
  fields: Array<FilterField<V>>;
  values: V;
  onChange: <K extends keyof V>(name: K, value: V[K]) => void;
  onSubmit?: (values: V) => void;
  onReset?: () => void;
  submitLabel?: string;
  resetLabel?: string;
  chips?: QuickFilterChip[];
  className?: string;
  containerClassName?: string;
};

const formatDate = (d: Date) => format(d, 'dd MMM yyyy');

export function FilterBar<V extends Record<string, unknown>>({
  fields,
  values,
  onChange,
  onSubmit,
  onReset,
  submitLabel = 'Apply',
  resetLabel = 'Reset',
  chips,
  className,
  containerClassName
}: FilterBarProps<V>) {
  const [openField, setOpenField] = useState<string | null>(null);

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(values);
  };

  const hasActions = Boolean(onSubmit || onReset);

  const renderedFields = useMemo(() => fields, [fields]);

  return (
    <Card className={cn('rounded-2xl shadow-sm', containerClassName)}>
      <form onSubmit={onFormSubmit} className={cn('p-4', className)}>
        {chips && chips.length > 0 ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <Button
                key={chip.label}
                type="button"
                variant={chip.active ? 'default' : 'outline'}
                size="sm"
                className="rounded-full"
                onClick={chip.onClick}
              >
                {chip.label}
              </Button>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap items-end gap-3">
          {renderedFields.map((field) => {
            if (field.type === 'text') {
              const v = values[field.name] as unknown;
              const str = typeof v === 'string' ? v : v == null ? '' : String(v);
              return (
                <div key={field.name} className={cn('min-w-[220px] flex-1', field.className)}>
                  <div className="mb-1 text-xs font-medium text-muted-foreground">{field.label}</div>
                  <Input
                    value={str}
                    onChange={(e) => onChange(field.name as keyof V, e.target.value as V[keyof V])}
                    placeholder={field.placeholder}
                    className={cn('h-10', field.inputClassName)}
                  />
                </div>
              );
            }

            if (field.type === 'select') {
              const v = values[field.name];
              const value = typeof v === 'string' ? v : '';
              return (
                <div key={field.name} className={cn('min-w-[200px]', field.className)}>
                  <div className="mb-1 text-xs font-medium text-muted-foreground">{field.label}</div>
                  <Select value={value} onValueChange={(val) => onChange(field.name as keyof V, val as V[keyof V])}>
                    <SelectTrigger className={cn('h-10', field.triggerClassName)}>
                      <SelectValue placeholder={field.placeholder ?? field.label} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            }

            if (field.type === 'multiselect') {
              const v = values[field.name];
              const selected = Array.isArray(v) ? (v.filter((x) => typeof x === 'string') as string[]) : [];
              const selectedSet = new Set(selected);
              const selectedLabels = field.options
                .filter((o) => selectedSet.has(o.value))
                .map((o) => o.label);
              const labelText =
                selectedLabels.length === 0
                  ? ''
                  : selectedLabels.length <= 2
                    ? selectedLabels.join(', ')
                    : `${selectedLabels.length} selected`;

              return (
                <div key={field.name} className={cn('min-w-[240px]', field.className)}>
                  <div className="mb-1 text-xs font-medium text-muted-foreground">{field.label}</div>
                  <Popover
                    open={openField === field.name}
                    onOpenChange={(open) => setOpenField(open ? field.name : null)}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn('h-10 w-full justify-between rounded-lg font-normal', field.triggerClassName)}
                      >
                        <span className={cn('truncate', labelText ? '' : 'text-muted-foreground')}>
                          {labelText || field.placeholder || field.label}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-60" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[320px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder={`Search ${field.label.toLowerCase()}...`} />
                        <CommandList>
                          <CommandEmpty>No results.</CommandEmpty>
                          <CommandGroup>
                            {field.options.map((opt) => {
                              const isSelected = selectedSet.has(opt.value);
                              return (
                                <CommandItem
                                  key={opt.value}
                                  value={`${opt.value} ${opt.label}`}
                                  disabled={opt.disabled}
                                  onSelect={() => {
                                    const next = new Set(selectedSet);
                                    if (isSelected) next.delete(opt.value);
                                    else next.add(opt.value);
                                    onChange(field.name as keyof V, Array.from(next) as unknown as V[keyof V]);
                                  }}
                                  className="flex items-center gap-2"
                                >
                                  <span
                                    className={cn(
                                      'grid h-4 w-4 place-items-center rounded border',
                                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-transparent'
                                    )}
                                  >
                                    {isSelected ? <Check className="h-3 w-3" /> : null}
                                  </span>
                                  <span className="flex-1 truncate">{opt.label}</span>
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                      <div className="flex items-center justify-between gap-2 border-t p-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          onClick={() => onChange(field.name as keyof V, [] as unknown as V[keyof V])}
                          disabled={selected.length === 0}
                        >
                          Clear
                        </Button>
                        <Button type="button" size="sm" className="h-8" onClick={() => setOpenField(null)}>
                          Done
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              );
            }

            if (field.type === 'date') {
              const v = values[field.name];
              const date = v instanceof Date ? v : null;
              const labelText = date ? formatDate(date) : '';
              const fromYear = field.fromYear;
              const toYear = field.toYear;

              return (
                <div key={field.name} className={cn('min-w-[200px]', field.className)}>
                  <div className="mb-1 text-xs font-medium text-muted-foreground">{field.label}</div>
                  <Popover
                    open={openField === field.name}
                    onOpenChange={(open) => setOpenField(open ? field.name : null)}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn('h-10 w-full justify-start rounded-lg font-normal', field.triggerClassName)}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                        <span className={cn('truncate', labelText ? '' : 'text-muted-foreground')}>
                          {labelText || field.placeholder || field.label}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date ?? undefined}
                        onSelect={(d) => {
                          onChange(field.name as keyof V, (d ?? null) as unknown as V[keyof V]);
                          if (d) setOpenField(null);
                        }}
                        initialFocus
                        captionLayout={fromYear || toYear ? 'dropdown' : undefined}
                        fromYear={fromYear}
                        toYear={toYear}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              );
            }

            const v = values[field.name];
            const range = (v && typeof v === 'object' ? (v as DateRange) : undefined) as DateRange | undefined;
            const labelText =
              range?.from && range?.to
                ? `${formatDate(range.from)} - ${formatDate(range.to)}`
                : range?.from
                  ? `${formatDate(range.from)} - ...`
                  : '';

            return (
              <div key={field.name} className={cn('min-w-[260px]', field.className)}>
                <div className="mb-1 text-xs font-medium text-muted-foreground">{field.label}</div>
                <Popover
                  open={openField === field.name}
                  onOpenChange={(open) => setOpenField(open ? field.name : null)}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn('h-10 w-full justify-start rounded-lg font-normal', field.triggerClassName)}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                      <span className={cn('truncate', labelText ? '' : 'text-muted-foreground')}>
                        {labelText || field.placeholder || field.label}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      numberOfMonths={1}
                      selected={range}
                      onSelect={(next) => {
                        onChange(field.name as keyof V, (next ?? undefined) as unknown as V[keyof V]);
                        if (next?.from && next?.to) setOpenField(null);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            );
          })}

          {hasActions ? (
            <div className="ml-auto flex items-center gap-2">
              {onReset ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-lg"
                  onClick={() => {
                    onReset();
                    setOpenField(null);
                  }}
                >
                  <X className="mr-2 h-4 w-4" />
                  {resetLabel}
                </Button>
              ) : null}

              {onSubmit ? (
                <Button type="submit" className="h-10 rounded-lg">
                  {submitLabel}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </form>
    </Card>
  );
}

