import {
  OnChangeFn,
  Table,
  RowModel,
  Updater,
  RowData,
  TableFeature,
  Row,
  InitialTableState,
} from '../types'
import { functionalUpdate, getMemoOptions, makeStateUpdater, memo } from '../utils'

export interface VirtualState {
  enabled: boolean
  rowHeight: number | ((row: Row<any>) => number)
  viewportHeight: number
  scrollTop: number
  overscan: number
  startIndex: number
  endIndex: number
  virtualRows: number
  /** 总行数 */
  totalRows: number
  /** 行高缓存（用于动态行高） */
  rowHeightCache?: Map<string, number>
  /** 累计偏移缓存 */
  offsetCache?: number[]
  /** 性能优化选项 */
  performance?: {
    /** 是否使用 transform 替代 padding */
    useTransform?: boolean
    /** 批量更新阈值 */
    batchUpdateThreshold?: number
    /** 是否启用缓存 */
    enableCache?: boolean
  }
  /** transform 偏移样式 */
  transform?: string
  /** 容器总高度 */
  containerHeight?: number
}

export interface VirtualTableState {
  virtual: VirtualState
}

export interface VirtualInitialTableState {
  virtual?: Partial<VirtualState>
}

export interface VirtualOptions<TData extends RowData = any> {
  /**
   * 启用/禁用虚拟滚动。默认为 `false`。
   */
  enableVirtual?: boolean
  /**
   * 每行的高度（像素），可以是固定值或函数。默认为 `50`。
   */
  rowHeight?: number | ((row: Row<TData>) => number)
  /**
   * 视口高度（像素）。虚拟滚动必需。
   */
  viewportHeight?: number
  /**
   * 在可见视口外渲染的行数。默认为 `5`。
   */
  overscan?: number
  /**
   * 滚动位置改变时的回调函数。
   */
  onVirtualScroll?: (scrollTop: number) => void
  /**
   * 如果提供，当 `state.virtual` 改变时，将使用 `updaterFn` 调用此函数。这将覆盖默认的内部状态管理。
   */
  onVirtualChange?: OnChangeFn<VirtualState>
  /**
   * 自定义函数来计算虚拟行。如果未提供，将使用默认计算。
   */
  getVirtualRowModel?: (table: Table<any>) => () => RowModel<any>
  /**
   * 性能优化选项。
   */
  virtualPerformance?: {
    /**
     * 是否使用 transform 替代 padding 来减少重绘。默认为 `true`。
     */
    useTransform?: boolean
    /**
     * 是否启用行高缓存。默认为 `true`。
     */
    enableCache?: boolean
    /**
     * 批量更新阈值（毫秒）。默认为 `16`（约60fps）。
     */
    batchUpdateThreshold?: number
    /**
     * 最大缓存行数。默认为 `1000`。
     */
    maxCacheSize?: number
  }
}

export interface VirtualDefaultOptions extends VirtualOptions {
  onVirtualChange: OnChangeFn<VirtualState>
  virtualPerformance?: {
    useTransform?: boolean
    enableCache?: boolean
    batchUpdateThreshold?: number
    maxCacheSize?: number
  }
}

