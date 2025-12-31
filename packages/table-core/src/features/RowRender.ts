import { EventTypesEnum } from '../core/events'
import { Row, RowData, Table, TableFeature } from '../types'
import { isFunction } from '../utils'
import { addStylesToElement, createElement } from '../utils/dom'
import { isNumber } from '../utils/is'
import { createCellRenderer, cleanupCellRenderer } from '../utils/vue-renderer'

export interface RowRenderStateOptions<TData extends RowData> {
  /** 计算行高回调 */
  getRowHeight?: (row: Row<TData>) => number
}

export interface IRowRenderState {}

export interface IRowRenderRow {
  /** 渲染的dom 元素 */
  eGui: HTMLElement | null

  /**
   * This is `true` if the row has a rowIndex assigned, otherwise `false`.
   */
  displayed: boolean

  /**
   * 计算行高并更新 row 的 高度
   */
  calculateRowHeight: () => void

  /**设置row 的距离顶部的距离*/
  setRowTop: (topY: number) => void

  /** 渲染 row */
  render: () => void

  getGui: () => HTMLElement | null

  /** 销毁 row */
  destroy: () => void
}

export const RowRender: TableFeature = {
  createRow: <TData extends RowData>(row: Row<TData>, table: Table<TData>): void => {
    row.displayed = false
    row.eGui = null

    row.render = () => {
      const isFirstRender = row.eGui === null

      if (isFirstRender) {
        row.eGui = createElement('div', {
          className: 'absolute w-full border',
          attributes: {
            role: 'row',
            id: row.id,
            index: row.index + '',
            [table.options.virtualIndexAttribute!]: row.index + ''
          }
        })

        // 创建行容器，用于显示单元格
        const rowContainer = createElement('div', {
          className: 'flex w-full h-full'
        })

        // 渲染每个可见的单元格
        row.getVisibleCells().forEach(cell => {
          const cellElement = createElement('div', {
            className: 'c-table-cell border-r border-b flex items-center justify-center',
            styles: {
              width: cell.column.getSize() + 'px',
              minWidth: cell.column.getSize() + 'px',
              maxWidth: cell.column.getSize() + 'px'
            }
          })

          // 获取单元格内容定义
          const cellContent = cell.column.columnDef.cell
          
          if (cellContent) {
            // 使用 Vue 渲染器渲染单元格内容
            createCellRenderer(cellContent, cell.getContext(), cellElement)
          } else {
            // 默认渲染单元格值
            cellElement.textContent = cell.renderValue()?.toString() ?? ''
          }

          rowContainer.appendChild(cellElement)
        })

        row.eGui.appendChild(rowContainer)
        table.elRefs.tableContent?.appendChild(row.eGui)

        // 监听resize 并更新row 高度
        table.options.dynamic && table.measureElement(row.eGui)
      }

      // 使用虚拟滚动计算出来的结果
      const measurement = table.getMeasurements()[row.index]
      if (!measurement) return
      addStylesToElement(row.eGui, {
        height: measurement.size + 'px',
        transform: `translateY(${measurement.start}px)`,
      })
    }

    row.getGui = () => row.eGui

    const oldRowDestroy = row.destroy
    row.destroy = () => {
      if (row.eGui) {
        // 清理所有单元格中的 Vue 实例
        const cellElements = row.eGui.querySelectorAll('.c-table-cell')
        cellElements.forEach(cellElement => {
          cleanupCellRenderer(cellElement as HTMLElement)
        })
        
        // 移除 DOM 元素
        row.eGui.remove()
        row.eGui = null
      }

      oldRowDestroy()
    }
  },
}
