import { RowData, Table, TableFeature, Row, Column, Cell } from '../types'
import { EventTypes, EventListener, EventListenerOptions } from './EventSystem'

// 事件系统使用示例 - 展示如何在功能模块中集成事件系统

// 示例1: 行选择模块的事件集成
const RowSelectionWithEvents = {
  createTable: <TData extends RowData>(table: Table<TData>): void => {
    // 监听行选择相关事件
    if ((table as any).addEventListener) {
      // 监听行点击事件来更新选择状态
      ;(table as any).addEventListener(EventTypes.ROW_CLICKED, (event: any) => {
        const { row, nativeEvent } = event.data

        // 检查是否按下了Ctrl键或Shift键来进行多选
        const isMultiSelect = nativeEvent?.ctrlKey || nativeEvent?.shiftKey

        if (isMultiSelect) {
          // 切换行的选择状态
          row.toggleSelected()
        } else {
          // 清除其他选择，只选择当前行
          table.resetRowSelection()
          row.toggleSelected()
        }

        console.log(`行 ${row.id} 被点击，选择状态: ${row.getIsSelected()}`)
      })

      // 监听选择状态变化事件
      ;(table as any).addEventListener(EventTypes.SELECTION_CHANGED, (event: any) => {
        const selectedRows = table.getSelectedRowModel().rows
        console.log(`选择状态发生变化，当前选择了 ${selectedRows.length} 行`)

        // 可以在这里触发其他相关的UI更新
        // 例如更新工具栏状态、显示选择计数等
      })

      // 监听全选事件
      ;(table as any).addEventListener(EventTypes.ALL_ROWS_SELECTED, (event: any) => {
        console.log('所有行被选中')

        // 可以在这里触发批量操作UI的显示
      })

      // 监听取消全选事件
      ;(table as any).addEventListener(EventTypes.ALL_ROWS_DESELECTED, (event: any) => {
        console.log('所有行取消选中')

        // 可以在这里隐藏批量操作UI
      })
    }

    // 分发选择相关事件
    const originalToggleAllRowsSelected = table.toggleAllRowsSelected
    table.toggleAllRowsSelected = (value?: boolean) => {
      const oldSelectedState = table.getIsAllRowsSelected()
      originalToggleAllRowsSelected(value)
      const newSelectedState = table.getIsAllRowsSelected()

      // 分发选择变化事件
      if ((table as any).dispatchEvent) {
        if (newSelectedState && !oldSelectedState) {
          ;(table as any).dispatchEvent(EventTypes.ALL_ROWS_SELECTED, {
            selectedCount: table.getSelectedRowModel().rows.length,
            totalCount: table.getRowModel().rows.length,
          })
        } else if (!newSelectedState && oldSelectedState) {
          ;(table as any).dispatchEvent(EventTypes.ALL_ROWS_DESELECTED, {
            selectedCount: 0,
            totalCount: table.getRowModel().rows.length,
          })
        }

        ;(table as any).dispatchEvent(EventTypes.SELECTION_CHANGED, {
          selectedRows: table.getSelectedRowModel().rows,
          selectedCount: table.getSelectedRowModel().rows.length,
        })
      }
    }
  },

  createRow: <TData extends RowData>(row: Row<TData>, table: Table<TData>): void => {
    // 为行添加事件支持
    if ((row as any).addRowEventListener) {
      // 监听行双击事件
      ;(row as any).addRowEventListener(EventTypes.ROW_DOUBLE_CLICKED, (event: any) => {
        console.log(`行 ${row.id} 被双击`)

        // 可以在这里打开详情面板或编辑模式
        // 例如: openRowDetails(row)
      })

      // 监听行选择状态变化
      const originalToggleSelected = row.toggleSelected
      row.toggleSelected = () => {
        const oldSelected = row.getIsSelected()
        originalToggleSelected()
        const newSelected = row.getIsSelected()

        // 分发选择状态变化事件
        if ((table as any).dispatchEvent) {
          if (newSelected && !oldSelected) {
            ;(table as any).dispatchEvent(EventTypes.ROW_SELECTED, {
              row: row,
              rowId: row.id,
              selected: true,
            })
          } else if (!newSelected && oldSelected) {
            ;(table as any).dispatchEvent(EventTypes.ROW_DESELECTED, {
              row: row,
              rowId: row.id,
              selected: false,
            })
          }
        }
      }
    }
  },
}

