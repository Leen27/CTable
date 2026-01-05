import {
  OnChangeFn,
  Row,
  RowData,
  RowModel,
  Table,
  TableFeature,
  Updater,
} from '../types'
import {
  debounce,
  getMemoOptions,
  makeStateUpdater,
  memo,
} from '../utils'

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
}

export interface ITableVirtualOptions<TData extends RowData> {
  onVirtualStateChange?: OnChangeFn<IVirtualState>
  initialRect?: Rect
  overscan?: number
  getItemKey?: (index: number) => Key
  initialMeasurementsCache?: Array<IVirtualItem>
  virtualIndexAttribute?: string
  dynamic?: boolean
  rangeExtractor?: (range: Range) => Array<number>
  measureElement?: (
    node: Element,
    entry: ResizeObserverEntry | undefined,
    table: Table<TData>,
  ) => number
}

export interface ITableVirtualInstance<TData extends RowData> {
  calculateRange: () => void
  recalculateVirtualRows(): void
  getStartIndex(): number
  getEndIndex(): number
  setVirtual(updater: Updater<IVirtualState>): void
  getPreVirtualRowModel(): RowModel<TData>
  getVirtualRowModel(): RowModel<TData>
  getVirtualIndexes(): Array<number>
  getVirtualItems(): Array<IVirtualItem>
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
  measureElement(node: Element | null | undefined): void
}

export interface TableVirtualRow {
  getMeasureMent(): IVirtualItem | undefined
}

export interface Range {
  startIndex: number
  endIndex: number
  overscan: number
  count: number
}

