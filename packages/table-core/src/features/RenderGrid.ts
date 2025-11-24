import { InitialTableState, RowData, Table, TableFeature, TableState } from '../types'
import { createElement, setFixedHeight, setFixedWidth, addStylesToElement } from '../utils/dom'
import { EventTypes } from './EventSystem'

export interface RenderGridState {
  /** 可见行范围 */
  visibleRange: { startIndex: number; endIndex: number }
  /** DOM 容器引用 */
  containerRef: HTMLElement | null
  /** 滚动位置 */
  scrollTop: number
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
}

export interface RenderGridInstance<TData extends RowData> {
  /** 渲染表格入口 */
  render: (container?: HTMLElement) => void
}

const defaultRenderGridState: RenderGridState = {
  visibleRange: { startIndex: 0, endIndex: 0 },
  containerRef: null,
  scrollTop: 0,
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
      containerRef: null,
    }
  },

  createTable: <TData extends RowData>(table: Table<TData>): void => {
    let containerRef: HTMLElement | null | undefined = null
    let tableContainer: HTMLElement | null = null
    let tableHeader: HTMLElement | null = null
    let tableBody: HTMLElement | null = null
    let tableFooter: HTMLElement | null = null

    const init = ({ container }: { container: HTMLElement }) => {
      table.options.containerRef = container
      containerRef = container

      // 创建表格主容器
      tableContainer = createElement('div', {
        className: 'ts-table-container',
        attributes: {
          'data-table-id': 'table',
          role: 'table',
        },
      })

      // 创建表格头部容器
      tableHeader = createElement('div', {
        className: 'ts-table-header',
        attributes: {
          role: 'rowgroup',
        },
      })

      // 创建表格主体容器
      tableBody = createElement('div', {
        className: 'ts-table-body',
        attributes: {
          role: 'rowgroup',
        },
      })

      // 创建表格底部容器
      tableFooter = createElement('div', {
        className: 'ts-table-footer',
        attributes: {
          role: 'rowgroup',
        },
      })

      // 设置表格容器样式
      addStylesToElement(tableContainer, {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        position: 'relative',
      })

      // 设置头部样式
      addStylesToElement(tableHeader, {
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backgroundColor: '#f5f5f5',
        borderBottom: '1px solid #ddd',
      })

      // 设置主体样式
      addStylesToElement(tableBody, {
        flex: 1,
        overflow: 'auto',
        position: 'relative',
      })

      // 设置底部样式
      addStylesToElement(tableFooter, {
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        bottom: 0,
        zIndex: 10,
        backgroundColor: '#f5f5f5',
        borderTop: '1px solid #ddd',
      })

      // 将子容器添加到主容器
      tableContainer.appendChild(tableHeader)
      tableContainer.appendChild(tableBody)
      tableContainer.appendChild(tableFooter)

      // 将表格容器添加到用户提供的容器
      containerRef.appendChild(tableContainer)

      // 设置容器引用到表格状态
      table.setState(
        (old: TableState) =>
          ({
            ...old,
            renderGrid: {
              ...old.renderGrid,
              containerRef: tableBody,
            },
          }) as TableState,
      )

      console.log('表格DOM容器创建完成')
    }

    table.render = (container?: HTMLElement) => {
      if (!container) {
        console.warn('没有传入容器的DOM对象: containerRef')
        return
      }

      init({
        container,
      })

      if (!tableContainer || !tableHeader || !tableBody || !tableFooter) {
        console.warn('表格DOM容器未正确初始化')
        return
      }

      // 清空现有内容
      tableHeader.innerHTML = ''
      tableBody.innerHTML = ''
      tableFooter.innerHTML = ''

      // 渲染表头
      const columns = table.getAllLeafColumns()
      const headerRow = createElement('div', {
        className: 'ts-table-header-row',
        attributes: { role: 'row' },
      })

      addStylesToElement(headerRow, {
        display: 'flex',
        height: '40px',
        alignItems: 'center',
      })

      // Render table headers
      table.getHeaderGroups().forEach((headerGroup) => {
        headerGroup.headers.forEach((header) => {
          const headerCell = createElement('div', {
            className: 'ts-table-header-cell',
            attributes: {
              role: 'columnheader',
              'data-header-id': header.id,
            },
            textContent: header.isPlaceholder
              ? ''
              : flexRender(header.column.columnDef.header, header.getContext()),
          })

          addStylesToElement(headerCell, {
            flex: 1,
            padding: '8px',
            borderRight: '1px solid #ddd',
            fontWeight: 'bold',
            backgroundColor: '#f5f5f5',
          })

          headerRow.appendChild(headerCell)
        })
      })

      tableHeader.appendChild(headerRow)

      // 渲染表格主体内容
      const rows = table.getRowModel().rows
      rows.forEach((row, index) => {
        const rowElement = createElement('div', {
          className: 'ts-table-row',
          attributes: {
            role: 'row',
            'data-row-index': index.toString(),
            'data-row-id': row.id,
          },
        })

        addStylesToElement(rowElement, {
          display: 'flex',
          height: `${table.options.rowHeight || 40}px`,
          alignItems: 'center',
          borderBottom: '1px solid #eee',
        })

        columns.forEach((column) => {
          const cellValue = row.getValue(column.id)
          const cellElement = createElement('div', {
            className: 'ts-table-cell',
            attributes: {
              role: 'cell',
              'data-column-id': column.id,
              'data-row-index': index.toString(),
            },
            textContent: cellValue?.toString() || '',
          })

          addStylesToElement(cellElement, {
            flex: 1,
            padding: '8px',
            borderRight: '1px solid #eee',
          })

          rowElement.appendChild(cellElement)
        })

        tableBody?.appendChild(rowElement)
      })

      console.log(`表格渲染完成: ${rows.length} 行, ${columns.length} 列`)

      table.dispatchEvent(EventTypes.TABLE_MOUNTED, {
        table,
      })
    }
  },
}
