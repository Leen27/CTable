import { EventTypesEnum } from '../core/events'
import { InitialTableState, RowData, Table, TableFeature, TableState } from '../types'
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
}

export interface RenderGridInstance<TData extends RowData> {
  /** 创建表格 DOM 元素 */
  createElement: () => void
  /** 渲染表格入口 */
  render: (container?: HTMLElement) => void
}

const defaultRenderGridState: RenderGridState = {
  visibleRange: { startIndex: 0, endIndex: 0 },
  scrollTop: 0,
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

  getDefaultOptions: <TData extends RowData>(): Partial<RenderGridStateOptions<TData>> => {
    return {
      rowHeight: 20,
    }
  },

  createTable: <TData extends RowData>(table: Table<TData>): void => {
    let containerRef: HTMLElement | null | undefined = null
    let tableContainer: HTMLElement | null = null
    let tableHeader: HTMLElement | null = null
    let tableBody: HTMLElement | null = null
    let tableFooter: HTMLElement | null = null
    let elementCreated = false

    let ParentCongtainerResizeObserver = null

    table.createElement = () => {
      const initHeader = () => {
        tableHeader = createElement('div', {
          className: 'c-table-header w-full h-full',
          innerHTML: 'header',
        })
      }

      const initBody = () => {
        tableBody = createElement('div', {
          className: 'c-table-body bg-[#eee]',
          innerHTML: 'body',
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
      }

      initTableContainer()
      initFooter()
      initBody()
      initHeader()
      tableContainer?.appendChild(tableHeader!)
      tableContainer?.appendChild(tableBody!)
      tableContainer?.appendChild(tableFooter!)

      elementCreated = true
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

      table.dispatchEvent({
        type: EventTypesEnum.TABLE_MOUNTED,
      })

      ParentCongtainerResizeObserver = new ResizeObserver(() => {
        if (!containerRef) return
        const { width, height } = getElementSize(containerRef)
        const renderGrid = table.getState().renderGrid
        renderGrid.parentContainerWidth = width
        renderGrid.parentContainerHeight = height

        table.dispatchEvent({
          type: EventTypesEnum.TABLE_PARENT_CONTAINER_RESIZE,
          data: {
            ...renderGrid,
          },
        })
      })
      ParentCongtainerResizeObserver.observe(containerRef)
    }

    const originalDestroy = table.destroy
    table.destroy = () => {
      containerRef?.remove()
      containerRef = null
      tableContainer?.remove()
      tableContainer = null
      tableHeader?.remove()
      tableHeader = null
      tableBody?.remove()
      tableBody = null
      tableFooter?.remove()
      tableFooter = null
      elementCreated = false
      originalDestroy()
    }
  },
}
