import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from 'lucide-react'
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

  const hasRows = useMemo(() => table.getRowModel().rows.length > 0, [table])

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

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : canSort ? (
                        <Button
                          className="h-auto px-0 text-slate-600 hover:text-slate-900"
                          onClick={header.column.getToggleSortingHandler()}
                          type="button"
                          variant="ghost"
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
  )
}