// 示例2: 列排序模块的事件集成
const RowSortingWithEvents = {
  createTable: <TData extends RowData>(table: Table<TData>): void => {
    if ((table as any).addEventListener) {
      // 监听列点击事件来触发排序
      ;(table as any).addEventListener(EventTypes.COLUMN_CLICKED, (event: any) => {
        const { column } = event.data

        // 获取当前排序状态
        const currentSort = column.getIsSorted()

        // 循环排序状态: none -> asc -> desc -> none
        let newSort: 'asc' | 'desc' | false
        if (currentSort === false) {
          newSort = 'asc'
        } else if (currentSort === 'asc') {
          newSort = 'desc'
        } else {
          newSort = false
        }

        // 设置排序
        column.toggleSorting(newSort === 'asc')

        console.log(`列 ${column.id} 排序状态: ${newSort}`)
      })

      // 监听排序变化事件
      ;(table as any).addEventListener(EventTypes.SORT_CHANGED, (event: any) => {
        const { sorting } = event.data
        console.log(`排序发生变化，当前排序:`, sorting)

        // 可以在这里更新排序指示器UI
      })

      // 监听排序清除事件
      ;(table as any).addEventListener(EventTypes.SORT_CLEARED, (event: any) => {
        console.log('所有排序被清除')

        // 可以在这里重置排序指示器
      })
    }

    // 分发排序相关事件
    const originalSetSorting = table.setSorting
    table.setSorting = (updater: any) => {
      const oldSorting = table.getState().sorting
      originalSetSorting(updater)
      const newSorting = table.getState().sorting

      if ((table as any).dispatchEvent) {
        if (newSorting.length === 0 && oldSorting.length > 0) {
          // 排序被清除
          ;(table as any).dispatchEvent(EventTypes.SORT_CLEARED, {
            oldSorting,
            newSorting,
          })
        } else if (newSorting.length > 0) {
          // 排序发生变化
          ;(table as any).dispatchEvent(EventTypes.SORT_CHANGED, {
            oldSorting,
            newSorting,
            sorting: newSorting,
          })

          // 分发列排序事件
          newSorting.forEach((sort) => {
            const column = table.getColumn(sort.id)
            if (column) {
              ;(table as any).dispatchEvent(EventTypes.COLUMN_SORTED, {
                column,
                columnId: sort.id,
                sort: sort.desc ? 'desc' : 'asc',
              })
            }
          })
        }
      }
    }
  },
}

// 示例3: 过滤模块的事件集成
const ColumnFilteringWithEvents = {
  createTable: <TData extends RowData>(table: Table<TData>): void => {
    if ((table as any).addEventListener) {
      // 监听过滤变化事件
      ;(table as any).addEventListener(EventTypes.FILTER_CHANGED, (event: any) => {
        const { filters } = event.data
        console.log(`过滤条件发生变化，当前过滤:`, filters)

        // 可以在这里更新过滤指示器
        // 可以显示"已应用X个过滤条件"的提示
      })

      // 监听过滤清除事件
      ;(table as any).addEventListener(EventTypes.FILTER_CLEARED, (event: any) => {
        console.log('所有过滤条件被清除')

        // 可以在这里隐藏过滤指示器
      })

      // 监听过滤应用事件
      ;(table as any).addEventListener(EventTypes.FILTER_APPLIED, (event: any) => {
        const { filter, columnId } = event.data
        console.log(`过滤条件应用到列 ${columnId}:`, filter)

        // 可以在这里更新特定列的过滤指示器
      })
    }

    // 分发过滤相关事件
    const originalSetColumnFilters = table.setColumnFilters
    table.setColumnFilters = (updater: any) => {
      const oldFilters = table.getState().columnFilters
      originalSetColumnFilters(updater)
      const newFilters = table.getState().columnFilters

      if ((table as any).dispatchEvent) {
        if (newFilters.length === 0 && oldFilters.length > 0) {
          // 过滤被清除
          ;(table as any).dispatchEvent(EventTypes.FILTER_CLEARED, {
            oldFilters,
            newFilters,
          })
        } else if (newFilters.length > 0) {
          // 过滤发生变化
          ;(table as any).dispatchEvent(EventTypes.FILTER_CHANGED, {
            oldFilters,
            newFilters,
            filters: newFilters,
          })

          // 分发列过滤事件
          newFilters.forEach((filter) => {
            const column = table.getColumn(filter.id)
            if (column) {
              ;(table as any).dispatchEvent(EventTypes.COLUMN_FILTERED, {
                column,
                columnId: filter.id,
                filter: filter.value,
              })
            }
          })
        }
      }
    }
  },
}

