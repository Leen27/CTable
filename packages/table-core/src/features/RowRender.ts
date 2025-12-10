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

  /** Dynamic row heights are done on demand, only when row is visible. However for row virtualisation
   * we need a row height to do the 'what rows are in viewport' maths. So we assign a row height to each
   * row based on defaults and rowHeightEstimated=true, then when the row is needed for drawing we do
   * the row height calculation and set rowHeightEstimated=false.*/
  rowHeightEstimated: boolean

  /** The height, in pixels, of this row */
  rowHeight: number | null | undefined

  /**
   * This is `true` if the row has a rowIndex assigned, otherwise `false`.
   */
  displayed: boolean

  /** The row top position in pixels. */
  rowTop: number | null

  /**
   * Sets the row height.
   * Call if you want to change the height initially assigned to the row.
   * After calling, you must call `api.onRowHeightChanged()` so the grid knows it needs to work out the placement of the rows. */
  setRowHeight: (rowHeight: number | undefined | null, estimated: boolean) => void

  /**
   * 初始计算：当行还没有实际渲染时，使用默认高度并设置 estimated: true
   * 标志存储：将估计标志存储在 rowNode.rowHeightEstimated 属性中
   * 实际渲染时：当行进入视口需要实际渲染时，重新计算真实高度
   * 位置更新：重新计算真实高度后，更新行的位置信息
   * 循环处理：处理高度变化可能引起的连锁反应，直到所有行的高度都确定
   */
  getRowHeight: (allowEstimate?: boolean) => { height: number; estimated: boolean }

  /**设置row 的距离顶部的距离*/
  setRowTop: (topY: number) => void

  /** 渲染 row */
  render: () => void

  getGui: () => HTMLElement | null
}

export const RowRender: TableFeature = {
  createRow: <TData extends RowData>(row: Row<TData>, table: Table<TData>): void => {
    row.rowHeightEstimated = false
    row.rowHeight = table.options.rowHeight || 20
    row.displayed = false
    row.rowTop = null
    row.eGui = null

    row.setRowHeight = (rowHeight: number | undefined | null, estimated: boolean = false): void => {
      row.rowHeight = rowHeight
      row.rowHeightEstimated = estimated

      row.dispatchEvent({
        type: EventTypesEnum.ROW_HEIGHT_CHANGE,
      })
    }

    row.getRowHeight = (allowEstimate = false) => {
      if (isFunction(table.options.getRowHeight)) {
        if (allowEstimate) {
          // 如果允许估计，返回默认高度并标记为估计值
          return { height: table.options.rowHeight!, estimated: true }
        }

        // 如果不允许估计，调用实际的 getRowHeight 函数
        const height = table.options.getRowHeight(row)

        if (isNumber(height)) {
          // 需要至少占1个像素, 保证在计算 Dom 元素可见性的时候可以计算
          return { height: Math.max(1, height), estimated: false }
        }
      }

      // 使用默认配置
      return { height: table.options.rowHeight!, estimated: false }
    }

    row.setRowTop = (topY: number) => {
      addStylesToElement(row.eGui, {
        transform: `translateY(${topY}px)`,
      })
    }

    row.render = () => {
      const isFirstRender = row.eGui === null

      if (isFirstRender) {
        row.eGui = createElement('div', {
          className: 'absolute w-full border',
          attributes: {
            role: 'row',
            id: row.id,
            index: row.index + '',
          },
          innerHTML: `index: ${row.index}`,
        })
      }

      const rowHeightResult = row.getRowHeight()
      addStylesToElement(row.eGui, {
        height: rowHeightResult.height + 'px',
      })
      row.setRowTop(row.getRowHeight().height * row.index)
    }

    row.getGui = () => row.eGui
  },
}
