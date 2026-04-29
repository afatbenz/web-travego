import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination } from '@/components/common/Pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type DataTableAlign = 'left' | 'center' | 'right';

export type DataTableSortDirection = 'asc' | 'desc';

export type DataTableSort = {
  key: string;
  direction: DataTableSortDirection;
};

export type DataTableAction<T> = {
  key: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
  onSelect: (row: T) => void;
};

export type DataTableColumn<T> = {
  label: string;
  key?: keyof T | string;
  width?: number | string;
  align?: DataTableAlign;
  sortable?: boolean;
  sortKey?: string;
  headerClassName?: string;
  cellClassName?: string;
  render?: (row: T, rowIndex: number) => React.ReactNode;
};

export type DataTablePagination = {
  enabled?: boolean;
  page?: number;
  pageSize?: number;
  totalItems?: number;
  pageSizeOptions?: number[];
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
};

export type DataTableSorting = {
  enabled?: boolean;
  sort?: DataTableSort | null;
  initialSort?: DataTableSort | null;
  onSortChange?: (sort: DataTableSort | null) => void;
};

export type DataTableProps<T> = {
  data: T[];
  columns: DataTableColumn<T>[];
  rowKey?: (row: T, index: number) => string | number;
  loading?: boolean;
  stickyHeader?: boolean;
  zebra?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  actions?: {
    label?: string;
    actions: Array<DataTableAction<T>>;
  };
  defaultRowActions?: {
    onView?: (row: T) => void;
    onEdit?: (row: T) => void;
    onDelete?: (row: T) => void;
  };
  pagination?: DataTablePagination;
  sorting?: DataTableSorting;
  className?: string;
  tableClassName?: string;
};

const toComparableNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'bigint') return Number(value);
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
    const t = Date.parse(value);
    if (Number.isFinite(t)) return t;
  }
  return null;
};

const toComparableString = (value: unknown): string => {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint' || typeof value === 'boolean') return String(value);
  if (value instanceof Date) return value.toISOString();
  return String(value);
};

const getByPath = (obj: unknown, path: string): unknown => {
  if (!path) return undefined;
  const parts = path.split('.').filter(Boolean);
  let cur: unknown = obj;
  for (const part of parts) {
    if (cur && typeof cur === 'object') {
      const rec = cur as Record<string, unknown>;
      cur = rec[part];
      continue;
    }
    return undefined;
  }
  return cur;
};

