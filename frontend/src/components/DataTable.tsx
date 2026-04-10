import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type Row,
  type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react'
import { Input } from './ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Button } from './ui/button'
import EmptyState from './EmptyState'

type DataTableProps<TData> = {
  data: TData[]
  columns: ColumnDef<TData>[]
  searchPlaceholder?: string
  searchValue?: string
  onSearchValueChange?: (value: string) => void
  emptyTitle: string
  emptyDescription?: string
  pageSize?: number
}

function MobileAccordionRow<TData>({ row }: { row: Row<TData> }) {
  const [expanded, setExpanded] = useState(false)
  const firstCell = row.getVisibleCells()[0]
  const otherCells = row.getVisibleCells().slice(1)

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        className="flex w-full items-center justify-between p-4 text-left font-medium text-slate-900"
        onClick={() => setExpanded(!expanded)}
        type="button"
      >
        <div>{flexRender(firstCell.column.columnDef.cell, firstCell.getContext())}</div>
        {expanded ? (
          <ChevronUp className="h-5 w-5 text-slate-500 shrink-0 ml-2" />
        ) : (
          <ChevronDown className="h-5 w-5 text-slate-500 shrink-0 ml-2" />
        )}
      </button>
      {expanded ? (
        <div className="space-y-3 border-t border-slate-100 p-4">
          {otherCells.map((cell) => {
            const header =
              typeof cell.column.columnDef.header === 'string'
                ? cell.column.columnDef.header
                : cell.column.id
            return (
              <div className="flex flex-col gap-1" key={cell.id}>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {header}
                </span>
                <div className="text-sm text-slate-900">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </div>
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

export default function DataTable<TData>({
  data,
  columns,
  searchPlaceholder,
  searchValue,
  onSearchValueChange,
  emptyTitle,
  emptyDescription,
  pageSize,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const paginationEnabled = typeof pageSize === 'number' && pageSize > 0

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...(paginationEnabled
      ? {
          getPaginationRowModel: getPaginationRowModel(),
          initialState: { pagination: { pageSize } },
        }
      : {}),
  })

  const hasRows = table.getRowModel().rows.length > 0

  const paginationControls = paginationEnabled && table.getPageCount() > 1 && (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
      <p className="text-sm text-slate-600">
        Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        <span className="ml-2 text-slate-400">
          ({data.length} total)
        </span>
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {onSearchValueChange ? (
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            className="pl-9"
            onChange={(event) => onSearchValueChange(event.target.value)}
            placeholder={searchPlaceholder ?? 'Search'}
            value={searchValue ?? ''}
          />
        </div>
      ) : null}

      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white md:block">
        <div className="w-full overflow-x-auto">
          <Table className="min-w-[720px]">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort()
                    return (
                      <TableHead key={header.id} className="h-12 px-4 py-2">
                        {header.isPlaceholder ? null : canSort ? (
                          <Button
                            className="flex h-auto w-full items-center justify-start gap-2 px-0 text-slate-600 hover:text-slate-900"
                            onClick={header.column.getToggleSortingHandler()}
                            type="button"
                            variant="ghost"
                          >
                            <span className="truncate whitespace-nowrap font-semibold uppercase tracking-wider text-xs">
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </span>
                            <div className="flex-shrink-0">
                              {header.column.getIsSorted() === 'asc' ? (
                                <ArrowUp className="h-3.5 w-3.5 text-blue-600" />
                              ) : header.column.getIsSorted() === 'desc' ? (
                                <ArrowDown className="h-3.5 w-3.5 text-blue-600" />
                              ) : (
                                <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600" />
                              )}
                            </div>
                          </Button>
                        ) : (
                          <div className="flex h-auto w-full items-center justify-start py-2">
                            <span className="truncate whitespace-nowrap font-semibold uppercase tracking-wider text-xs text-slate-500">
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </span>
                          </div>
                        )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {hasRows ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell className="py-10" colSpan={columns.length}>
                    <EmptyState description={emptyDescription} title={emptyTitle} />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        {hasRows ? (
          table.getRowModel().rows.map((row) => (
            <MobileAccordionRow key={row.id} row={row} />
          ))
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white py-10">
            <EmptyState description={emptyDescription} title={emptyTitle} />
          </div>
        )}
      </div>

      {paginationControls}
    </div>
  )
}
