import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createTable } from '../src/core/table'
import { EventSystem, EventTypes, EventPriorities, EventPhases } from '../src/features/EventSystem'
import { EventDrivenTable } from '../src/features/EventSystemExample'

// 测试数据
const testData = [
  { id: 1, name: '张三', age: 25, city: '北京' },
  { id: 2, name: '李四', age: 30, city: '上海' },
  { id: 3, name: '王五', age: 35, city: '广州' },
  { id: 4, name: '赵六', age: 28, city: '深圳' },
  { id: 5, name: '钱七', age: 32, city: '杭州' },
]

describe('EventSystem', () => {
  let table: any
  let consoleSpy: any

  beforeEach(() => {
    // 创建带有事件系统的表格
    table = createTable({
      data: testData,
      columns: [
        { accessorKey: 'id', header: 'ID' },
        { accessorKey: 'name', header: '姓名' },
        { accessorKey: 'age', header: '年龄' },
        { accessorKey: 'city', header: '城市' },
      ],
      getCoreRowModel: (table: any) => () => table.getCoreRowModel(),
      _features: [EventSystem, EventDrivenTable],
      onStateChange: vi.fn(),
      renderFallbackValue: null,
      state: {},
    })

    // 监听控制台输出
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    }
  })

  afterEach(() => {
    // 恢复控制台
    Object.values(consoleSpy).forEach((spy: any) => spy.mockRestore())

    // 清理表格
    if (table.destroy) {
      table.destroy()
    }
  })

  describe('基本事件功能', () => {
    it('应该能够添加和触发事件监听器', async () => {
      const listener = vi.fn()

      // 添加事件监听器
      const unsubscribe = table.addEventListener(EventTypes.TABLE_INITIALIZED, listener)

      // 手动触发初始化事件
      await table.dispatchEvent(EventTypes.TABLE_INITIALIZED, { test: 'data' })

      // 验证监听器被调用
      expect(listener).toHaveBeenCalledTimes(1)
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventTypes.TABLE_INITIALIZED,
          data: { test: 'data' },
        }),
      )

      // 取消订阅
      unsubscribe()

      // 再次触发事件
      await table.dispatchEvent(EventTypes.TABLE_INITIALIZED, { test: 'data2' })

      // 验证监听器不再被调用
      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('应该支持一次性事件监听器', async () => {
      const listener = vi.fn()

      // 添加一次性事件监听器
      table.addOneTimeEventListener(EventTypes.TABLE_STATE_CHANGED, listener)

      // 触发状态变化
      table.setState((old: any) => ({ ...old, test: 'value1' }))
      await new Promise((resolve) => setTimeout(resolve, 10))

      // 验证监听器被调用一次
      expect(listener).toHaveBeenCalledTimes(1)

      // 再次触发状态变化
      table.setState((old: any) => ({ ...old, test: 'value2' }))
      await new Promise((resolve) => setTimeout(resolve, 10))

      // 验证监听器仍然只被调用一次
      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('应该支持异步事件监听器', async () => {
      let asyncCompleted = false

      // 添加异步事件监听器
      table.addAsyncEventListener(EventTypes.TABLE_INITIALIZED, async (event: any) => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        asyncCompleted = true
      })

      // 触发事件
      await table.dispatchEvent(EventTypes.TABLE_INITIALIZED)

      expect(asyncCompleted).toBe(false)

      // 等待异步操作完成
      await new Promise((resolve) => setTimeout(resolve, 20))

      // 验证异步操作完成
      expect(asyncCompleted).toBe(true)
    })
  })

  //   describe('行事件', () => {
  //     it('应该能够处理行点击事件', async () => {
  //       const row = table.getRow('1')
  //       const listener = vi.fn()

  //       // 添加行点击事件监听器
  //       table.addEventListener(EventTypes.ROW_CLICKED, listener)

  //       // 模拟行点击
  //       if (row.dispatchRowEvent) {
  //         await row.dispatchRowEvent(EventTypes.ROW_CLICKED, { nativeEvent: { ctrlKey: false } })
  //       }

  //       // 验证事件被触发
  //       expect(listener).toHaveBeenCalledTimes(1)
  //       expect(listener).toHaveBeenCalledWith(
  //         expect.objectContaining({
  //           type: EventTypes.ROW_CLICKED,
  //           data: expect.objectContaining({
  //             row: row,
  //             rowId: '1',
  //           }),
  //         }),
  //       )
  //     })

  //     it('应该能够处理行选择事件', async () => {
  //       const row = table.getRow('1')
  //       const listener = vi.fn()

  //       // 添加行选择事件监听器
  //       table.addEventListener(EventTypes.ROW_SELECTED, listener)

  //       // 选择行
  //       row.toggleSelected()
  //       await new Promise((resolve) => setTimeout(resolve, 10))

  //       // 验证事件被触发
  //       expect(listener).toHaveBeenCalledTimes(1)
  //       expect(listener).toHaveBeenCalledWith(
  //         expect.objectContaining({
  //           type: EventTypes.ROW_SELECTED,
  //           data: expect.objectContaining({
  //             row: row,
  //             rowId: '1',
  //             selected: true,
  //           }),
  //         }),
  //       )
  //     })
  //   })

  //   describe('单元格事件', () => {
  //     it('应该能够处理单元格点击事件', async () => {
  //       const cell = table.getRow('1').getAllCells()[0]
  //       const listener = vi.fn()

  //       // 添加单元格点击事件监听器
  //       table.addEventListener(EventTypes.CELL_CLICKED, listener)

  //       // 模拟单元格点击
  //       if (cell.dispatchCellEvent) {
  //         await cell.dispatchCellEvent(EventTypes.CELL_CLICKED, { nativeEvent: {} })
  //       }

  //       // 验证事件被触发
  //       expect(listener).toHaveBeenCalledTimes(1)
  //       expect(listener).toHaveBeenCalledWith(
  //         expect.objectContaining({
  //           type: EventTypes.CELL_CLICKED,
  //           data: expect.objectContaining({
  //             cell: cell,
  //             value: cell.getValue(),
  //           }),
  //         }),
  //       )
  //     })
  //   })

  //   describe('列事件', () => {
  //     it('应该能够处理列点击事件', async () => {
  //       const column = table.getColumn('name')
  //       const listener = vi.fn()

  //       // 添加列点击事件监听器
  //       table.addEventListener(EventTypes.COLUMN_CLICKED, listener)

  //       // 模拟列点击
  //       if (column.dispatchColumnEvent) {
  //         await column.dispatchColumnEvent(EventTypes.COLUMN_CLICKED, { nativeEvent: {} })
  //       }

  //       // 验证事件被触发
  //       expect(listener).toHaveBeenCalledTimes(1)
  //       expect(listener).toHaveBeenCalledWith(
  //         expect.objectContaining({
  //           type: EventTypes.COLUMN_CLICKED,
  //           data: expect.objectContaining({
  //             column: column,
  //             columnId: 'name',
  //           }),
  //         }),
  //       )
  //     })
  //   })

  //   describe('排序事件', () => {
  //     it('应该能够处理排序变化事件', async () => {
  //       const listener = vi.fn()

  //       // 添加排序变化事件监听器
  //       table.addEventListener(EventTypes.SORT_CHANGED, listener)

  //       // 设置排序
  //       table.setSorting([{ id: 'age', desc: false }])
  //       await new Promise((resolve) => setTimeout(resolve, 10))

  //       // 验证事件被触发
  //       expect(listener).toHaveBeenCalledTimes(1)
  //       expect(listener).toHaveBeenCalledWith(
  //         expect.objectContaining({
  //           type: EventTypes.SORT_CHANGED,
  //           data: expect.objectContaining({
  //             newSorting: expect.arrayContaining([
  //               expect.objectContaining({ id: 'age', desc: false }),
  //             ]),
  //           }),
  //         }),
  //       )
  //     })
  //   })

  //   describe('过滤事件', () => {
  //     it('应该能够处理过滤变化事件', async () => {
  //       const listener = vi.fn()

  //       // 添加过滤变化事件监听器
  //       table.addEventListener(EventTypes.FILTER_CHANGED, listener)

  //       // 设置过滤
  //       table.setColumnFilters([{ id: 'city', value: '北京' }])
  //       await new Promise((resolve) => setTimeout(resolve, 10))

  //       // 验证事件被触发
  //       expect(listener).toHaveBeenCalledTimes(1)
  //       expect(listener).toHaveBeenCalledWith(
  //         expect.objectContaining({
  //           type: EventTypes.FILTER_CHANGED,
  //           data: expect.objectContaining({
  //             newFilters: expect.arrayContaining([
  //               expect.objectContaining({ id: 'city', value: '北京' }),
  //             ]),
  //           }),
  //         }),
  //       )
  //     })
  //   })

  //   describe('渲染事件', () => {
  //     it('应该能够处理渲染事件', async () => {
  //       const startListener = vi.fn()
  //       const completeListener = vi.fn()

  //       // 添加渲染事件监听器
  //       table.addEventListener(EventTypes.RENDER_STARTED, startListener)
  //       table.addEventListener(EventTypes.RENDER_COMPLETED, completeListener)

  //       // 触发渲染
  //       if (table.render) {
  //         table.render(document.createElement('div'))
  //       }

  //       // 等待事件处理
  //       await new Promise((resolve) => setTimeout(resolve, 10))

  //       // 验证事件被触发
  //       expect(startListener).toHaveBeenCalledTimes(1)
  //       expect(completeListener).toHaveBeenCalledTimes(1)
  //     })
  //   })

  //   describe('错误处理', () => {
  //     it('应该能够处理事件监听器中的错误', async () => {
  //       const errorListener = vi.fn()
  //       const normalListener = vi.fn()

  //       // 添加会抛出错误的事件监听器
  //       table.addEventListener(EventTypes.TABLE_INITIALIZED, () => {
  //         throw new Error('测试错误')
  //       })

  //       // 添加正常的事件监听器
  //       table.addEventListener(EventTypes.TABLE_INITIALIZED, normalListener)

  //       // 触发事件 - 不应该抛出错误
  //       await expect(table.dispatchEvent(EventTypes.TABLE_INITIALIZED)).resolves.not.toThrow()

  //       // 验证正常监听器仍然被调用
  //       expect(normalListener).toHaveBeenCalledTimes(1)
  //     })
  //   })

  //   describe('性能监控', () => {
  //     it('应该提供事件系统状态', () => {
  //       const state = table.getEventSystemState()

  //       expect(state).toHaveProperty('enabled')
  //       expect(state).toHaveProperty('listenerCount')
  //       expect(state).toHaveProperty('asyncListenerCount')
  //       expect(state).toHaveProperty('totalEventsDispatched')
  //       expect(state).toHaveProperty('totalEventsProcessed')
  //       expect(state).toHaveProperty('performanceMetrics')
  //     })

  //     it('应该能够启用和禁用事件系统', () => {
  //       const listener = vi.fn()

  //       // 添加事件监听器
  //       table.addEventListener(EventTypes.TABLE_INITIALIZED, listener)

  //       // 禁用事件系统
  //       table.setEventSystemEnabled(false)

  //       // 触发事件
  //       table.dispatchEvent(EventTypes.TABLE_INITIALIZED)

  //       // 验证监听器没有被调用
  //       expect(listener).not.toHaveBeenCalled()

  //       // 启用事件系统
  //       table.setEventSystemEnabled(true)

  //       // 触发事件
  //       table.dispatchEvent(EventTypes.TABLE_INITIALIZED)

  //       // 验证监听器被调用
  //       expect(listener).toHaveBeenCalledTimes(1)
  //     })
  //   })

  //   describe('事件队列', () => {
  //     it('应该能够刷新事件队列', async () => {
  //       const listener = vi.fn()

  //       // 添加事件监听器
  //       table.addEventListener(EventTypes.TABLE_INITIALIZED, listener)

  //       // 触发多个事件
  //       for (let i = 0; i < 5; i++) {
  //         table.dispatchEvent(EventTypes.TABLE_INITIALIZED, { index: i })
  //       }

  //       // 刷新事件队列
  //       await table.flushEventQueue()

  //       // 验证所有事件都被处理
  //       expect(listener).toHaveBeenCalledTimes(5)
  //     })
  //   })

  //   describe('内存管理', () => {
  //     it('应该能够清除所有事件监听器', () => {
  //       const listener1 = vi.fn()
  //       const listener2 = vi.fn()

  //       // 添加多个事件监听器
  //       table.addEventListener(EventTypes.TABLE_INITIALIZED, listener1)
  //       table.addEventListener(EventTypes.TABLE_STATE_CHANGED, listener2)

  //       // 清除所有监听器
  //       table.clearAllEventListeners()

  //       // 触发事件
  //       table.dispatchEvent(EventTypes.TABLE_INITIALIZED)
  //       table.setState((old: any) => ({ ...old, test: 'value' }))

  //       // 验证监听器没有被调用
  //       expect(listener1).not.toHaveBeenCalled()
  //       expect(listener2).not.toHaveBeenCalled()
  //     })
  //   })

  //   describe('事件优先级', () => {
  //     it('应该支持不同优先级的事件', async () => {
  //       const executionOrder: string[] = []

  //       // 添加不同优先级的事件监听器
  //       table.addEventListener(EventTypes.TABLE_INITIALIZED, () => executionOrder.push('normal'), {
  //         priority: EventPriorities.NORMAL,
  //       })

  //       table.addEventListener(EventTypes.TABLE_INITIALIZED, () => executionOrder.push('high'), {
  //         priority: EventPriorities.HIGH,
  //       })

  //       table.addEventListener(EventTypes.TABLE_INITIALIZED, () => executionOrder.push('low'), {
  //         priority: EventPriorities.LOW,
  //       })

  //       // 触发事件
  //       await table.dispatchEvent(EventTypes.TABLE_INITIALIZED)

  //       // 验证执行顺序（高优先级先执行）
  //       expect(executionOrder).toEqual(['high', 'normal', 'low'])
  //     })
  //   })

  //   describe('事件传播', () => {
  //     it('应该支持事件冒泡', async () => {
  //       const localListener = vi.fn()
  //       const globalListener = vi.fn()

  //       const row = table.getRow('1')

  //       // 添加全局事件监听器
  //       table.addEventListener(EventTypes.ROW_CLICKED, globalListener)

  //       // 添加行本地事件监听器
  //       if (row.addRowEventListener) {
  //         row.addRowEventListener(EventTypes.ROW_CLICKED, localListener)
  //       }

  //       // 触发行点击事件
  //       if (row.dispatchRowEvent) {
  //         await row.dispatchRowEvent(EventTypes.ROW_CLICKED, { test: 'data' })
  //       }

  //       // 验证本地和全局监听器都被调用
  //       expect(localListener).toHaveBeenCalledTimes(1)
  //       expect(globalListener).toHaveBeenCalledTimes(1)
  //     })
  //   })

  //   describe('自定义事件', () => {
  //     it('应该支持自定义事件类型', async () => {
  //       const listener = vi.fn()
  //       const customEventType = 'customBusinessEvent'

  //       // 添加自定义事件监听器
  //       table.addEventListener(customEventType, listener)

  //       // 触发自定义事件
  //       await table.dispatchEvent(customEventType, { customData: 'test' })

  //       // 验证监听器被调用
  //       expect(listener).toHaveBeenCalledTimes(1)
  //       expect(listener).toHaveBeenCalledWith(
  //         expect.objectContaining({
  //           type: customEventType,
  //           data: { customData: 'test' },
  //         }),
  //       )
  //     })
  //   })

  //   describe('事件数据完整性', () => {
  //     it('应该包含完整的事件信息', async () => {
  //       const listener = vi.fn()

  //       table.addEventListener(EventTypes.TABLE_INITIALIZED, listener)

  //       await table.dispatchEvent(EventTypes.TABLE_INITIALIZED, { test: 'data' })

  //       const event = listener.mock.calls[0]?.[0]

  //       // 验证事件对象包含所有必要属性
  //       expect(event).toHaveProperty('type', EventTypes.TABLE_INITIALIZED)
  //       expect(event).toHaveProperty('data', { test: 'data' })
  //       expect(event).toHaveProperty('timestamp')
  //       expect(event).toHaveProperty('priority')
  //       expect(event).toHaveProperty('phase')
  //       expect(event).toHaveProperty('bubbles')
  //       expect(event).toHaveProperty('cancelable')
  //       expect(event).toHaveProperty('defaultPrevented')
  //       expect(event).toHaveProperty('propagationStopped')
  //       expect(event).toHaveProperty('path')
  //       expect(event).toHaveProperty('target')
  //       expect(event).toHaveProperty('currentTarget')
  //     })
  //   })
  // })

  // describe('EventSystem 性能测试', () => {
  //   let table: any

  //   beforeEach(() => {
  //     table = createTable({
  //       data: Array.from({ length: 1000 }, (_, i) => ({
  //         id: i + 1,
  //         name: `用户${i + 1}`,
  //         age: 20 + (i % 50),
  //         city: ['北京', '上海', '广州', '深圳'][i % 4],
  //       })),
  //       columns: [
  //         { accessorKey: 'id', header: 'ID' },
  //         { accessorKey: 'name', header: '姓名' },
  //         { accessorKey: 'age', header: '年龄' },
  //         { accessorKey: 'city', header: '城市' },
  //       ],
  //       getCoreRowModel: (table: any) => () => table.getCoreRowModel(),
  //       _features: [EventSystem],
  //       onStateChange: vi.fn(),
  //     })
  //   })

  //   afterEach(() => {
  //     if (table.destroy) {
  //       table.destroy()
  //     }
  //   })

  //   it('应该能够高效处理大量事件', async () => {
  //     const listener = vi.fn()
  //     const eventCount = 1000

  //     // 添加事件监听器
  //     table.addEventListener(EventTypes.TABLE_INITIALIZED, listener)

  //     const startTime = performance.now()

  //     // 触发大量事件
  //     const promises = []
  //     for (let i = 0; i < eventCount; i++) {
  //       promises.push(table.dispatchEvent(EventTypes.TABLE_INITIALIZED, { index: i }))
  //     }

  //     await Promise.all(promises)

  //     const endTime = performance.now()
  //     const totalTime = endTime - startTime

  //     // 验证所有事件都被处理
  //     expect(listener).toHaveBeenCalledTimes(eventCount)

  //     // 验证性能（每个事件处理时间应该小于1ms）
  //     const avgTimePerEvent = totalTime / eventCount
  //     expect(avgTimePerEvent).toBeLessThan(1)

  //     console.log(
  //       `处理了 ${eventCount} 个事件，总耗时: ${totalTime.toFixed(2)}ms，平均每个事件: ${avgTimePerEvent.toFixed(4)}ms`,
  //     )
  //   })

  //   it('应该能够高效处理大量监听器', async () => {
  //     const listenerCount = 100
  //     const listeners = []

  //     // 添加大量事件监听器
  //     for (let i = 0; i < listenerCount; i++) {
  //       const listener = vi.fn()
  //       listeners.push(listener)
  //       table.addEventListener(EventTypes.TABLE_INITIALIZED, listener)
  //     }

  //     const startTime = performance.now()

  //     // 触发事件
  //     await table.dispatchEvent(EventTypes.TABLE_INITIALIZED, { test: 'data' })

  //     const endTime = performance.now()
  //     const totalTime = endTime - startTime

  //     // 验证所有监听器都被调用
  //     listeners.forEach((listener) => {
  //       expect(listener).toHaveBeenCalledTimes(1)
  //     })

  //     // 验证性能（处理100个监听器应该小于10ms）
  //     expect(totalTime).toBeLessThan(10)

  //     console.log(`调用了 ${listenerCount} 个监听器，总耗时: ${totalTime.toFixed(2)}ms`)
  //   })
  // })

  // describe('EventSystem 集成测试', () => {
  //   it('应该能够与其他表格功能协同工作', () => {
  //     const table = createTable({
  //       data: testData,
  //       columns: [
  //         { accessorKey: 'id', header: 'ID' },
  //         { accessorKey: 'name', header: '姓名' },
  //         { accessorKey: 'age', header: '年龄' },
  //         { accessorKey: 'city', header: '城市' },
  //       ],
  //       getCoreRowModel: (table: any) => () => table.getCoreRowModel(),
  //       _features: [EventSystem, EventDrivenTable],
  //       onStateChange: vi.fn(),
  //       initialState: {
  //         sorting: [{ id: 'age', desc: false }],
  //         columnFilters: [{ id: 'city', value: '北京' }],
  //         rowSelection: { '1': true },
  //       },
  //     })

  //     // 验证事件系统与其他功能集成
  //     expect(table.eventService).toBeDefined()
  //     expect(table.addEventListener).toBeDefined()
  //     expect(table.dispatchEvent).toBeDefined()
  //     expect(table.getEventSystemState).toBeDefined()

  //     // 验证其他功能正常工作
  //     expect(table.getSortedRowModel).toBeDefined()
  //     expect(table.getFilteredRowModel).toBeDefined()
  //     expect(table.getSelectedRowModel).toBeDefined()

  //     // 清理
  //     if ((table as any).destroy) {
  //       ;(table as any).destroy()
  //     }
  //   })

  //   it('应该能够在表格销毁时正确清理', () => {
  //     const table = createTable({
  //       data: testData,
  //       columns: [
  //         { accessorKey: 'id', header: 'ID' },
  //         { accessorKey: 'name', header: '姓名' },
  //       ],
  //       getCoreRowModel: (table: any) => () => table.getCoreRowModel(),
  //       _features: [EventSystem],
  //       onStateChange: vi.fn(),
  //     })

  //     const listener = vi.fn()
  //     table.addEventListener(EventTypes.TABLE_INITIALIZED, listener)

  //     // 销毁表格
  //     if ((table as any).destroy) {
  //       ;(table as any).destroy()
  //     }

  //     // 尝试触发事件（应该不会产生错误）
  //     expect(() => table.dispatchEvent(EventTypes.TABLE_INITIALIZED)).not.toThrow()
  //   })
})
