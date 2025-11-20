import {
  Table,
  Row,
  Column,
  TableFeature,
  InitialTableState,
  TableState,
  TableOptionsResolved,
  RowData,
  OnChangeFn,
  Updater,
} from '../types'
import { functionalUpdate, makeStateUpdater } from '../utils'

export interface DomRenderingState {
  /** 是否启用 DOM 渲染 */
  enabled: boolean
  /** 可见行范围 */
  visibleRange: { startIndex: number; endIndex: number }
  /** 渲染行缓冲区大小 */
  bufferSize: number
  /** 是否使用虚拟滚动 */
  virtualScrolling: boolean
  /** DOM 容器引用 */
  containerRef?: HTMLElement | null
  /** 行高（像素） */
  rowHeight: number
  /** 容器高度（像素） */
  containerHeight: number
  /** 滚动位置 */
  scrollTop: number
  /** 渲染的行元素映射 */
  renderedRows: Map<number, HTMLElement>
  /** 渲染的单元格元素映射 */
  renderedCells: Map<string, HTMLElement>
}

export interface DomRenderingTableState {
  domRendering: DomRenderingState
}

export interface DomRenderingInitialTableState {
  domRendering?: Partial<DomRenderingState>
}

export interface DomRenderingOptions<TData extends RowData = any> {
  /** 是否启用 DOM 渲染 */
  enableDomRendering?: boolean
  /** 行高（像素） */
  rowHeight?: number
  /** 渲染缓冲区大小 */
  bufferSize?: number
  /** 是否启用虚拟滚动 */
  enableVirtualScrolling?: boolean
  /** 容器引用 */
  containerRef?: HTMLElement | null
  /** 自定义行渲染器 */
  renderRow?: (props: RowRenderProps<TData>) => HTMLElement
  /** 自定义单元格渲染器 */
  renderCell?: (props: CellRenderProps<TData>) => HTMLElement
  /** 行样式回调 */
  getRowStyles?: (row: Row<TData>) => Record<string, string> | undefined
  /** 行类名回调 */
  getRowClassNames?: (row: Row<TData>) => string[]
  /** 单元格样式回调 */
  getCellStyles?: (cell: CellContext<TData>) => Record<string, string> | undefined
  /** 单元格类名回调 */
  getCellClassNames?: (cell: CellContext<TData>) => string[]
  /** DOM 渲染状态改变时的回调 */
  onDomRenderingChange?: OnChangeFn<DomRenderingState>
}

export interface DomRenderingDefaultOptions extends DomRenderingOptions {
  onDomRenderingChange: OnChangeFn<DomRenderingState>
}

export interface RowRenderProps<TData> {
  row: Row<TData>
  index: number
  table: Table<TData>
  cells: CellRenderProps<TData>[]
  styles?: Record<string, string>
  classNames?: string[]
}

export interface CellRenderProps<TData> {
  cell: CellContext<TData>
  column: Column<TData, any>
  row: Row<TData>
  value: any
  styles?: Record<string, string>
  classNames?: string[]
}

export interface CellContext<TData> {
  row: Row<TData>
  column: Column<TData, any>
  value: any
  getValue: () => any
  setValue: (value: any) => void
}

export interface DomRenderingInstance<TData extends RowData> {
  /** 获取可见行 */
  getVisibleRows: () => Row<TData>[]
  /** 获取渲染行 */
  getRenderedRows: () => Row<TData>[]
  /** 刷新行 */
  refreshRow: (rowIndex: number) => void
  /** 刷新单元格 */
  refreshCell: (rowIndex: number, columnId: string) => void
  /** 滚动到行 */
  scrollToRow: (rowIndex: number) => void
  /** 获取 DOM 元素 */
  getRowElement: (rowIndex: number) => HTMLElement | null
  /** 获取单元格 DOM 元素 */
  getCellElement: (rowIndex: number, columnId: string) => HTMLElement | null
  /** 设置 DOM 渲染状态 */
  setDomRendering: (updater: Updater<DomRenderingState>) => void
  /** 重置 DOM 渲染状态 */
  resetDomRendering: (defaultState?: boolean) => void
}

export interface DomRenderingRow {
  _domRendering?: {
    /** DOM 元素引用 */
    element?: HTMLElement | null
    /** 单元格元素映射 */
    cellElements?: Map<string, HTMLElement>
    /** 是否已渲染 */
    rendered?: boolean
    /** 渲染时间戳 */
    renderTimestamp?: number
  }
}

const defaultDomRenderingState: DomRenderingState = {
  enabled: false,
  visibleRange: { startIndex: 0, endIndex: 0 },
  bufferSize: 10,
  virtualScrolling: true,
  rowHeight: 40,
  containerHeight: 0,
  scrollTop: 0,
  renderedRows: new Map(),
  renderedCells: new Map(),
}

