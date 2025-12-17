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

export interface Rect {
  width: number
  height: number
}

type Key = number | string | bigint
export interface IVirtualItem {
  key: Key
  index: number
  start: number
  end: number
  size: number
}
export interface IVirtualState {
  startIndex: number
  endIndex: number
  virtualRows: number
  /** 行高缓存（用于动态行高） */
  rowHeightCache: Map<Key, number>
  /** 累计偏移缓存 */
  offsetCache: number[]
}

export interface VirtualTableState {
  virtual: IVirtualState
}

export interface VirtualInitialTableState {
  virtual?: Partial<IVirtualState>
}

const defaultVirtualState: IVirtualState = {
  startIndex: 0,
  endIndex: 0,
  virtualRows: 0,
  rowHeightCache: new Map(),
  offsetCache: [],
}

export interface ITableVirtualOptions<TData extends RowData> {
  onVirtualStateChange?: OnChangeFn<IVirtualState>
  initialRect?: Rect
  overscan?: number
  horizontal?: boolean
  getItemKey?: (index: number) => Key
  initialMeasurementsCache?: Array<IVirtualItem>
}

export interface ITableVirtualInstance<TData extends RowData> {
  calculateRange: () => void
  recalculateVirtualRows(): void
  getStartIndex(): number
  getEndIndex(): number
  setVirtual(updater: Updater<IVirtualState>): void
  getVirtualRowModel(): RowModel<TData>
  reCalculateVirtualRange(): void
  getMeasurementOptions(): {
    count: number
    paddingStart: number
    scrollMargin: number
    getItemKey: (index: number) => Key
    enabled: boolean
  }
  willUpdateVirtual(): void
  getMeasurements(): Array<IVirtualItem>
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
      overscan: 5,
      horizontal: false,
      initialRect: { width: 0, height: 0 },
      onVirtualStateChange: makeStateUpdater('virtual', table),
      initialMeasurementsCache: [],
    }
  },

  createTable: <TData extends RowData>(table: Table<TData>): void => {
    let scrollRect: Rect
    let measurementsCache: Array<IVirtualItem> = []
    let pendingMeasuredCacheIndexes: Array<number> = []

    table.setVirtual = (updater: Updater<IVirtualState>) =>
      table.options.onVirtualStateChange?.(updater)

    // 获取所有行的偏移数据
    table.getMeasurements = memo(
      () => [table.getState().virtual.rowHeightCache],
      (rowHeightCache) => {
        if (measurementsCache.length === 0) {
          measurementsCache = table.options.initialMeasurementsCache || []
          measurementsCache.forEach((item) => {
            rowHeightCache.set(item.key, item.size)
          })
        }

        const min =
          pendingMeasuredCacheIndexes.length > 0 ? Math.min(...pendingMeasuredCacheIndexes) : 0
        pendingMeasuredCacheIndexes = []

        const measurements = measurementsCache.slice(0, min)

        const count = table.getRowModel().rows.length

        for (let i = min; i < count; i++) {
          const row = table.getRowModel().rows[i]
          const key = row?.id

          if (!key) continue

          const measurement = measurements[i - 1]

          const start = measurement ? measurement.end : 0

          const measuredSize = rowHeightCache.get(key)
          const size =
            typeof measuredSize === 'number' ? measuredSize : row.getRowHeight(true).height

          const end = start + size

          measurements[i] = {
            index: i,
            start,
            size,
            end,
            key,
          }
        }

        return measurements
      },
      getMemoOptions(table.options, 'debugRows', 'getMeasurements'),
    )

    // 计算范围
    table.calculateRange = memo(
      () => [
        table.getMeasurements(),
        table.getViewportHeight(),
        table.getState().renderGrid.scrollTop,
      ],
      (measurements, outerSize, scrollOffset) => {
        table.setVirtual((old) => ({
          ...old,
          ...(measurements.length > 0 && outerSize > 0
            ? _calculateRange({
                measurements,
                outerSize,
                scrollOffset,
              })
            : { startIndex: 0, endIndex: 0 }),
        }))
      },
      getMemoOptions(table.options, 'debugRows', 'calculateRange'),
    )

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
      return table.getState().virtual.startIndex
    }
    table.getEndIndex = () => {
      return table.getState().virtual.endIndex
    }

    // 虚拟滚动初始化创建入口
    table.willUpdateVirtual = () => {
      cleanup()
    }

    const oldDestroy = table.destroy
    table.destroy = () => {
      cleanup()
      oldDestroy()
    }

    const cleanup = () => {
      measurementsCache = []
      table.getState().virtual.rowHeightCache.clear()
    }

    function _calculateRange({
      measurements,
      outerSize,
      scrollOffset,
    }: {
      measurements: Array<IVirtualItem>
      outerSize: number
      scrollOffset: number
    }) {
      const lastIndex = measurements.length - 1
      const getOffset = (index: number) => measurements[index]!.start

      let startIndex = findNearestBinarySearch(0, lastIndex, getOffset, scrollOffset)
      let endIndex = startIndex

      while (endIndex < lastIndex && measurements[endIndex]!.end < scrollOffset + outerSize) {
        endIndex++
      }

      return { startIndex, endIndex }
    }

    const findNearestBinarySearch = (
      low: number,
      high: number,
      getCurrentValue: (i: number) => number,
      value: number,
    ) => {
      while (low <= high) {
        const middle = ((low + high) / 2) | 0
        const currentValue = getCurrentValue(middle)

        if (currentValue < value) {
          low = middle + 1
        } else if (currentValue > value) {
          high = middle - 1
        } else {
          return middle
        }
      }

      if (low > 0) {
        return low - 1
      } else {
        return 0
      }
    }
  },
}