// 示例4: 渲染模块的事件集成
const RenderGridWithEvents = {
  createTable: <TData extends RowData>(table: Table<TData>): void => {
    if ((table as any).addEventListener) {
      // 监听渲染开始事件
      ;(table as any).addEventListener(EventTypes.RENDER_STARTED, (event: any) => {
        console.log('表格渲染开始')

        // 可以在这里显示加载指示器
        // 例如: showLoadingIndicator()
      })

      // 监听渲染完成事件
      ;(table as any).addEventListener(EventTypes.RENDER_COMPLETED, (event: any) => {
        console.log('表格渲染完成')

        // 可以在这里隐藏加载指示器
        // 例如: hideLoadingIndicator()

        // 可以在这里触发其他UI更新
      })

      // 监听虚拟滚动更新事件
      ;(table as any).addEventListener(EventTypes.VIRTUAL_SCROLL_UPDATED, (event: any) => {
        const { visibleRange, scrollTop } = event.data
        console.log(`虚拟滚动更新，可见范围: ${visibleRange.startIndex}-${visibleRange.endIndex}`)

        // 可以在这里优化渲染性能
        // 例如: 只渲染可见范围内的行
      })

      // 监听可见范围变化事件
      ;(table as any).addEventListener(EventTypes.VISIBLE_RANGE_CHANGED, (event: any) => {
        const { startIndex, endIndex } = event.data
        console.log(`可见范围变化: ${startIndex} - ${endIndex}`)

        // 可以在这里更新虚拟滚动状态
      })
    }

    // 分发渲染相关事件
    const originalRender = table.render
    if (originalRender) {
      table.render = (container?: HTMLElement) => {
        // 分发渲染开始事件
        if ((table as any).dispatchEvent) {
          ;(table as any).dispatchEvent(EventTypes.RENDER_STARTED, {
            container,
            timestamp: Date.now(),
          })
        }

        try {
          // 执行原始渲染
          originalRender(container)

          // 分发渲染完成事件
          if ((table as any).dispatchEvent) {
            ;(table as any).dispatchEvent(EventTypes.RENDER_COMPLETED, {
              container,
              timestamp: Date.now(),
              renderTime: performance.now(), // 假设记录了开始时间
            })
          }
        } catch (error) {
          // 分发错误事件
          if ((table as any).dispatchEvent) {
            ;(table as any).dispatchEvent(EventTypes.ERROR_OCCURRED, {
              error,
              context: 'render',
              container,
            })
          }
          throw error
        }
      }
    }
  },
}

