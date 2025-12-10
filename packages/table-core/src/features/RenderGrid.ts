import { EventTypesEnum } from '../core/events'
import {
  InitialTableState,
  OnChangeFn,
  Row,
  RowData,
  Table,
  TableFeature,
  TableState,
  Updater,
} from '../types'
import { makeStateUpdater, throttle } from '../utils'
import {
  createElement,
  setFixedHeight,
  setFixedWidth,
  addStylesToElement,
  getElementSize,
} from '../utils/dom'
// import { EventTypes } from './EventSystem'
export interface RenderGridState {
  /** 可见行范围 */
  visibleRange: { startIndex: number; endIndex: number }
  /** 滚动位置 */
  scrollTop: number
  scrollLeft: number
  /** 表格父容器宽度 */
  parentContainerWidth: number
  /** 表格父容器高度 */
  parentContainerHeight: number
  /** 容器高度 */
  containerWidth: number
  /** 容器高度 */
  containerHeight: number
  /** 表格body可见区域宽度 */
  bodyWidth: number
  /** 表格body可见区域高度 */
  bodyHeight: number
  /** 表格内容实际宽度 */
  contentWidth: number
  /** 表格内容实际高度 */
  contentHeight: number
  /** 表格头部高度 */
  headerHeight: number
  /** 表格头部宽度 */
  headerWidth: number
  /** 表格底部高度 */
  footerHeight: number
  /** 表格底部宽度 */
  footerWidth: number
  /**viewTop */
}

export interface RenderGridTableState {
  renderGrid: RenderGridState
}

export interface RenderGridInitialTableState {
  renderGrid?: Partial<RenderGridState>
}

export interface RenderGridStateOptions<TData extends RowData> {
  /** 容器引用 */
  containerRef?: HTMLElement | null
  /** 行高（像素） */
  rowHeight?: number
  /** 表格最大高度 */
  maxHeight?: number
  /**renderGrid 状态变化回调 */
  onRenderGridChange?: OnChangeFn<RenderGridState>
}

export interface RenderGridInstance<TData extends RowData> {
  elRefs: {
    containerRef: HTMLElement | null
    tableContainer: HTMLElement | null
    tableHeader: HTMLElement | null
    tableBody: HTMLElement | null
    tableContent: HTMLElement | null
    tableFooter: HTMLElement | null
    elementCreated: boolean
  }
  setRenderGrid: (updater: Updater<RenderGridState>) => void
  /** 创建表格 DOM 元素 */
  createElement: () => void
  /** 渲染表格入口 */
  render: (container?: HTMLElement) => void
  /** 更新容器大小 */
  updateTableContainerSizeState: () => void
  /** 更新容器Scroll数据 */
  updateTableContainerScrollState: () => void
  /** 更新视图数据 */
  updateViewState: () => void
  /**获取虚拟滚动视口中可见的rows */
  getViewportRows: () => Row<TData>[]
}

const defaultRenderGridState: RenderGridState = {
  visibleRange: { startIndex: 0, endIndex: 0 },
  scrollTop: 0,
  scrollLeft: 0,
  parentContainerWidth: 0,
  parentContainerHeight: 0,
  containerWidth: 0,
  containerHeight: 0,
  bodyWidth: 0,
  bodyHeight: 0,
  contentWidth: 0,
  contentHeight: 0,
  headerHeight: 0,
  headerWidth: 0,
  footerWidth: 0,
  footerHeight: 0,
}

export const flexRender = <TProps extends object>(comp: any, props: TProps) => {
  if (typeof comp === 'function') {
    return comp(props)
  }
  return comp
}

/**
 * 表格容器渲染相关
 * 包括表格容器的Dom创建, 更新大小, 监听大小变化等
 */
