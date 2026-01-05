import { EventTypesEnum } from '../core/events'
import { Row, RowData, Table, TableFeature } from '../types'
import { isFunction } from '../utils'
import { addStylesToElement, createElement } from '../utils/dom'
import { isNumber } from '../utils/is'
import { createCellRenderer, cleanupCellRenderer } from '../utils/vue-renderer'

// 树形展开/折叠图标 - 使用简单的 SVG 字符串
const getTreeExpandIcon = (expanded: boolean): string => {
  if (expanded) {
    return `<svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <path d="M2 4.5L6 8.5L10 4.5H2Z"/>
    </svg>`
  } else {
    return `<svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <path d="M4.5 2L8.5 6L4.5 10V2Z"/>
    </svg>`
  }
}

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
        const measure = row.getMeasureMent()
        // 如果有 measure 说明之前计算过, 直接从缓存里取
        // 否则表示新建, 从所有行里找到下标
        const index = !measure ? table.getPreVirtualRowModel().rows.findIndex(r => r.id === row.id) : measure.index
console.log(index, 'indexindexindex')
        if (index === -1) return

        row.eGui = createElement('div', {
          className: 'absolute w-full border',
          attributes: {
            role: 'row',
            id: row.id,
            [table.options.virtualIndexAttribute!]: index + ''
          }
        })

        // 创建行容器，用于显示单元格
        const rowContainer = createElement('div', {
          className: 'flex w-full h-full'
        })

        // 渲染每个可见的单元格
        row.getVisibleCells().forEach((cell, cellIndex) => {
          const cellElement = createElement('div', {
            className: 'c-table-cell border-r border-b flex items-center',
            styles: {
              width: cell.column.getSize() + 'px',
              minWidth: cell.column.getSize() + 'px',
              maxWidth: cell.column.getSize() + 'px'
            }
          })

          // 如果是第一列且是树形数据，添加缩进和展开图标
          if (cellIndex === 0 && row.getCanExpand) {
            const canExpand = row.getCanExpand()
            const depth = row.depth || 0
            
            // 创建缩进容器
            const indentContainer = createElement('div', {
              className: 'flex items-center h-full',
              styles: {
                paddingLeft: `${depth * 20}px`
              }
            })

            // 如果需要，创建展开/折叠按钮
            if (canExpand) {
              const expandButton = createElement('button', {
                className: 'w-5 h-5 flex items-center justify-center mr-2 text-gray-500 hover:text-gray-700',
                attributes: {
                  type: 'button'
                }
              })

              // 创建展开/折叠图标
              const iconContainer = createElement('span', {
                className: 'w-3 h-3'
              })
              
              // 直接设置 SVG 图标
              const isExpanded = row.getIsExpanded ? row.getIsExpanded() : false
              iconContainer.innerHTML = getTreeExpandIcon(isExpanded)

              expandButton.appendChild(iconContainer)
              
              // 添加点击事件处理
              expandButton.addEventListener('click', (e) => {
                e.stopPropagation()
                if (row.toggleExpanded) {
                  row.toggleExpanded()
                }
              })

              indentContainer.appendChild(expandButton)
            } else {
              // 添加空白占位符以保持对齐
              const spacer = createElement('div', {
                className: 'w-5 h-5 mr-2'
              })
              indentContainer.appendChild(spacer)
            }

            // 创建内容容器
            const contentContainer = createElement('div', {
              className: 'flex-1'
            })

            // 获取单元格内容定义
            const cellContent = cell.column.columnDef.cell
            
            if (cellContent) {
              // 使用 Vue 渲染器渲染单元格内容
              createCellRenderer(cellContent, cell.getContext(), contentContainer)
            } else {
              // 默认渲染单元格值
              contentContainer.textContent = cell.renderValue()?.toString() ?? ''
            }

            indentContainer.appendChild(contentContainer)
            cellElement.appendChild(indentContainer)
          } else {
            // 非第一列或普通行的正常渲染
            const cellContent = cell.column.columnDef.cell
            
            if (cellContent) {
              // 使用 Vue 渲染器渲染单元格内容
              createCellRenderer(cellContent, cell.getContext(), cellElement)
            } else {
              // 默认渲染单元格值
              cellElement.textContent = cell.renderValue()?.toString() ?? ''
            }
          }

          rowContainer.appendChild(cellElement)
        })

        row.eGui.appendChild(rowContainer)
        table.elRefs.tableContent?.appendChild(row.eGui)

        // 监听resize 并更新row 高度
        table.options.dynamic && table.measureElement(row.eGui)
      } else {
        // 更新模式：更新展开/折叠图标状态
        if (row.eGui) {
          const firstCell = row.eGui.querySelector('.c-table-cell') as HTMLElement
          if (firstCell && row.getCanExpand && row.getCanExpand()) {
            const iconContainer = firstCell.querySelector('button span') as HTMLElement
            if (iconContainer) {
              // 更新图标
              const isExpanded = row.getIsExpanded ? row.getIsExpanded() : false
              iconContainer.innerHTML = getTreeExpandIcon(isExpanded)
            }
          }
        }
      }

      const measureAfter = row.getMeasureMent()
      // 使用虚拟滚动计算出来的结果
      addStylesToElement(row.eGui, {
        // 动态高度不要写死高度
        height: table.options.dynamic ? "" : measureAfter?.size + 'px',
        transform: `translateY(${measureAfter?.start}px)`,
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
