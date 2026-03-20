import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type Row,
  type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, Search, ChevronDown, ChevronUp } from 'lucide-react'
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
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const hasRows = table.getRowModel().rows.length > 0

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
                      <TableHead key={header.id} className="px-4">
                        {header.isPlaceholder ? null : canSort ? (
                          <Button
                            className="h-auto px-0 text-slate-600 hover:text-slate-900"
                            onClick={header.column.getToggleSortingHandler()}
                            type="button"
                            variant="secondary"
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getIsSorted() === 'asc' ? (
                              <ArrowUp className="ml-2 h-4 w-4" />
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <ArrowDown className="ml-2 h-4 w-4" />
                            ) : (
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            )}
                          </Button>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
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
    </div>
  )
}