export const DomRendering: TableFeature = {
  getInitialState: (initialState?: InitialTableState): Partial<DomRenderingTableState> => {
    const domRenderingState = (initialState as DomRenderingInitialTableState)?.domRendering
    return {
      domRendering: {
        ...defaultDomRenderingState,
        ...(domRenderingState || {}),
      },
    }
  },

  getDefaultOptions: <TData extends RowData>(
    table: Table<TData>,
  ): Partial<DomRenderingOptions<TData>> => {
    return {
      onDomRenderingChange: makeStateUpdater('domRendering', table),
      enableDomRendering: false,
      rowHeight: 40,
      bufferSize: 10,
      enableVirtualScrolling: true,
    }
  },

  createTable: <TData extends RowData>(table: Table<TData>): void => {
    let containerRef: HTMLElement | null = null
    let intersectionObserver: IntersectionObserver | null = null
    let resizeObserver: ResizeObserver | null = null
    let scrollHandler: (() => void) | null = null

    // 默认渲染函数
    const defaultRenderRow = (props: RowRenderProps<TData>): HTMLElement => {
      const rowElement = document.createElement('div')
      rowElement.className = 'ts-table-row'
      rowElement.setAttribute('data-row-index', props.index.toString())
      rowElement.setAttribute('data-row-id', props.row.id)

      // 应用样式
      if (props.styles) {
        Object.entries(props.styles).forEach(([key, value]) => {
          rowElement.style[key as any] = value
        })
      }

      // 应用类名
      if (props.classNames) {
        rowElement.classList.add(...props.classNames)
      }

      // 设置行高和位置
      const state = (table.getState() as any).domRendering
      rowElement.style.height = `${state.rowHeight}px`
      rowElement.style.position = 'absolute'
      rowElement.style.top = `${props.index * state.rowHeight}px`

      // 渲染单元格
      props.cells.forEach((cellProps) => {
        const cellElement = table.options.renderCell?.(cellProps) || defaultRenderCell(cellProps)
        rowElement.appendChild(cellElement)
      })

      return rowElement
    }

    const defaultRenderCell = (props: CellRenderProps<TData>): HTMLElement => {
      const cellElement = document.createElement('div')
      cellElement.className = 'ts-table-cell'
      cellElement.setAttribute('data-column-id', props.column.id)
      cellElement.setAttribute('data-row-index', props.row.index.toString())

      // 应用样式
      if (props.styles) {
        Object.entries(props.styles).forEach(([key, value]) => {
          cellElement.style[key as any] = value
        })
      }

      // 应用类名
      if (props.classNames) {
        cellElement.classList.add(...props.classNames)
      }

      // 设置内容
      const value = props.value ?? ''
      cellElement.textContent = String(value)

      return cellElement
    }

    // 计算可见行范围
    const calculateVisibleRange = (): { startIndex: number; endIndex: number } => {
      const state = (table.getState() as any).domRendering
      const { scrollTop, containerHeight, rowHeight, bufferSize } = state

      const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - bufferSize)
      const endIndex = Math.min(
        table.getRowModel().rows.length - 1,
        Math.ceil((scrollTop + containerHeight) / rowHeight) + bufferSize,
      )

      return { startIndex, endIndex }
    }

    // 更新可见行
    const updateVisibleRows = () => {
      const range = calculateVisibleRange()
      table.setDomRendering((old: DomRenderingState) => ({
        ...old,
        visibleRange: range,
      }))
    }

    // 渲染行
    const renderRow = (row: Row<TData>, index: number) => {
      const rowDom = row as DomRenderingRow
      const columns = table.getAllColumns()

      // 创建单元格渲染属性
      const cells: CellRenderProps<TData>[] = columns.map((column) => {
        const cellContext: CellContext<TData> = {
          row,
          column,
          value: row.getValue(column.id),
          getValue: () => row.getValue(column.id),
          setValue: (value: any) => {
            // 这里需要触发数据更新，但 TanStack Table 没有直接的 onRowDataUpdate
            // 需要通过其他方式更新数据
            console.log('Cell value update requested:', column.id, value)
          },
        }

        const cellStyles = table.options.getCellStyles?.(cellContext)
        const cellClassNames = table.options.getCellClassNames?.(cellContext)

        return {
          cell: cellContext,
          column,
          row,
          value: cellContext.value,
          styles: cellStyles,
          classNames: cellClassNames,
        }
      })

      // 创建行渲染属性
      const rowStyles = table.options.getRowStyles?.(row)
      const rowClassNames = table.options.getRowClassNames?.(row)

      const rowProps: RowRenderProps<TData> = {
        row,
        index,
        table,
        cells,
        styles: rowStyles,
        classNames: rowClassNames,
      }

      // 渲染行元素
      const rowElement = table.options.renderRow?.(rowProps) || defaultRenderRow(rowProps)

      // 存储引用
      const cellElements = new Map(
        cells.map((cell, cellIndex) => [
          columns[cellIndex].id,
          rowElement.children[cellIndex] as HTMLElement,
        ]),
      )

      rowDom._domRendering = {
        element: rowElement,
        cellElements,
        rendered: true,
        renderTimestamp: Date.now(),
      }

      // 更新状态中的渲染映射
      table.setDomRendering((old: DomRenderingState) => ({
        ...old,
        renderedRows: new Map(old.renderedRows).set(index, rowElement),
        renderedCells: new Map([
          ...old.renderedCells,
          ...Array.from(cellElements.entries()).map(([columnId, element]) => [
            `${index}-${columnId}`,
            element,
          ]),
        ]),
      }))

      return rowElement
    }

    // 清理行
    const cleanupRow = (index: number) => {
      const rowElement = (table.getState() as any).domRendering.renderedRows.get(index)
      if (rowElement) {
        rowElement.remove()

        table.setDomRendering((old: DomRenderingState) => {
          const newRenderedRows = new Map(old.renderedRows)
          const newRenderedCells = new Map(old.renderedCells)

          newRenderedRows.delete(index)

          // 清理相关的单元格
          old.renderedCells.forEach((element, key) => {
            if (key.startsWith(`${index}-`)) {
              newRenderedCells.delete(key)
            }
          })

          return {
            ...old,
            renderedRows: newRenderedRows,
            renderedCells: newRenderedCells,
          }
        })
      }

      const row = table.getRowModel().rows[index]
      if (row) {
        const rowDom = row as DomRenderingRow
        if (rowDom._domRendering) {
          rowDom._domRendering.rendered = false
          rowDom._domRendering.element = null
          rowDom._domRendering.cellElements?.clear()
        }
      }
    }

    // 更新渲染
    const updateRendering = () => {
      if (!containerRef || !(table.getState() as any).domRendering.enabled) return

      const state = (table.getState() as any).domRendering
      const { visibleRange, virtualScrolling } = state

      if (virtualScrolling) {
        // 虚拟滚动模式 - 只渲染可见行
        const rowsToRender = table
          .getRowModel()
          .rows.slice(visibleRange.startIndex, visibleRange.endIndex + 1)

        // 清理不再可见的行
        const visibleIndices = new Set(
          Array.from(
            { length: visibleRange.endIndex - visibleRange.startIndex + 1 },
            (_, i) => visibleRange.startIndex + i,
          ),
        )

        const currentRenderedRows = Array.from(state.renderedRows.keys())
        currentRenderedRows.forEach((index) => {
          if (!visibleIndices.has(index)) {
            cleanupRow(index)
          }
        })

        // 渲染新可见的行
        rowsToRender.forEach((row, offsetIndex) => {
          const actualIndex = visibleRange.startIndex + offsetIndex
          if (!state.renderedRows.has(actualIndex)) {
            const rowElement = renderRow(row, actualIndex)
            containerRef!.appendChild(rowElement)
          }
        })

        // 更新容器高度
        const totalHeight = table.getRowModel().rows.length * state.rowHeight
        containerRef!.style.height = `${totalHeight}px`
      } else {
        // 全量渲染模式
        table.getRowModel().rows.forEach((row, index) => {
          if (!state.renderedRows.has(index)) {
            const rowElement = renderRow(row, index)
            containerRef!.appendChild(rowElement)
          }
        })
      }
    }

    // 初始化容器
    const initContainer = () => {
      if (!containerRef) return

      // 设置容器样式
      containerRef.style.position = 'relative'
      containerRef.style.overflow = 'auto'

      // 监听滚动事件
      scrollHandler = () => {
        const scrollTop = containerRef!.scrollTop
        table.setScrollTop(scrollTop)
      }
      containerRef.addEventListener('scroll', scrollHandler)

      // 使用 Intersection Observer 优化性能
      if (typeof IntersectionObserver !== 'undefined') {
        intersectionObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                const rowIndex = parseInt(entry.target.getAttribute('data-row-index') || '0')
                // 可以在这里触发懒加载或其他优化
              }
            })
          },
          { root: containerRef, threshold: 0.1 },
        )
      }

      // 监听容器大小变化
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          updateContainerHeight()
          updateVisibleRows()
          updateRendering()
        })
        resizeObserver.observe(containerRef)
      }

      updateContainerHeight()
    }

    // 更新容器高度
    const updateContainerHeight = () => {
      if (!containerRef) return

      const height = containerRef.clientHeight
      table.setDomRendering((old: DomRenderingState) => ({
        ...old,
        containerHeight: height,
      }))
    }

    // 设置滚动位置
    table.setScrollTop = (scrollTop: number) => {
      table.setDomRendering((old: DomRenderingState) => ({ ...old, scrollTop }))
      ;(table.options as any).onVirtualScroll?.(scrollTop)
      updateVisibleRows()
      updateRendering()
    }

    // 初始化 DOM 渲染
    table.setDomRendering = (updater: Updater<DomRenderingState>) => {
      const safeUpdater: Updater<DomRenderingState> = (old: DomRenderingState) => {
        let newState = functionalUpdate(updater, old)

        // 如果启用了虚拟滚动，重新计算可见范围
        if (newState.enabled && newState.virtualScrolling) {
          const range = calculateVisibleRange()
          newState = {
            ...newState,
            visibleRange: range,
          }
        }

        return newState
      }

      return (table.options as any).onDomRenderingChange?.(safeUpdater)
    }

    table.resetDomRendering = (defaultState?: boolean) => {
      table.setDomRendering(
        defaultState
          ? defaultDomRenderingState
          : ((table.initialState as any).domRendering ?? defaultDomRenderingState),
      )
    }

    // 刷新行
    table.refreshRow = (rowIndex: number) => {
      const row = table.getRowModel().rows[rowIndex]
      if (row && (table.getState() as any).domRendering.renderedRows.has(rowIndex)) {
        cleanupRow(rowIndex)
        const newElement = renderRow(row, rowIndex)
        containerRef?.appendChild(newElement)
      }
    }

    // 刷新单元格
    table.refreshCell = (rowIndex: number, columnId: string) => {
      const cellKey = `${rowIndex}-${columnId}`
      const cellElement = (table.getState() as any).domRendering.renderedCells.get(cellKey)
      const row = table.getRowModel().rows[rowIndex]
      const column = table.getColumn(columnId)

      if (cellElement && row && column) {
        const value = row.getValue(columnId)
        cellElement.textContent = String(value ?? '')
      }
    }

    // 滚动到行
    table.scrollToRow = (rowIndex: number) => {
      if (!containerRef) return

      const state = (table.getState() as any).domRendering
      const targetScrollTop = rowIndex * state.rowHeight

      containerRef.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth',
      })
    }

    // 获取 DOM 元素
    table.getRowElement = (rowIndex: number) => {
      return (table.getState() as any).domRendering.renderedRows.get(rowIndex) || null
    }

    // 获取单元格 DOM 元素
    table.getCellElement = (rowIndex: number, columnId: string) => {
      const cellKey = `${rowIndex}-${columnId}`
      return (table.getState() as any).domRendering.renderedCells.get(cellKey) || null
    }

    // 获取可见行
    table.getVisibleRows = () => {
      const { visibleRange } = (table.getState() as any).domRendering
      return table.getRowModel().rows.slice(visibleRange.startIndex, visibleRange.endIndex + 1)
    }

    // 获取渲染行
    table.getRenderedRows = () => {
      const renderedRows = (table.getState() as any).domRendering.renderedRows
      return Array.from(renderedRows.keys())
        .map((index) => table.getRowModel().rows[index])
        .filter(Boolean) as Row<TData>[]
    }

    // 清理函数
    const cleanup = () => {
      if (containerRef && scrollHandler) {
        containerRef.removeEventListener('scroll', scrollHandler)
      }

      if (intersectionObserver) {
        intersectionObserver.disconnect()
      }

      if (resizeObserver) {
        resizeObserver.disconnect()
      }

      // 清理所有渲染的元素
      const state = (table.getState() as any).domRendering
      state.renderedRows.forEach((element: HTMLElement) => element.remove())
    }

    // 初始化
    const init = () => {
      containerRef = (table.options as any).containerRef

      if (containerRef && (table.getState() as any).domRendering.enabled) {
        initContainer()
        updateVisibleRows()
        updateRendering()
      }
    }

    // 监听状态变化
    const originalSetState = table.setState
    table.setState = (updater: any) => {
      const result = originalSetState(updater)
      const state = table.getState() as any

      if (state.domRendering?.enabled && containerRef) {
        updateRendering()
      }

      return result
    }

    // 初始化
    init()

    // 添加清理函数到表格销毁
    const originalDestroy = table.destroy
    table.destroy = () => {
      cleanup()
      if (originalDestroy) {
        originalDestroy.call(table)
      }
    }
  },

  createRow: <TData extends RowData>(row: Row<TData>, table: Table<TData>): void => {
    // 为行添加 DOM 渲染相关的方法
    row.getIsDomRendered = () => {
      const state = (table.getState() as any).domRendering
      return state?.renderedRows?.has(row.index) || false
    }

    row.getDomElement = () => {
      const state = (table.getState() as any).domRendering
      return state?.renderedRows?.get(row.index) || null
    }

    row.refreshDom = () => {
      if (table.refreshRow) {
        table.refreshRow(row.index)
      }
    }
  },
}