// 示例5: 单元格编辑的事件集成
const CellEditingWithEvents = {
  createCell: <TData extends RowData>(
    cell: any,
    column: any,
    row: any,
    table: Table<TData>,
  ): void => {
    if ((cell as any).addCellEventListener) {
      // 监听单元格点击事件
      ;(cell as any).addCellEventListener(EventTypes.CELL_CLICKED, (event: any) => {
        console.log(`单元格 ${cell.id} 被点击`)

        // 可以在这里进入编辑模式
        // 例如: startCellEdit(cell)
      })

      // 监听单元格双击事件
      ;(cell as any).addCellEventListener(EventTypes.CELL_DOUBLE_CLICKED, (event: any) => {
        console.log(`单元格 ${cell.id} 被双击`)

        // 可以在这里直接进入编辑模式
        // 例如: startCellEdit(cell, { directEdit: true })
      })

      // 监听单元格获得焦点事件
      ;(cell as any).addCellEventListener(EventTypes.CELL_FOCUSED, (event: any) => {
        console.log(`单元格 ${cell.id} 获得焦点`)

        // 可以在这里高亮显示单元格
      })

      // 监听单元格失去焦点事件
      ;(cell as any).addCellEventListener(EventTypes.CELL_BLURRED, (event: any) => {
        console.log(`单元格 ${cell.id} 失去焦点`)

        // 可以在这里保存编辑内容或验证输入
      })
    }

    // 分发单元格编辑相关事件
    const originalSetValue = (cell as any).setValue
    if (originalSetValue) {
      ;(cell as any).setValue = (value: any) => {
        const oldValue = cell.getValue()

        // 分发编辑开始事件
        if ((table as any).dispatchEvent) {
          ;(table as any).dispatchEvent(EventTypes.CELL_EDIT_STARTED, {
            cell,
            oldValue,
            newValue: value,
            column: cell.column,
            row: cell.row,
          })
        }

        try {
          // 执行原始设置值操作
          originalSetValue(value)

          // 分发值变化事件
          if ((table as any).dispatchEvent) {
            ;(table as any).dispatchEvent(EventTypes.CELL_VALUE_CHANGED, {
              cell,
              oldValue,
              newValue: value,
              column: cell.column,
              row: cell.row,
            })
          }

          // 分发编辑结束事件
          if ((table as any).dispatchEvent) {
            ;(table as any).dispatchEvent(EventTypes.CELL_EDIT_ENDED, {
              cell,
              oldValue,
              newValue: value,
              column: cell.column,
              row: cell.row,
            })
          }
        } catch (error) {
          // 分发验证失败事件
          if ((table as any).dispatchEvent) {
            ;(table as any).dispatchEvent(EventTypes.VALIDATION_FAILED, {
              error,
              cell,
              value,
              column: cell.column,
              row: cell.row,
            })
          }
          throw error
        }
      }
    }
  },
}

// 示例6: 错误处理和日志记录
const ErrorHandlingWithEvents = {
  createTable: <TData extends RowData>(table: Table<TData>): void => {
    if ((table as any).addEventListener) {
      // 监听错误事件
      ;(table as any).addEventListener(EventTypes.ERROR_OCCURRED, (event: any) => {
        const { error, context, ...additionalData } = event.data
        console.error(`表格错误 [${context}]:`, error, additionalData)

        // 可以在这里显示错误提示
        // 例如: showErrorNotification(error.message)

        // 可以在这里记录错误日志
        // 例如: logError(error, context, additionalData)
      })

      // 监听验证失败事件
      ;(table as any).addEventListener(EventTypes.VALIDATION_FAILED, (event: any) => {
        const { error, cell, value } = event.data
        console.warn(`验证失败 [单元格 ${cell.id}]:`, error)

        // 可以在这里显示验证错误提示
        // 例如: showValidationError(cell, error.message)
      })
    }
  },
}