export const RenderGrid: TableFeature = {
  getInitialState: (state): RenderGridTableState => {
    return {
      ...state,
      renderGrid: {
        ...defaultRenderGridState,
        ...(state?.renderGrid || {}),
      },
    }
  },

  getDefaultOptions: <TData extends RowData>(
    table: Table<TData>,
  ): Partial<RenderGridStateOptions<TData>> => {
    return {
      rowHeight: 20,
      onRenderGridChange: makeStateUpdater('renderGrid', table),
    }
  },

  createTable: <TData extends RowData>(table: Table<TData>): void => {
    table.elRefs = {
      containerRef: null,
      tableContainer: null,
      tableHeader: null,
      tableBody: null,
      tableContent: null,
      tableFooter: null,
      elementCreated: false,
    }

    let ParentCongtainerResizeObserver: ResizeObserver | null = null
    let removeBodyScrollObserver: (() => void) | null | undefined = null

    table.setRenderGrid = (updater) => table.options.onRenderGridChange?.(updater)

    table.createElement = () => {
      const initHeader = () => {
        table.elRefs.tableHeader = createElement('div', {
          className: 'c-table-header w-full h-full',
          innerHTML: 'header',
        })

        table.elRefs.tableHeader.addEventListener('click', () => console.log(table))
      }

      const initBody = () => {
        table.elRefs.tableBody = createElement('div', {
          className: 'c-table-body bg-[#eee]',
          innerHTML: 'body',
        })

        addStylesToElement(table.elRefs.tableBody, {
          overflow: 'scroll',
        })

        if (table.options.maxHeight) {
          table.elRefs.tableBody
        }
      }

      const initTableContent = () => {
        table.elRefs.tableContent = createElement('div', {
          className: 'c-table-content relative w-full h-full',
          innerHTML: 'content',
        })
      }

      const initFooter = () => {
        table.elRefs.tableFooter = createElement('div', {
          className: 'c-table-footer',
          innerHTML: 'footer',
        })
      }

      // 初始化表格容器
      const initTableContainer = () => {
        table.elRefs.tableContainer = createElement('div', {
          className: 'c-table-container h-full w-full border',
          attributes: {
            role: 'root',
          },
        })

        addStylesToElement(table.elRefs.tableContainer, {
          overflow: 'hidden',
        })
      }

      initTableContainer()
      initFooter()
      initBody()
      initTableContent()
      initHeader()
      table.elRefs.tableContainer?.appendChild(table.elRefs.tableHeader!)
      table.elRefs.tableContainer?.appendChild(table.elRefs.tableBody!)
      table.elRefs.tableBody?.appendChild(table.elRefs.tableContent!)
      table.elRefs.tableContainer?.appendChild(table.elRefs.tableFooter!)

      table.elRefs.elementCreated = true
    }

    table.updateTableContainerSizeState = () => {
      table.setRenderGrid((old) => {
        if (!table.elRefs.containerRef) return old

        const renderGrid = { ...old }

        const { width, height } = getElementSize(table.elRefs.containerRef)
        renderGrid.parentContainerWidth = width
        renderGrid.parentContainerHeight = height

        if (table.elRefs.tableHeader) {
          const { width, height } = getElementSize(table.elRefs.tableHeader)
          renderGrid.headerWidth = width
          renderGrid.headerHeight = height
        }

        if (table.elRefs.tableFooter) {
          const { width, height } = getElementSize(table.elRefs.tableFooter)
          renderGrid.footerWidth = width
          renderGrid.footerHeight = height
        }

        if (table.elRefs.tableBody) {
          const { width, height } = getElementSize(table.elRefs.tableBody)
          renderGrid.bodyWidth = width
          renderGrid.bodyHeight = height
        }

        if (table.elRefs.tableContainer) {
          const { width, height } = getElementSize(table.elRefs.tableContainer)
          renderGrid.containerWidth = width
          renderGrid.containerHeight = height
        }

        return renderGrid
      })
    }

    table.updateTableContainerScrollState = () => {
      table.setRenderGrid((old) => {
        const renderGridState = { ...old }

        renderGridState.scrollTop = table.elRefs.tableBody!['scrollTop']
        renderGridState.scrollLeft = table.elRefs.tableBody!['scrollLeft']

        return renderGridState
      })
    }

    table.getViewportRows = () => {
      return table.getVirtualRowModel().rows
    }

    table.render = (container?: HTMLElement) => {
      table.elRefs.containerRef = container || table.options.containerRef || null

      if (!table.elRefs.containerRef) {
        console.warn('没有传入容器的DOM对象: containerRef')
        return
      }

      if (!table.elRefs.elementCreated) {
        table.createElement()
      }

      table.elRefs.containerRef.appendChild(table.elRefs.tableContainer!)

      if (table.options.maxHeight) {
        table.elRefs.tableBody!.style.maxHeight = table.options.maxHeight + 'px'
      }

      table.getViewportRows().forEach((row) => {
        row.render()
        table.elRefs.tableContent!.appendChild(row.getGui()!)
      })

      table.elRefs.tableContent!.style.height =
        table.getRowModel().rows.length * table.options.rowHeight! + 'px'

      table.dispatchEvent({
        type: EventTypesEnum.TABLE_MOUNTED,
      })
    }

    const originalDestroy = table.destroy
    table.destroy = () => {
      table.elRefs.containerRef?.remove()
      table.elRefs.containerRef = null
      table.elRefs.tableContainer?.remove()
      table.elRefs.tableContainer = null
      table.elRefs.tableHeader?.remove()
      table.elRefs.tableHeader = null
      table.elRefs.tableBody?.remove()
      table.elRefs.tableBody = null
      table.elRefs.tableContent?.remove()
      table.elRefs.tableContent = null
      table.elRefs.tableFooter?.remove()
      table.elRefs.tableFooter = null
      table.elRefs.elementCreated = false

      originalDestroy()
    }
  },
}