export interface VirtualInstance<TData extends RowData> {
  /**
   * Returns the total height of all rows in pixels.
   * @link [API Docs](https://tanstack.com/table/v8/docs/api/features/row-virtual#gettotalheight)
   * @link [Guide](https://tanstack.com/table/v8/docs/guide/row-virtual)
   */
  getTotalHeight: () => number
  /**
   * Returns the virtual row model with only visible rows.
   * @link [API Docs](https://tanstack.com/table/v8/docs/api/features/row-virtual#getvirtualrowmodel)
   * @link [Guide](https://tanstack.com/table/v8/docs/guide/row-virtual)
   */
  getVirtualRowModel: () => RowModel<TData>
  /**
   * Returns the row model before virtual scrolling has been applied.
   * @link [API Docs](https://tanstack.com/table/v8/docs/api/features/row-virtual#getprevirtualrowmodel)
   * @link [Guide](https://tanstack.com/table/v8/docs/guide/row-virtual)
   */
  getPreVirtualRowModel: () => RowModel<TData>
  /**
   * Updates the scroll position.
   * @link [API Docs](https://tanstack.com/table/v8/docs/api/features/row-virtual#setscrolltop)
   * @link [Guide](https://tanstack.com/table/v8/docs/api/features/row-virtual)
   */
  setScrollTop: (scrollTop: number) => void
  /**
   * Resets the virtual state to its initial state. If `defaultState` is `true`, the state will be reset to default values.
   * @link [API Docs](https://tanstack.com/table/v8/docs/api/features/row-virtual#resetvirtual)
   * @link [Guide](https://tanstack.com/table/v8/docs/guide/row-virtual)
   */
  resetVirtual: (defaultState?: boolean) => void
  /**
   * Sets or updates the `state.virtual` state.
   * @link [API Docs](https://tanstack.com/table/v8/docs/api/features/row-virtual#setvirtual)
   * @link [Guide](https://tanstack.com/table/v8/docs/guide/row-virtual)
   */
  setVirtual: (updater: Updater<VirtualState>) => void
  /**
   * Returns the start index of visible rows.
   * @link [API Docs](https://tanstack.com/table/v8/docs/api/features/row-virtual#getstartindex)
   * @link [Guide](https://tanstack.com/table/v8/docs/api/features/row-virtual)
   */
  getStartIndex: () => number
  /**
   * Returns the end index of visible rows.
   * @link [API Docs](https://tanstack.com/table/v8/docs/api/features/row-virtual#getendindex)
   * @link [Guide](https://tanstack.com/table/v8/docs/api/features/row-virtual)
   */
  getEndIndex: () => number
  /**
   * 滚动到指定行。
   */
  scrollToRow: (rowIndex: number) => void
  /**
   * 获取虚拟滚动样式（包含 transform 和容器高度）。
   */
  getVirtualStyle: () => { transform: string; containerHeight: number }
  /**
   * 重新计算虚拟行。
   */
  recalculateVirtualRows: () => void
  /**
   * 获取性能指标。
   */
  getPerformanceMetrics: () => {
    cacheHitRate: number
    totalCalculations: number
    averageCalculationTime: number
  }
  /**
   * 清除缓存。
   */
  clearVirtualCache: () => void
}

export interface VirtualRow<TData extends RowData = any> {
  /**
   * Returns the offset top position of the row in pixels.
   * @link [API Docs](https://tanstack.com/table/v8/docs/api/features/row-virtual#getoffsettop)
   * @link [Guide](https://tanstack.com/table/v8/docs/guide/row-virtual)
   */
  getOffsetTop: () => number
  /**
   * Returns whether the row is in the virtual viewport.
   * @link [API Docs](https://tanstack.com/table/v8/docs/api/features/row-virtual#getisvirtualvisible)
   * @link [Guide](https://tanstack.com/table/v8/docs/guide/row-virtual)
   */
  getIsVirtualVisible: () => boolean
  /**
   * 获取行的估算高度。
   */
  getEstimatedHeight: () => number
}

const defaultVirtualState: VirtualState = {
  enabled: false,
  rowHeight: 50,
  viewportHeight: 0,
  scrollTop: 0,
  overscan: 5,
  startIndex: 0,
  endIndex: 0,
  virtualRows: 0,
  totalRows: 0,
  rowHeightCache: new Map(),
  offsetCache: [],
  performance: {
    useTransform: true,
    enableCache: true,
    batchUpdateThreshold: 16,
    // maxCacheSize: 1000, // 将在后续版本中添加
  },
  transform: '',
  containerHeight: 0,
}

