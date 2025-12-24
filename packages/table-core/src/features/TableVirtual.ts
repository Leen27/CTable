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
import { debounce, functionalUpdate, getMemoOptions, makeStateUpdater, memo, throttle } from '../utils'
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
  isScrolling: boolean
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
  isScrolling: false,
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
  getItemKey?: (index: number) => Key
  initialMeasurementsCache?: Array<IVirtualItem>
  virtualIndexAttribute?: string
  measureElement?: (node: Element, entry: ResizeObserverEntry | undefined, table: Table<TData>) => number
}

export interface ITableVirtualInstance<TData extends RowData> {
  calculateRange: () => void
  recalculateVirtualRows(): void
  getStartIndex(): number
  getEndIndex(): number
  setVirtual(updater: Updater<IVirtualState>): void
  getVirtualRowModel(): RowModel<TData>
  getMeasurementOptions(): {
    count: number
    paddingStart: number
    scrollMargin: number
    getItemKey: (index: number) => Key
    enabled: boolean
  }
  willUpdateVirtual(): void
  getMeasurements(): Array<IVirtualItem>
  getVirtualViewportScrolling(): boolean
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
      initialRect: { width: 0, height: 0 },
      onVirtualStateChange: makeStateUpdater('virtual', table),
      initialMeasurementsCache: [],
      virtualIndexAttribute: 'data-index',
      measureElement: () => table.options.rowHeight!
    }
  },

  createTable: <TData extends RowData>(table: Table<TData>): void => {
    let scrollRect: Rect
    let measurementsCache: Array<IVirtualItem> = []
    let pendingMeasuredCacheIndexes: Array<number> = []
    let unsubs: Array<void | (() => void)> = []
    let elementsCache = new Map<Key, Element>()
    let itemSizeCache = new Map<Key, number>()

    const createResizeObserver = (fn: Function) => {
      let _ro: ResizeObserver | null = null

      const get = () => {
        if (_ro) {
          return _ro
        }

        if (!window || !window.ResizeObserver) {
          return null
        }

        return (_ro = new window.ResizeObserver((entries) => {
          entries.forEach((entry) => {
            const run = () => {
              fn(entry.target as Element, entry)
            }
            requestAnimationFrame(run)
          })
        }))
      }

      return {
        disconnect: () => {
          get()?.disconnect()
          _ro = null
        },
        observe: (target: Element) => get()?.observe(target, { box: 'border-box' }),
        unobserve: (target: Element) => get()?.unobserve(target),
      }
    }

    const observeElementScroll = <T extends Element>(
      cb: Function,
    ) => {
      debugger
      const element = table.elRefs.tableBody
      if (!element) {
        return
      }

      const addEventListenerOptions = {
        passive: true,
      }

      const handler = debounce(
        window,
        () => {
          cb({
            scrollLeft: element['scrollLeft'],
            scrollTop: element['scrollTop']
          }, false)
        },
        30,
      )
      
      element.addEventListener('scroll', handler, addEventListenerOptions)

      return () => {
        element.removeEventListener('scroll', handler)
      }
    }

    const createViewportResizeObserver = (cb?: Function) => {
      const element = table.elRefs.tableBody
      if (!element) return

      // 监听容器大小变化
      const viewportResizeObserver = new window.ResizeObserver((entries) => {
          entries.forEach((entry) => {
            const run = () => {
              table.updateTableContainerSizeState()
              table.updateTableContainerScrollState()
              cb?.()
            }
            requestAnimationFrame(run)
          })
      })

      viewportResizeObserver.observe(element)

      return () => viewportResizeObserver.unobserve(element)
    }

    // 内部测量处理
    const _measureElement = (node: Element, entry: ResizeObserverEntry | undefined) => {
      const index = indexFromElement(node)
      const item = measurementsCache[index]
      if (!item) {
        return
      }
      const key = item.key
      const prevNode = elementsCache.get(key)

      if (prevNode !== node) {
        if (prevNode) {
          observer.unobserve(prevNode)
        }
        observer.observe(node)
        elementsCache.set(key, node)
      }

      if (node.isConnected) {
        resizeItem(index, table.options.measureElement!(node, entry, table))
      }
    }

    const observer = createResizeObserver(_measureElement)

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
    table.getVirtualViewportScrolling = () => {
      return table.getState().virtual.isScrolling
    }

    // 虚拟滚动初始化创建入口
    table.willUpdateVirtual = () => {
      const scrollElement = table.elRefs.tableBody

      cleanup()

      if (!scrollElement) {
        table.calculateRange()
        return
      }

      elementsCache.forEach((cached) => {
        observer.observe(cached)
      })

      // 根据。initialOffset 设置初始滚动位置
      _scrollToOffset(scrollElement, table.options.initialOffset || 0)

      // 监听容器大小
      unsubs.push(
        createViewportResizeObserver(() => {
          table.calculateRange()
        })
      )
      
      // 监听容器滚动
      unsubs.push(
        observeElementScroll((offset: any, isScrolling: boolean) => {
          table.setRenderGrid(old => ({
            ...old,
            scrollTop: offset.scrollTop || 0,
            scrollLeft: offset.scrollLeft || 0,
          }))
          table.calculateRange()
        })
      )
    }

    const _scrollToOffset = (scrollElement: Element, offset: number) => {
      scrollElement?.scrollTo({
        top: offset,
      })
    }

    const oldDestroy = table.destroy
    const cleanup = () => {
      unsubs.filter(Boolean).forEach((d) => d!())
      unsubs = []
      observer.disconnect()
      measurementsCache = []
      table.getState().virtual.rowHeightCache.clear()
    }

    table.destroy = () => {
      cleanup()
      oldDestroy()
    }

    const resizeItem = (index: number, size: number) => {
      const item = measurementsCache[index]
      if (!item) {
        return
      }
      const itemSize = itemSizeCache.get(item.key) ?? item.size
      const delta = size - itemSize

      if (delta !== 0) {
        // if (
        //   shouldAdjustScrollPositionOnItemSizeChange !== undefined
        //     ? shouldAdjustScrollPositionOnItemSizeChange(item, delta, this)
        //     : item.start < getScrollOffset() + scrollAdjustments
        // ) {
        //   if (process.env.NODE_ENV !== 'production' && options.debug) {
        //     console.info('correction', delta)
        //   }

        //   _scrollToOffset(getScrollOffset(), {
        //     adjustments: (scrollAdjustments += delta),
        //     behavior: undefined,
        //   })
        // }

        pendingMeasuredCacheIndexes.push(item.index)
        itemSizeCache = new Map(itemSizeCache.set(item.key, size))

        // notify(false)
      }
    }
    const measureElement = (node: Element | null | undefined) => {
      if (!node) {
        elementsCache.forEach((cached, key) => {
          if (!cached.isConnected) {
            observer.unobserve(cached)
            elementsCache.delete(key)
          }
        })
        return
      }

      _measureElement(node, undefined)
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

    const indexFromElement = (node: Element) => {
      const attributeName = table.options.virtualIndexAttribute!
      const indexStr = node.getAttribute(attributeName)

      if (!indexStr) {
        console.warn(`Missing attribute name '${attributeName}={index}' on measured element.`)
        return -1
      }

      return parseInt(indexStr, 10)
    }
  },
}