export function DataTable<T>({
  data,
  columns,
  rowKey,
  loading = false,
  stickyHeader = false,
  zebra = true,
  emptyTitle = 'No data',
  emptyDescription = 'Try adjusting filters or check back later.',
  actions,
  defaultRowActions,
  pagination,
  sorting,
  className,
  tableClassName
}: DataTableProps<T>) {
  const paginationEnabled = pagination?.enabled !== false;
  const sortingEnabled = sorting?.enabled !== false;

  const [internalSort, setInternalSort] = useState<DataTableSort | null>(sorting?.initialSort ?? null);
  const [internalPage, setInternalPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(pagination?.pageSize ?? 10);

  const effectiveSort = sorting?.sort !== undefined ? sorting.sort : internalSort;
  const effectivePage = pagination?.page !== undefined ? pagination.page : internalPage;
  const effectivePageSize = pagination?.pageSize !== undefined ? pagination.pageSize : internalPageSize;

  const pageSizeOptions = pagination?.pageSizeOptions ?? [10, 20, 50, 100];

  const derivedActions = useMemo(() => {
    const definedActions = actions?.actions ?? [];
    if (definedActions.length > 0) return { label: actions?.label ?? 'Actions', actions: definedActions };

    const defaults: Array<DataTableAction<T>> = [];
    if (defaultRowActions?.onView) {
      defaults.push({
        key: 'view',
        label: 'View',
        onSelect: defaultRowActions.onView
      });
    }
    if (defaultRowActions?.onEdit) {
      defaults.push({
        key: 'edit',
        label: 'Edit',
        onSelect: defaultRowActions.onEdit
      });
    }
    if (defaultRowActions?.onDelete) {
      defaults.push({
        key: 'delete',
        label: 'Delete',
        variant: 'destructive',
        onSelect: defaultRowActions.onDelete
      });
    }
    if (defaults.length === 0) return null;
    return { label: 'Actions', actions: defaults };
  }, [actions?.actions, actions?.label, defaultRowActions?.onDelete, defaultRowActions?.onEdit, defaultRowActions?.onView]);

  const normalizedColumns = useMemo(() => {
    const cols = columns.slice();
    if (derivedActions) {
      cols.push({
        label: derivedActions.label,
        key: '__actions__',
        width: 72,
        align: 'right',
        sortable: false
      });
    }
    return cols;
  }, [columns, derivedActions]);

  const sortedData = useMemo(() => {
    if (!sortingEnabled) return data;
    if (!effectiveSort) return data;
    const sortKey = effectiveSort.key;
    const dir = effectiveSort.direction;

    const sorted = data.slice().sort((a, b) => {
      const av = getByPath(a, sortKey);
      const bv = getByPath(b, sortKey);
      const an = toComparableNumber(av);
      const bn = toComparableNumber(bv);
      if (an != null && bn != null) return an - bn;
      const as = toComparableString(av);
      const bs = toComparableString(bv);
      return as.localeCompare(bs, undefined, { numeric: true, sensitivity: 'base' });
    });

    return dir === 'desc' ? sorted.reverse() : sorted;
  }, [data, effectiveSort, sortingEnabled]);

  const totalItems = pagination?.totalItems ?? sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / Math.max(1, effectivePageSize)));

  const pagedData = useMemo(() => {
    if (!paginationEnabled) return sortedData;
    if (pagination?.totalItems !== undefined) return sortedData;
    const start = (Math.max(1, effectivePage) - 1) * effectivePageSize;
    return sortedData.slice(start, start + effectivePageSize);
  }, [effectivePage, effectivePageSize, pagination?.totalItems, paginationEnabled, sortedData]);

  const setSort = (next: DataTableSort | null) => {
    if (sorting?.onSortChange) {
      sorting.onSortChange(next);
      return;
    }
    setInternalSort(next);
  };

  const handleHeaderSortClick = (col: DataTableColumn<T>) => {
    if (!sortingEnabled) return;
    const sortKey = String(col.sortKey ?? col.key ?? '');
    if (!sortKey) return;
    const isSortable = col.sortable !== false;
    if (!isSortable) return;

    const current = effectiveSort?.key === sortKey ? effectiveSort : null;
    if (!current) {
      setSort({ key: sortKey, direction: 'asc' });
      return;
    }
    if (current.direction === 'asc') {
      setSort({ key: sortKey, direction: 'desc' });
      return;
    }
    setSort(null);
  };

  const setPage = (nextPage: number) => {
    const clamped = Math.min(Math.max(1, nextPage), totalPages);
    if (pagination?.onPageChange) {
      pagination.onPageChange(clamped);
      return;
    }
    setInternalPage(clamped);
  };

  const setPageSize = (nextPageSize: number) => {
    if (pagination?.onPageSizeChange) {
      pagination.onPageSizeChange(nextPageSize);
      return;
    }
    setInternalPageSize(nextPageSize);
    setInternalPage(1);
  };

  const getCellAlignClass = (align: DataTableAlign | undefined) => {
    if (align === 'center') return 'text-center';
    if (align === 'right') return 'text-right';
    return 'text-left';
  };

  const renderSortIcon = (col: DataTableColumn<T>) => {
    const sortKey = String(col.sortKey ?? col.key ?? '');
    if (!sortingEnabled) return null;
    if (!sortKey || col.sortable === false) return null;
    if (effectiveSort?.key !== sortKey) return <ArrowUpDown className="h-4 w-4 opacity-60" />;
    return effectiveSort.direction === 'asc' ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  return (
    <Card className={cn('rounded-2xl shadow-sm', className)}>
      <CardContent className="p-0">
        <div className={cn('w-full overflow-hidden rounded-2xl')}>
          <Table className={cn(tableClassName)}>
            <TableHeader
              className={cn(
                stickyHeader ? 'sticky top-0 z-10 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70' : ''
              )}
            >
              <TableRow>
                {normalizedColumns.map((col) => {
                  const key = String(col.key ?? col.label);
                  const isSortable = sortingEnabled && col.sortable !== false && Boolean(col.sortKey ?? col.key);
                  const alignClass = getCellAlignClass(col.align);
                  const style: React.CSSProperties = {};
                  if (col.width !== undefined) style.width = typeof col.width === 'number' ? `${col.width}px` : col.width;

                  return (
                    <TableHead
                      key={key}
                      style={style}
                      className={cn(
                        'px-3 text-xs font-semibold tracking-wide uppercase',
                        alignClass,
                        isSortable ? 'cursor-pointer select-none hover:text-foreground' : '',
                        col.headerClassName
                      )}
                      onClick={() => handleHeaderSortClick(col)}
                      role={isSortable ? 'button' : undefined}
                      aria-sort={
                        isSortable && effectiveSort?.key === String(col.sortKey ?? col.key ?? '')
                          ? effectiveSort.direction === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                    >
                      <div className={cn('flex items-center gap-2', col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : '')}>
                        <span className="truncate">{col.label}</span>
                        {isSortable && <span className="shrink-0">{renderSortIcon(col)}</span>}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={`sk-${i}`} className={cn(zebra ? 'odd:bg-muted/20' : '')}>
                    {normalizedColumns.map((col, j) => (
                      <TableCell key={`sk-${i}-${j}`} className={cn('px-3 py-3')}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : pagedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={normalizedColumns.length} className="px-6 py-12">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="text-sm font-semibold text-foreground">{emptyTitle}</div>
                      <div className="mt-1 max-w-[520px] text-sm text-muted-foreground">{emptyDescription}</div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                pagedData.map((row, rowIndex) => {
                  const key = rowKey ? rowKey(row, rowIndex) : rowIndex;
                  return (
                    <TableRow
                      key={String(key)}
                      className={cn(
                        zebra ? 'odd:bg-muted/20' : '',
                        'hover:bg-muted/50 transition-colors'
                      )}
                    >
                      {normalizedColumns.map((col) => {
                        if (String(col.key ?? '') === '__actions__' && derivedActions) {
                          return (
                            <TableCell key="__actions__" className="px-3 py-2 text-right">
                              <TooltipProvider delayDuration={150}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="min-w-[160px]">
                                        {derivedActions.actions.map((a, idx) => {
                                          const Icon = a.icon;
                                          const itemNode = (
                                            <DropdownMenuItem
                                              key={a.key}
                                              disabled={a.disabled}
                                              onSelect={(e) => {
                                                e.preventDefault();
                                                a.onSelect(row);
                                              }}
                                              className={cn(
                                                'flex items-center gap-2',
                                                a.variant === 'destructive' ? 'text-red-600 focus:text-red-600' : ''
                                              )}
                                            >
                                              {Icon ? <Icon className="h-4 w-4" /> : null}
                                              <span>{a.label}</span>
                                            </DropdownMenuItem>
                                          );

                                          if (idx === 0) return itemNode;
                                          return (
                                            <React.Fragment key={a.key}>
                                              {a.variant === 'destructive' ? <DropdownMenuSeparator /> : null}
                                              {itemNode}
                                            </React.Fragment>
                                          );
                                        })}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TooltipTrigger>
                                  <TooltipContent>Actions</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                          );
                        }

                        const alignClass = getCellAlignClass(col.align);
                        const style: React.CSSProperties = {};
                        if (col.width !== undefined) style.width = typeof col.width === 'number' ? `${col.width}px` : col.width;

                        const value =
                          col.render ? col.render(row, rowIndex) : col.key ? (getByPath(row, String(col.key)) as unknown) : undefined;

                        return (
                          <TableCell
                            key={String(col.key ?? col.label)}
                            style={style}
                            className={cn('px-3 py-2', alignClass, col.cellClassName)}
                          >
                            {React.isValidElement(value) || typeof value !== 'object' ? (value as React.ReactNode) : toComparableString(value)}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {paginationEnabled ? (
          <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Rows</span>
              <Select value={String(effectivePageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                <SelectTrigger className="h-9 w-[92px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="hidden sm:inline">
                Page {Math.min(Math.max(1, effectivePage), totalPages)} of {totalPages}
              </span>
            </div>

            <Pagination currentPage={Math.min(Math.max(1, effectivePage), totalPages)} totalPages={totalPages} onPageChange={setPage} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

