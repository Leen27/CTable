import { EventTypesEnum } from '../core/events'
import {
  OnChangeFn,
  Row,
  RowData,
  RowModel,
  Table,
  TableFeature,
  TableState,
  Updater,
} from '../types'
import { functionalUpdate, getMemoOptions, makeStateUpdater, memo, throttle } from '../utils'
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
  setVirtual(updater: Updater<IVirtualState>): void
  getVirtualRowModel(): RowModel<TData>
  reCalculateVirtualRange(): void
}

export interface ITableVirtualOptions<TData extends RowData> {
  onVirtualStateChange?: OnChangeFn<IVirtualState>
}

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

  getDefaultOptions: <TData extends RowData>(
    table: Table<TData>,
  ): Partial<ITableVirtualOptions<TData>> => {
    return {
      onVirtualStateChange: makeStateUpdater('virtual', table),
    }
  },

  createTable: <TData extends RowData>(table: Table<TData>): void => {
    table.setVirtual = (updater: Updater<IVirtualState>) =>
      table.options.onVirtualStateChange?.(updater)
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
    table.getStartIndex = () => {
      return (table.getState() as any).virtual.startIndex
    }
    table.getEndIndex = () => {
      return (table.getState() as any).virtual.endIndex
    }

    table.reCalculateVirtualRange = () => {
      table.setVirtual((old) => {
        let virtualState = { ...old }
        const renderGrid = table.getState().renderGrid
        if (renderGrid.bodyHeight > 0) {
          const totalRows = table.getRowModel().rows.length

          const { startIndex, endIndex } = table._calculateVirtualRange(
            renderGrid.scrollTop,
            renderGrid.bodyHeight,
            totalRows,
          )
          virtualState = {
            ...virtualState,
            startIndex,
            endIndex,
            virtualRows: endIndex - startIndex + 1,
          }
        }
        return virtualState
      })
    }
  },
}
