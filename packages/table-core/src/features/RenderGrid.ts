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
import { makeStateUpdater } from '../utils'
import {
  createElement,
  setFixedHeight,
  setFixedWidth,
  addStylesToElement,
  getElementSize,
  observeElementOffset,
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
  setRenderGrid: (updater: Updater<RenderGridState>) => void
  /** 创建表格 DOM 元素 */
  createElement: () => void
  /** 渲染表格入口 */
  render: (container?: HTMLElement) => void
  /**添加监听事件 */
  initObserver: () => void
  /** 更新容器大小 */
  updateTableContainerSizeState: () => void
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
    let containerRef: HTMLElement | null | undefined = null
    let tableContainer: HTMLElement | null = null
    let tableHeader: HTMLElement | null = null
    let tableBody: HTMLElement | null = null
    let tableContent: HTMLElement | null = null
    let tableFooter: HTMLElement | null = null
    let elementCreated = false

    let ParentCongtainerResizeObserver: ResizeObserver | null = null
    let BodyScrollObserver: (() => void) | null | undefined = null

    table.setRenderGrid = (updater) => table.options.onRenderGridChange?.(updater)

    table.createElement = () => {
      const initHeader = () => {
        tableHeader = createElement('div', {
          className: 'c-table-header w-full h-full',
          innerHTML: 'header',
        })

        tableHeader.addEventListener('click', () => console.log(table))
      }

      const initBody = () => {
        tableBody = createElement('div', {
          className: 'c-table-body bg-[#eee]',
          innerHTML: 'body',
        })

        addStylesToElement(tableBody, {
          overflow: 'scroll',
        })

        if (table.options.maxHeight) {
          tableBody
        }
      }

      const initTableContent = () => {
        tableContent = createElement('div', {
          className: 'c-table-content relative w-full h-full',
          innerHTML: 'content',
        })
      }

      const initFooter = () => {
        tableFooter = createElement('div', {
          className: 'c-table-footer',
          innerHTML: 'footer',
        })
      }

      // 初始化表格容器
      const initTableContainer = () => {
        tableContainer = createElement('div', {
          className: 'c-table-container h-full w-full border',
          attributes: {
            role: 'root',
          },
        })

        addStylesToElement(tableContainer, {
          overflow: 'hidden',
        })
      }

      initTableContainer()
      initFooter()
      initBody()
      initTableContent()
      initHeader()
      tableContainer?.appendChild(tableHeader!)
      tableContainer?.appendChild(tableBody!)
      tableBody?.appendChild(tableContent!)
      tableContainer?.appendChild(tableFooter!)

      elementCreated = true
    }

    table.updateTableContainerSizeState = () => {
      table.setRenderGrid((old) => {
        if (!containerRef) return old

        const renderGrid = { ...old }

        const { width, height } = getElementSize(containerRef)
        renderGrid.parentContainerWidth = width
        renderGrid.parentContainerHeight = height

        if (tableHeader) {
          const { width, height } = getElementSize(tableHeader)
          renderGrid.headerWidth = width
          renderGrid.headerHeight = height
        }

        if (tableFooter) {
          const { width, height } = getElementSize(tableFooter)
          renderGrid.footerWidth = width
          renderGrid.footerHeight = height
        }

        if (tableBody) {
          const { width, height } = getElementSize(tableBody)
          renderGrid.bodyWidth = width
          renderGrid.bodyHeight = height
        }

        if (tableContainer) {
          const { width, height } = getElementSize(tableContainer)
          renderGrid.containerWidth = width
          renderGrid.containerHeight = height
        }

        return renderGrid
      })
    }

    table.getViewportRows = () => {
      return table.getVirtualRowModel().rows
    }

    table.render = (container?: HTMLElement) => {
      if (!elementCreated) {
        table.createElement()
      }

      containerRef = container || table.options.containerRef

      if (!containerRef) {
        console.warn('没有传入容器的DOM对象: containerRef')
        return
      }

      containerRef.appendChild(tableContainer!)

      if (table.options.maxHeight) {
        tableBody!.style.maxHeight = table.options.maxHeight + 'px'
      }

      table.getViewportRows().forEach((row) => {
        row.render()
        tableContent!.appendChild(row.getGui()!)
      })

      tableContent!.style.height = table.getRowModel().rows.length * table.options.rowHeight! + 'px'

      table.dispatchEvent({
        type: EventTypesEnum.TABLE_MOUNTED,
      })

      table.initObserver()
    }

    table.initObserver = () => {
      if (!containerRef) {
        return
      }
      // 监听容器大小变化
      ParentCongtainerResizeObserver = new ResizeObserver(() => {
        // 更新状态中的容器大小
        table.updateTableContainerSizeState()
      })

      ParentCongtainerResizeObserver.observe(containerRef)

      // 监听body滚动条位置
      BodyScrollObserver = observeElementOffset(tableBody!, (e) => {
        table.setRenderGrid((old) => {
          const renderGridState = { ...old }

          renderGridState.scrollTop = e.top
          renderGridState.scrollLeft = e.left

          return renderGridState
        })
        console.log(table.getState().renderGrid)
        table.getVirtualRowModel().rows.forEach((row) => row.render())
      })
    }

    const originalDestroy = table.destroy
    table.destroy = () => {
      containerRef && ParentCongtainerResizeObserver?.unobserve(containerRef)
      BodyScrollObserver?.()

      containerRef?.remove()
      containerRef = null
      tableContainer?.remove()
      tableContainer = null
      tableHeader?.remove()
      tableHeader = null
      tableBody?.remove()
      tableBody = null
      tableContent?.remove()
      tableContent = null
      tableFooter?.remove()
      tableFooter = null
      elementCreated = false

      originalDestroy()
    }
  },
}