export const RowVirtual: TableFeature = {
  getInitialState: (initialState?: InitialTableState): Partial<VirtualTableState> => {
    const virtualState = (initialState as VirtualInitialTableState)?.virtual
    return {
      virtual: {
        ...defaultVirtualState,
        ...(virtualState || {}),
      },
    }
  },

  getDefaultOptions: <TData extends RowData>(
    table: Table<TData>,
  ): Partial<VirtualOptions<TData>> => {
    return {
      onVirtualChange: makeStateUpdater('virtual', table),
      enableVirtual: false,
      rowHeight: 50,
      overscan: 5,
      virtualPerformance: {
        useTransform: true,
        enableCache: true,
        batchUpdateThreshold: 16,
        maxCacheSize: 1000,
      },
    }
  },

  createTable: <TData extends RowData>(table: Table<TData>): void => {
    let batchUpdateTimer: NodeJS.Timeout | null = null
    let pendingScrollTop = 0
    let isScrolling = false

    // 性能监控指标
    let performanceMetrics = {
      cacheHitCount: 0,
      cacheMissCount: 0,
      totalCalculations: 0,
      totalCalculationTime: 0,
    }

    // 获取行高（支持函数和固定值）- 带缓存优化
    const getRowHeight = (row?: Row<TData>): number => {
      const startTime = performance.now()
      const { rowHeight, rowHeightCache, performance: perf } = table.getState().virtual

      if (typeof rowHeight === 'function' && row) {
        if (perf?.enableCache && rowHeightCache) {
          const cached = rowHeightCache.get(row.id)
          if (cached !== undefined) {
            performanceMetrics.cacheHitCount++
            performanceMetrics.totalCalculationTime += performance.now() - startTime
            return cached
          }

          performanceMetrics.cacheMissCount++
          const height = rowHeight(row)
          if (rowHeightCache.size < 1000) {
            rowHeightCache.set(row.id, height)
          }
          performanceMetrics.totalCalculationTime += performance.now() - startTime
          return height
        }
        const height = rowHeight(row)
        performanceMetrics.totalCalculationTime += performance.now() - startTime
        return height
      }
      const height = typeof rowHeight === 'number' ? rowHeight : 50
      performanceMetrics.totalCalculationTime += performance.now() - startTime
      return height
    }

    // 使用 transform 替代 padding 的优化计算
    const calculateTransformOffset = (
      startIndex: number,
      endIndex: number,
      totalRows: number,
    ): { transform: string; containerHeight: number } => {
      const startTime = performance.now()
      const rowHeight = getRowHeight()

      // 计算容器总高度
      const containerHeight = totalRows * rowHeight

      // 使用 transform 替代 padding，避免重绘
      const transform = `translateY(${startIndex * rowHeight}px)`

      performanceMetrics.totalCalculations++
      performanceMetrics.totalCalculationTime += performance.now() - startTime

      return { transform, containerHeight }
    }

    // 批量更新滚动位置，减少重绘
    const batchSetScrollTop = (scrollTop: number) => {
      pendingScrollTop = scrollTop

      if (!batchUpdateTimer) {
        const { performance } = table.getState().virtual
        const delay = performance?.batchUpdateThreshold || 16

        batchUpdateTimer = setTimeout(() => {
          table.setVirtual((old: VirtualState) => ({ ...old, scrollTop: pendingScrollTop }))
          ;(table.options as any).onVirtualScroll?.(pendingScrollTop)
          batchUpdateTimer = null
          isScrolling = false
        }, delay)
      }
    }

    // 计算虚拟范围
    const calculateVirtualRange = (
      scrollTop: number,
      viewportHeight: number,
      totalRows: number,
    ): { startIndex: number; endIndex: number } => {
      if (totalRows === 0 || viewportHeight === 0) {
        return { startIndex: 0, endIndex: 0 }
      }

      const { overscan } = table.getState().virtual
      const rowHeight = getRowHeight()

      const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
      const visibleRowCount = Math.ceil(viewportHeight / rowHeight)
      const endIndex = Math.min(totalRows - 1, startIndex + visibleRowCount + overscan * 2)

      return { startIndex, endIndex }
    }

    table.setVirtual = (updater: Updater<VirtualState>) => {
      const safeUpdater: Updater<VirtualState> = (old: VirtualState) => {
        let newState = functionalUpdate(updater, old)

        // Calculate virtual indices
        if (newState.enabled && newState.viewportHeight > 0) {
          const totalRows = table.getPreVirtualRowModel().rows.length
          const { startIndex, endIndex } = calculateVirtualRange(
            newState.scrollTop,
            newState.viewportHeight,
            totalRows,
          )

          // 使用 transform 替代 padding
          const { transform, containerHeight } = calculateTransformOffset(
            startIndex,
            endIndex,
            totalRows,
          )

          newState = {
            ...newState,
            startIndex,
            endIndex,
            virtualRows: endIndex - startIndex + 1,
            totalRows,
            transform,
            containerHeight,
          }
        }

        return newState
      }

      return (table.options as any).onVirtualChange?.(safeUpdater)
    }
    table.setScrollTop = (scrollTop: number) => {
      const { performance } = table.getState().virtual

      if (performance?.batchUpdateThreshold && performance.batchUpdateThreshold > 0) {
        if (!isScrolling) {
          isScrolling = true
        }
        batchSetScrollTop(scrollTop)
      } else {
        table.setVirtual((old: VirtualState) => ({ ...old, scrollTop }))
        ;(table.options as any).onVirtualScroll?.(scrollTop)
      }
    }
    table.resetVirtual = (defaultState?: boolean) => {
      table.setVirtual(
        defaultState
          ? defaultVirtualState
          : ((table.initialState as any).virtual ?? defaultVirtualState),
      )
    }
    table.scrollToRow = (rowIndex: number) => {
      const rowHeight = getRowHeight()
      const scrollTop = rowIndex * rowHeight
      table.setScrollTop(scrollTop)
    }
    table.getTotalHeight = () => {
      const { virtual } = table.getState() as any
      if (!virtual.enabled) return 0

      const totalRows = table.getPreVirtualRowModel().rows.length
      const rowHeight = getRowHeight()
      return totalRows * rowHeight
    }
    table.getVirtualStyle = () => {
      const { virtual } = table.getState() as any
      return {
        transform: virtual.transform || 'translateY(0px)',
        containerHeight: virtual.containerHeight || 0,
      }
    }
    table.getPerformanceMetrics = () => {
      const totalCacheOps = performanceMetrics.cacheHitCount + performanceMetrics.cacheMissCount
      const cacheHitRate = totalCacheOps > 0 ? performanceMetrics.cacheHitCount / totalCacheOps : 0
      const avgCalculationTime =
        performanceMetrics.totalCalculations > 0
          ? performanceMetrics.totalCalculationTime / performanceMetrics.totalCalculations
          : 0

      return {
        cacheHitRate,
        totalCalculations: performanceMetrics.totalCalculations,
        averageCalculationTime: avgCalculationTime,
      }
    }

    table.clearVirtualCache = () => {
      const { virtual } = table.getState() as any
      if (virtual.rowHeightCache) {
        virtual.rowHeightCache.clear()
      }
      if (virtual.offsetCache) {
        virtual.offsetCache.length = 0
      }
      // 重置性能指标
      performanceMetrics = {
        cacheHitCount: 0,
        cacheMissCount: 0,
        totalCalculations: 0,
        totalCalculationTime: 0,
      }
    }

    table.recalculateVirtualRows = () => {
      const { virtual } = table.getState() as any
      if (!virtual.enabled) return

      const totalRows = table.getPreVirtualRowModel().rows.length
      const { startIndex, endIndex } = calculateVirtualRange(
        virtual.scrollTop,
        virtual.viewportHeight,
        totalRows,
      )

      // 使用 transform 替代 padding
      const { transform, containerHeight } = calculateTransformOffset(
        startIndex,
        endIndex,
        totalRows,
      )

      table.setVirtual((old: VirtualState) => ({
        ...old,
        startIndex,
        endIndex,
        virtualRows: endIndex - startIndex + 1,
        totalRows,
        transform,
        containerHeight,
      }))
    }
    table.getStartIndex = () => {
      return (table.getState() as any).virtual.startIndex
    }
    table.getEndIndex = () => {
      return (table.getState() as any).virtual.endIndex
    }
    table.getPreVirtualRowModel = () => table.getSortedRowModel()
    table.getVirtualRowModel = memo(
      () => [(table.getState() as any).virtual, table.getPreVirtualRowModel()],
      (virtual: VirtualState, rowModel: RowModel<TData>) => {
        if (!virtual.enabled || virtual.viewportHeight === 0) {
          return rowModel
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
  },

  createRow: <TData extends RowData>(row: Row<TData>, table: Table<TData>): void => {
    row.getOffsetTop = () => {
      const { virtual } = table.getState() as any
      if (!virtual.enabled) return 0

      const rowIndex = table
        .getPreVirtualRowModel()
        .flatRows.findIndex((r: Row<TData>) => r.id === row.id)

      // 性能优化：使用缓存的偏移量计算
      if (
        virtual.performance?.enableCache &&
        virtual.offsetCache &&
        virtual.offsetCache[rowIndex] !== undefined
      ) {
        return virtual.offsetCache[rowIndex]
      }

      // 计算动态偏移（考虑不同行高）- 性能优化版本
      const startTime = performance.now()
      let offset = 0
      const flatRows = table.getPreVirtualRowModel().flatRows

      // 优化：只计算到当前行的偏移，使用缓存的行高
      for (let i = 0; i < rowIndex; i++) {
        const rowHeight =
          typeof virtual.rowHeight === 'function'
            ? virtual.rowHeight(flatRows[i]) // 直接使用函数，避免作用域问题
            : virtual.rowHeight
        offset += rowHeight
      }

      // 缓存计算结果
      if (virtual.performance?.enableCache && virtual.offsetCache) {
        virtual.offsetCache[rowIndex] = offset
      }

      // 注意：performanceMetrics 在 createTable 作用域中，这里无法直接访问
      // 如果需要性能监控，应该通过 table 实例的方法来获取
      return offset
    }
    row.getIsVirtualVisible = () => {
      const { virtual } = table.getState() as any
      if (!virtual.enabled) return true

      const rowIndex = table
        .getPreVirtualRowModel()
        .flatRows.findIndex((r: Row<TData>) => r.id === row.id)
      return rowIndex >= virtual.startIndex && rowIndex <= virtual.endIndex
    }
    row.getEstimatedHeight = () => {
      const { virtual } = table.getState() as any
      if (typeof virtual.rowHeight === 'function') {
        return virtual.rowHeight(row)
      }
      return virtual.rowHeight
    }
  },
}

// 工具函数：计算虚拟滚动范围
export function calculateVirtualRange(
  scrollTop: number,
  containerHeight: number,
  totalRows: number,
  rowHeight: number,
  overscan: number = 5,
): { startIndex: number; endIndex: number } {
  if (totalRows === 0 || containerHeight === 0) {
    return { startIndex: 0, endIndex: 0 }
  }

  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
  const visibleRowCount = Math.ceil(containerHeight / rowHeight)
  const endIndex = Math.min(totalRows - 1, startIndex + visibleRowCount + overscan * 2)

  return { startIndex, endIndex }
}

// 工具函数：获取总滚动高度
export function getTotalScrollHeight(
  totalRows: number,
  rowHeight: number | ((row: Row<any>) => number),
  rows?: Row<any>[],
): number {
  if (totalRows === 0) return 0

  if (typeof rowHeight === 'number') {
    return totalRows * rowHeight
  }

  // 如果是函数，需要计算所有行的高度
  if (rows) {
    return rows.reduce((total, row) => total + rowHeight(row), 0)
  }

  // 如果没有提供行数据，使用平均值估算
  return totalRows * 50 // 默认行高
}

// 工具函数：获取行的偏移位置
export function getRowOffset(
  rowIndex: number,
  rowHeight: number | ((row: Row<any>) => number),
  rows?: Row<any>[],
): number {
  if (rowIndex === 0) return 0

  if (typeof rowHeight === 'number') {
    return rowIndex * rowHeight
  }

  // 如果是函数，需要计算前面所有行的高度
  if (rows && rowIndex < rows.length) {
    let offset = 0
    for (let i = 0; i < rowIndex; i++) {
      const row = rows[i]
      if (row) {
        offset += rowHeight(row)
      }
    }
    return offset
  }

  // 如果没有提供行数据，使用平均值估算
  return rowIndex * 50 // 默认行高
}