// 示例7: 性能监控
const PerformanceMonitoringWithEvents = {
  createTable: <TData extends RowData>(table: Table<TData>): void => {
    if ((table as any).addEventListener) {
      // 监听所有事件来监控性能
      const eventTimings: Record<string, number[]> = {}

      ;(table as any).addEventListener('*', (event: any) => {
        const eventType = event.type
        const timestamp = event.timestamp

        if (!eventTimings[eventType]) {
          eventTimings[eventType] = []
        }

        eventTimings[eventType].push(timestamp)

        // 保持最近100个事件的时间戳
        if (eventTimings[eventType].length > 100) {
          eventTimings[eventType].shift()
        }

        // 计算事件频率
        const recentTimestamps = eventTimings[eventType].slice(-10)
        if (recentTimestamps.length >= 2) {
          const timeSpan =
            recentTimestamps.length >= 2
              ? recentTimestamps[recentTimestamps.length - 1] - recentTimestamps[0]
              : 0
          const frequency = (recentTimestamps.length - 1) / (timeSpan / 1000)

          if (frequency > 10) {
            // 如果事件频率超过10次/秒
            console.warn(`事件 ${eventType} 频率过高: ${frequency.toFixed(2)} 次/秒`)
          }
        }
      })

      // 监听性能相关事件
      ;(table as any).addEventListener(EventTypes.RENDER_COMPLETED, (event: any) => {
        const { renderTime } = event.data

        if (renderTime > 100) {
          // 如果渲染时间超过100ms
          console.warn(`渲染性能警告: 渲染耗时 ${renderTime}ms`)
        }
      })

      // 监听事件系统状态变化
      setInterval(() => {
        if ((table as any).getEventSystemState) {
          const state = (table as any).getEventSystemState()

          if (state.eventQueue.length > 50) {
            // 如果事件队列过长
            console.warn(`事件队列警告: 队列中有 ${state.eventQueue.length} 个待处理事件`)
          }

          if (state.averageProcessingTime > 50) {
            // 如果平均处理时间过长
            console.warn(`事件处理性能警告: 平均处理时间 ${state.averageProcessingTime}ms`)
          }
        }
      }, 5000) // 每5秒检查一次
    }
  },
}

// 综合示例：创建一个完整的事件驱动表格
const EventDrivenTable: TableFeature = {
  createTable: <TData extends RowData>(table: Table<TData>): void => {
    // 集成所有事件驱动的功能模块
    RowSelectionWithEvents.createTable(table)
    RowSortingWithEvents.createTable(table)
    ColumnFilteringWithEvents.createTable(table)
    RenderGridWithEvents.createTable(table)
    ErrorHandlingWithEvents.createTable(table)
    PerformanceMonitoringWithEvents.createTable(table)

    // 添加一些自定义业务逻辑事件
    if ((table as any).addEventListener) {
      // 监听数据加载完成事件
      ;(table as any).addEventListener(EventTypes.TABLE_DATA_CHANGED, (event: any) => {
        console.log('表格数据已更新')

        // 可以在这里触发数据统计
        // 例如: updateStatistics(table.getRowModel().rows)
      })

      // 监听表格初始化完成事件
      ;(table as any).addEventListener(EventTypes.TABLE_INITIALIZED, (event: any) => {
        console.log('事件驱动表格初始化完成')

        // 可以在这里执行一些初始化后的操作
        // 例如: loadUserPreferences(), restoreTableState()
      })
    }

    console.log('事件驱动表格已创建，所有事件监听器已注册')
  },

  createRow: <TData extends RowData>(row: Row<TData>, table: Table<TData>): void => {
    // 为行添加事件支持
    RowSelectionWithEvents.createRow(row, table)
    // 只有RowSelectionWithEvents有createRow方法
    RowSelectionWithEvents.createRow(row, table)

    // 可以在这里添加其他行级别的事件处理
  },

  createCell: <TData extends RowData>(
    cell: any,
    column: any,
    row: any,
    table: Table<TData>,
  ): void => {
    // 为单元格添加编辑事件支持
    CellEditingWithEvents.createCell(cell, column, row, table)

    // 可以在这里添加其他单元格级别的事件处理
  },
}

// 导出所有示例模块
export {
  RowSelectionWithEvents,
  RowSortingWithEvents,
  ColumnFilteringWithEvents,
  RenderGridWithEvents,
  CellEditingWithEvents,
  ErrorHandlingWithEvents,
  PerformanceMonitoringWithEvents,
  EventDrivenTable,
}