export const defaultRangeExtractor = (range: Range) => {
  const start = Math.max(range.startIndex - range.overscan, 0)
  const end = Math.min(range.endIndex + range.overscan, range.count - 1)

  const arr = []

  for (let i = start; i <= end; i++) {
    arr.push(i)
  }

  return arr
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
      dynamic: false,
      overscan: 5,
      initialRect: { width: 0, height: 0 },
      onVirtualStateChange: makeStateUpdater('virtual', table),
      initialMeasurementsCache: [],
      virtualIndexAttribute: 'data-index',
      rangeExtractor: defaultRangeExtractor,
      measureElement: (
        element,
        entry,
        table
      ) => {
        if (!table.options.dynamic) {
          return table.options.rowHeight!
        }

        if (entry?.borderBoxSize) {
          const box = entry.borderBoxSize[0]
          if (box) {
            const size = Math.round(
              box.blockSize,
            )
            return size
          }
        }

        return (element as unknown as HTMLElement).offsetHeight
      },
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

    const observeElementScroll = <T extends Element>(cb: Function) => {
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
          cb(
            {
              scrollLeft: element['scrollLeft'],
              scrollTop: element['scrollTop'],
            },
            false,
          )
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

    // DOM 大小变化回调
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

    // 滚动到指定位置
    // 主要用于元素大小变化导致的滚动条抖动
    const _scrollToOffset = (scrollElement: Element, offset: number) => {
      scrollElement?.scrollTo({
        top: offset,
      })
    }

    const cleanup = () => {
      unsubs.filter(Boolean).forEach((d) => d!())
      unsubs = []
      observer.disconnect()
      measurementsCache = []
      itemSizeCache.clear()
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
        table.calculateRange()
      }
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

    table.setVirtual = (updater: Updater<IVirtualState>) =>
      table.options.onVirtualStateChange?.(updater)

    // 获取所有行的偏移数据
    table.getMeasurements = memo(
      () => [table.getPreVirtualRowModel().rows, itemSizeCache],
      (rows, itemSizeCache) => {
        if (measurementsCache.length === 0) {
          measurementsCache = table.options.initialMeasurementsCache || []
          measurementsCache.forEach((item) => {
            itemSizeCache.set(item.key, item.size)
          })
        }

        const min =
          pendingMeasuredCacheIndexes.length > 0 ? Math.min(...pendingMeasuredCacheIndexes) : 0
        pendingMeasuredCacheIndexes = []

        const measurements = measurementsCache.slice(0, min)

        const count = rows.length
        for (let i = min; i < count; i++) {
          const row = table.getPreVirtualRowModel().rows[i]
          const key = row?.id

          if (!key) continue

          const measurement = measurements[i - 1]

          const start = measurement ? measurement.end : 0

          const measuredSize = itemSizeCache.get(key)
          const size =
            typeof measuredSize === 'number' ? measuredSize : table.options.rowHeight!

          const end = start + size

          measurements[i] = {
            index: i,
            start,
            size,
            end,
            key,
          }
        }

        measurementsCache = measurements

        return measurements
      },
      getMemoOptions(table.options, 'debugRows', 'getMeasurements'),
    )

    // 计算范围
    table.calculateRange = memo(
      () => [
        table.getMeasurements(),
        table.getViewportHeight(),
        table.getState().tableRender.scrollTop,
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

    table.getVirtualIndexes = memo(
      () => {
        table.calculateRange()
        const { startIndex, endIndex } = table.getState().virtual
        return [
          table.options.rangeExtractor,
          table.options.overscan!,
          table.getPreVirtualRowModel().rows.length,
          startIndex,
          endIndex,
        ]
      },
      (rangeExtractor, overscan, count, startIndex, endIndex) => {
        return startIndex === null || endIndex === null
          ? []
          : rangeExtractor!({
              startIndex,
              endIndex,
              overscan,
              count,
            })
      },
      getMemoOptions(table.options, 'debugTable', 'getVirtualIndexes'),
    )

    table.getVirtualItems = memo(
      () => [table.getVirtualIndexes(), table.getMeasurements()],
      (indexes, measurements) => {
        const virtualItems: Array<IVirtualItem> = []

        for (let k = 0, len = indexes.length; k < len; k++) {
          const i = indexes[k]!
          const measurement = measurements[i]!

          virtualItems.push(measurement)
        }

        return virtualItems
      },
      getMemoOptions(table.options, 'debugTable', 'getVirtualItems'),
    )

    table.getPreVirtualRowModel = () => table.getRowModel()
    table.getVirtualRowModel = memo(
      () => [table.getVirtualIndexes(), table.getPreVirtualRowModel()],
      (indexes, rowModel: RowModel<TData>) => {
        const virtualRows: Array<Row<TData>> = []

        for (let k = 0, len = indexes.length; k < len; k++) {
          const i = indexes[k]!
          const row = rowModel.rows[i]!
          virtualRows.push(row)
        }

        // Create filtered rowsById
        const rowsById: Record<string, Row<TData>> = {}
        virtualRows.forEach((row: Row<TData>) => {
          rowsById[row.id] = row
        })

        // !TODO [复用 DOM 元素]
        // 清理不再可见的行
        const currentVisibleIds = new Set(virtualRows.map(r => r.id))
        rowModel.rows.forEach(row => {
          if (!currentVisibleIds.has(row.id) && row.getGui()) {
            // 行不再可见，销毁它
            row.destroy?.()
          }
        })

        return {
          rows: virtualRows,
          flatRows: rowModel.flatRows,
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

    table.measureElement = (node: Element | null | undefined) => {
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

    // 虚拟滚动初始化创建入口
    table.willUpdateVirtual = () => {
      const scrollElement = table.elRefs.tableBody

      cleanup()

      if (!scrollElement) {
        table.calculateRange()
        return
      }

      // 如果之前有缓存
      elementsCache.forEach((cached) => {
        observer.observe(cached)
      })

      // 根据。initialOffset 设置初始滚动位置
      _scrollToOffset(scrollElement, table.options.initialOffset || 0)

      // 监听容器大小
      unsubs.push(
        createViewportResizeObserver(() => {
          table.calculateRange()
        }),
      )

      // 监听容器滚动
      unsubs.push(
        observeElementScroll((offset: any, isScrolling: boolean) => {
          table.setTableRender((old) => ({
            ...old,
            scrollTop: offset.scrollTop || 0,
            scrollLeft: offset.scrollLeft || 0,
          }))
          table.calculateRange()
        }),
      )
    }

    const oldDestroy = table.destroy
    table.destroy = () => {
      cleanup()
      oldDestroy()
    }
  },

  createRow: <TData extends RowData>(
    row: Row<TData>,
    table: Table<TData>
  ): void => {
    row.getMeasureMent = () => table.getMeasurements().find(m => m.key === row.id)
  }
}
