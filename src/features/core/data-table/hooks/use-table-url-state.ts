"use client";

import type {
  ColumnFiltersState,
  PaginationState,
  SortingState,
} from "@tanstack/react-table";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Defaults = {
  page?: number;
  perPage?: number;
  /**
   * The order a page opens in — newest first on every list page. Kept out of
   * the URL while it's in effect, so links stay clean.
   */
  sorting?: SortingState;
};

type ResolvedDefaults = Required<Defaults>;

const NO_SORTING: SortingState = [];

type TableUrlState = {
  pagination: PaginationState;
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  globalFilter: string;
};

function safeParseJson<T>(raw: string | null): T | undefined {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

function readState(
  params: URLSearchParams,
  { page, perPage, sorting }: ResolvedDefaults,
): TableUrlState {
  const p = Number(params.get("page") ?? page);
  const pp = Number(params.get("perPage") ?? perPage);

  return {
    pagination: {
      pageIndex: Math.max(0, (Number.isFinite(p) ? p : page) - 1),
      pageSize: Number.isFinite(pp) && pp > 0 ? pp : perPage,
    },
    sorting: safeParseJson<SortingState>(params.get("sort")) ?? sorting,
    columnFilters:
      safeParseJson<ColumnFiltersState>(params.get("filters")) ?? [],
    globalFilter: params.get("q") ?? "",
  };
}

const sameSorting = (a: SortingState, b: SortingState) =>
  a.length === b.length &&
  a.every((sort, i) => sort.id === b[i].id && sort.desc === b[i].desc);

function buildSearchParams(
  state: TableUrlState,
  defaults: ResolvedDefaults,
): string {
  const out = new URLSearchParams();
  if (state.pagination.pageIndex > 0) {
    out.set("page", String(state.pagination.pageIndex + 1));
  }
  if (state.pagination.pageSize !== defaults.perPage) {
    out.set("perPage", String(state.pagination.pageSize));
  }
  // An explicitly cleared sort is written as `[]`, so a reload doesn't put
  // the default back.
  if (!sameSorting(state.sorting, defaults.sorting)) {
    out.set("sort", JSON.stringify(state.sorting));
  }
  if (state.columnFilters.length) {
    out.set("filters", JSON.stringify(state.columnFilters));
  }
  if (state.globalFilter) {
    out.set("q", state.globalFilter);
  }
  const qs = out.toString();
  return qs;
}

/**
 * Bidirectional table state ↔ URL search-params sync.
 *
 * - On mount we hydrate state from the current URL.
 * - On every change we replace the URL (no history pollution).
 * - Updates are debounced (250ms) to avoid one navigation per keystroke.
 */
export function useTableUrlState(defaults: Defaults = {}) {
  // Callers pass the sorting inline, so it's keyed by value, not identity.
  const sortingKey = JSON.stringify(defaults.sorting ?? NO_SORTING);
  const fullDefaults = useMemo<ResolvedDefaults>(
    () => ({
      page: defaults.page ?? 1,
      perPage: defaults.perPage ?? 20,
      sorting: JSON.parse(sortingKey) as SortingState,
    }),
    [defaults.page, defaults.perPage, sortingKey],
  );
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [state, setState] = useState<TableUrlState>(() =>
    readState(
      new URLSearchParams(searchParams?.toString() ?? ""),
      fullDefaults,
    ),
  );

  const lastSerialized = useRef<string>(buildSearchParams(state, fullDefaults));
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const qs = buildSearchParams(state, fullDefaults);
    if (qs === lastSerialized.current) return;
    lastSerialized.current = qs;

    if (timer.current != null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 250);

    return () => {
      if (timer.current != null) window.clearTimeout(timer.current);
    };
  }, [state, fullDefaults, pathname, router]);

  const setPagination = useCallback(
    (updater: PaginationState | ((prev: PaginationState) => PaginationState)) =>
      setState((prev) => ({
        ...prev,
        pagination:
          typeof updater === "function" ? updater(prev.pagination) : updater,
      })),
    [],
  );

  const setSorting = useCallback(
    (updater: SortingState | ((prev: SortingState) => SortingState)) =>
      setState((prev) => ({
        ...prev,
        sorting:
          typeof updater === "function" ? updater(prev.sorting) : updater,
      })),
    [],
  );

  const setColumnFilters = useCallback(
    (
      updater:
        | ColumnFiltersState
        | ((prev: ColumnFiltersState) => ColumnFiltersState),
    ) =>
      setState((prev) => ({
        ...prev,
        columnFilters:
          typeof updater === "function" ? updater(prev.columnFilters) : updater,
      })),
    [],
  );

  const setGlobalFilter = useCallback(
    (updater: string | ((prev: string) => string)) =>
      setState((prev) => ({
        ...prev,
        globalFilter:
          typeof updater === "function" ? updater(prev.globalFilter) : updater,
      })),
    [],
  );

  return {
    ...state,
    setPagination,
    setSorting,
    setColumnFilters,
    setGlobalFilter,
  };
}
