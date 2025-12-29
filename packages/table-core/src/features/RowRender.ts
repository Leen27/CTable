import { EventTypesEnum } from '../core/events'
import { Row, RowData, Table, TableFeature } from '../types'
import { isFunction } from '../utils'
import { addStylesToElement, createElement } from '../utils/dom'
import { isNumber } from '../utils/is'

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
          },
          innerHTML: `<div style="height: ${Math.random() * 100 + 26}px;">index: ${row.index}</div>`,
        })

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
  },
}
