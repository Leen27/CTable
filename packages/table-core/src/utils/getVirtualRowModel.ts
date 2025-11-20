import { RowModel, Table, RowData, Row } from '../types'
import { getMemoOptions, memo } from '../utils'
import { VirtualState } from '../features/RowVirtual'

export function getVirtualRowModel<TData extends RowData>(): (
  table: Table<TData>,
) => () => RowModel<TData> {
  return (table) => {
    return memo(
      () => [(table.getState() as any).virtual, (table as any).getPreVirtualRowModel()],
      (virtual: VirtualState, rowModel: RowModel<TData>) => {
        if (!virtual.enabled || virtual.viewportHeight === 0) {
          return rowModel
        }

        const { startIndex, endIndex } = virtual
        const visibleRows = rowModel.rows.slice(startIndex, endIndex)
        const flatRows = rowModel.flatRows.slice(startIndex, endIndex)

        // Create filtered rowsById
        const rowsById: Record<string, Row<TData>> = {}
        visibleRows.forEach((row: Row<TData>) => {
          rowsById[row.id] = row
        })

        return {
          rows: visibleRows,
          flatRows,
          rowsById,
        }
      },
      getMemoOptions(table.options, 'debugTable', 'getVirtualRowModel'),
    )
  }
}
