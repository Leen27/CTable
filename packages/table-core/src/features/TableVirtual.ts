import { EventTypesEnum } from '../core/events'
import { Row, RowData, RowModel, Table, TableFeature, TableState, Updater } from '../types'
import { functionalUpdate, getMemoOptions, memo } from '../utils'
import { RenderGridState, RenderGridTableState } from './RenderGrid'

export interface IVirtualState {
  overscan: number
  startIndex: number
  endIndex: number
  virtualRows: number
  /** 行高缓存（用于动态行高） */
  rowHeightCache?: Map<string, number>
  /** 累计偏移缓存 */
  offsetCache?: number[]
}

export interface VirtualTableState {
  virtual: IVirtualState
}

export interface VirtualInitialTableState {
  virtual?: Partial<IVirtualState>
}

const defaultVirtualState: IVirtualState = {
  overscan: 5,
  startIndex: 0,
  endIndex: 0,
  virtualRows: 0,
  rowHeightCache: new Map(),
  offsetCache: [],
}

export interface ITableVirtualInstance<TData extends RowData> {
  _calculateVirtualRange: (
    scrollTop: number,
    viewportHeight: number,
    totalRows: number,
  ) => { startIndex: number; endIndex: number }
  recalculateVirtualRows(): void
  getStartIndex(): number
  getEndIndex(): number
  setVirtual(updater: Updater<TableState>): void
  getVirtualRowModel(): RowModel<TData>
}

export interface ITableVirtualOptions<TData extends RowData> {}

export const TableVirtual: TableFeature = {
  getInitialState: (initialState?: VirtualInitialTableState): VirtualTableState => {
    return {
      ...initialState,
      virtual: {
        ...defaultVirtualState,
        ...(initialState?.virtual || {}),
      },
    }
  },

  createTable: <TData extends RowData>(table: Table<TData>): void => {
    table._calculateVirtualRange = (
      scrollTop: number,
      viewportHeight: number,
      totalRows: number,
    ): { startIndex: number; endIndex: number } => {
      if (totalRows === 0 || viewportHeight === 0) {
        return { startIndex: 0, endIndex: 0 }
      }

      const { overscan } = table.getState().virtual
      const rowHeight = table.options.rowHeight || 20

      const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
      const visibleRowCount = Math.ceil(viewportHeight / rowHeight)
      const endIndex = Math.min(totalRows - 1, startIndex + visibleRowCount + overscan * 2)

      return { startIndex, endIndex }
    }
    table.getVirtualRowModel = memo(
      () => [table.getState().renderGrid, table.getState().virtual, table.getRowModel()],
      (renderGrid: RenderGridState, virtual: IVirtualState, rowModel: RowModel<TData>) => {
        console.log('123')
        if (renderGrid.bodyHeight === 0) {
          return {
            rows: [],
            flatRows: [],
            rowsById: {},
          }
        }

        const { startIndex, endIndex } = virtual
        const visibleRows = rowModel.rows.slice(startIndex, endIndex + 1)
        const flatRows = rowModel.flatRows.slice(startIndex, endIndex + 1)

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
    table.setVirtual = (updater: Updater<TableState>) => {
      const safeUpdater: Updater<TableState> = (old: TableState) => {
        let newState = functionalUpdate(updater, old)

        // Calculate virtual indices
        if (newState.renderGrid.bodyHeight > 0) {
          const totalRows = table.getVirtualRowModel().rows.length
          const { startIndex, endIndex } = table._calculateVirtualRange(
            newState.renderGrid.scrollTop,
            newState.renderGrid.bodyHeight,
            totalRows,
          )

          newState = {
            ...newState,
            virtual: {
              ...newState.virtual,
              startIndex,
              endIndex,
              virtualRows: endIndex - startIndex + 1,
            },
          }
        }

        return newState
      }

      ;(table.options as any).onVirtualChange?.(safeUpdater)
    }

    table.getStartIndex = () => {
      return (table.getState() as any).virtual.startIndex
    }
    table.getEndIndex = () => {
      return (table.getState() as any).virtual.endIndex
    }
  },
}
