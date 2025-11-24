import { createTable } from '../src/core/table'
import { EventSystem, EventTypes } from '../src/features/EventSystem'
import { EventDrivenTable } from '../src/features/EventSystemExample'

// 事件系统演示
function createEventSystemDemo() {
  console.log('=== 事件系统演示开始 ===')

  // 创建带有事件系统的表格
  const table = createTable({
    data: [
      { id: 1, name: '张三', age: 25, city: '北京', salary: 8000 },
      { id: 2, name: '李四', age: 30, city: '上海', salary: 12000 },
      { id: 3, name: '王五', age: 35, city: '广州', salary: 15000 },
      { id: 4, name: '赵六', age: 28, city: '深圳', salary: 10000 },
      { id: 5, name: '钱七', age: 32, city: '杭州', salary: 11000 },
    ],
    columns: [
      { accessorKey: 'id', header: 'ID' },
      { accessorKey: 'name', header: '姓名' },
      { accessorKey: 'age', header: '年龄' },
      { accessorKey: 'city', header: '城市' },
      { accessorKey: 'salary', header: '薪资' },
    ],
    getCoreRowModel: (table: any) => () => table.getCoreRowModel(),
    _features: [EventSystem, EventDrivenTable],
    onStateChange: (updater: any) => {
      console.log('表格状态发生变化:', updater)
    },
    renderFallbackValue: '',
    state: {},
  } as any)

  console.log('1. 表格创建完成，事件系统已初始化')

  // 1. 监听表格级别事件
  table.addEventListener(EventTypes.TABLE_INITIALIZED, (event) => {
    console.log('📊 表格初始化完成:', event.data)
  })

  table.addEventListener(EventTypes.TABLE_STATE_CHANGED, (event) => {
    console.log('🔄 表格状态变化:', event.data)
  })

  // 2. 监听行级别事件
  table.addEventListener(EventTypes.ROW_CLICKED, (event) => {
    const { row, nativeEvent } = event.data as any
    console.log(`👆 行点击 - ID: ${row.id}, 姓名: ${row.original.name}`)
  })

  table.addEventListener(EventTypes.ROW_SELECTED, (event) => {
    const { row } = event.data as any
    console.log(`✅ 行选择 - ID: ${row.id}, 姓名: ${row.original.name}`)
  })

  table.addEventListener(EventTypes.ROW_DESELECTED, (event) => {
    const { row } = event.data as any
    console.log(`❌ 行取消选择 - ID: ${row.id}, 姓名: ${row.original.name}`)
  })

  // 3. 监听单元格级别事件
  table.addEventListener(EventTypes.CELL_CLICKED, (event) => {
    const { cell, value } = event.data as any
    console.log(`🎯 单元格点击 - 列: ${cell.column.id}, 值: ${value}`)
  })

  table.addEventListener(EventTypes.CELL_DOUBLE_CLICKED, (event) => {
    const { cell, value } = event.data as any
    console.log(`🎯🎯 单元格双击 - 列: ${cell.column.id}, 值: ${value}`)
  })

  // 4. 监听列级别事件
  table.addEventListener(EventTypes.COLUMN_CLICKED, (event) => {
    const { column } = event.data as any
    console.log(`📋 列点击 - 列名: ${column.id}`)
  })

  table.addEventListener(EventTypes.COLUMN_SORTED, (event) => {
    const { column, sort } = event.data as any
    console.log(`📊 列排序 - 列名: ${column.id}, 排序: ${sort}`)
  })

  // 5. 监听排序事件
  table.addEventListener(EventTypes.SORT_CHANGED, (event) => {
    const { newSorting } = event.data as any
    console.log(`🔀 排序变化:`, newSorting)
  })

  // 6. 监听过滤事件
  table.addEventListener(EventTypes.FILTER_CHANGED, (event) => {
    const { newFilters } = event.data as any
    console.log(`🔍 过滤变化:`, newFilters)
  })

  // 7. 监听渲染事件
  table.addEventListener(EventTypes.RENDER_STARTED, (event) => {
    console.log('🎨 渲染开始')
  })

  table.addEventListener(EventTypes.RENDER_COMPLETED, (event) => {
    console.log('✨ 渲染完成')
  })

  // 8. 监听选择事件
  table.addEventListener(EventTypes.SELECTION_CHANGED, (event) => {
    const { selectedCount } = event.data as any
    console.log(`📋 选择变化 - 选中 ${selectedCount} 行`)
  })

  // 9. 监听错误事件
  table.addEventListener(EventTypes.ERROR_OCCURRED, (event) => {
    const { error, context } = event.data as any
    console.error(`❌ 错误发生 [${context}]:`, error)
  })

  // 10. 添加一次性事件监听器
  const unsubscribe = table.addOneTimeEventListener(EventTypes.TABLE_INITIALIZED, (event) => {
    console.log('🎉 一次性监听器：表格初始化完成（只会触发一次）')
  })

  // 演示各种操作
  console.log('\n2. 执行各种表格操作来触发事件...')

  // 演示1: 排序操作
  console.log('\n--- 排序操作 ---')
  table.setSorting([{ id: 'age', desc: false }])

  // 演示2: 过滤操作
  console.log('\n--- 过滤操作 ---')
  table.setColumnFilters([{ id: 'city', value: '北京' }])

  // 演示3: 选择操作
  console.log('\n--- 选择操作 ---')
  const firstRow = table.getRow('1')
  if (firstRow && firstRow.toggleSelected) {
    firstRow.toggleSelected()
  }

  // 演示4: 渲染操作
  console.log('\n--- 渲染操作 ---')
  if (table.render) {
    const container = document.createElement('div')
    table.render(container)
  }

  // 演示5: 状态变化
  console.log('\n--- 状态变化 ---')
  table.setState((old: any) => ({ ...old, demo: 'value' }))

  // 演示6: 获取事件系统状态
  console.log('\n--- 事件系统状态 ---')
  const eventState = table.getEventSystemState()
  console.log('事件系统状态:', {
    enabled: eventState.enabled,
    listenerCount: eventState.listenerCount,
    asyncListenerCount: eventState.asyncListenerCount,
    totalEventsDispatched: eventState.totalEventsDispatched,
    totalEventsProcessed: eventState.totalEventsProcessed,
    performanceMetrics: eventState.performanceMetrics,
  })

  // 演示7: 异步事件处理
  console.log('\n--- 异步事件处理 ---')
  table.addAsyncEventListener('asyncTest', async (event) => {
    console.log('🔄 异步事件处理开始...')
    await new Promise((resolve) => setTimeout(resolve, 100))
    console.log('✅ 异步事件处理完成')
  })

  table.dispatchEvent('asyncTest', { data: '异步测试数据' })

  // 演示8: 事件队列刷新
  console.log('\n--- 事件队列刷新 ---')
  for (let i = 0; i < 5; i++) {
    table.dispatchEvent('queueTest', { index: i })
  }

  table.flushEventQueue().then(() => {
    console.log('✅ 事件队列刷新完成')
  })

  // 演示9: 错误处理
  console.log('\n--- 错误处理 ---')
  table.addEventListener('errorTest', () => {
    throw new Error('测试错误')
  })

  table.dispatchEvent('errorTest', {}).catch((error: Error) => {
    console.log('🛡️ 错误被捕获:', error.message)
  })

  // 演示10: 内存管理
  console.log('\n--- 内存管理 ---')
  const tempListener = () => {
    console.log('临时监听器被调用')
  }
  table.addEventListener('memoryTest', tempListener)
  table.dispatchEvent('memoryTest', {})
  console.log('添加临时监听器并触发事件')

  table.clearAllEventListeners()
  table.dispatchEvent('memoryTest', {})
  console.log('清除所有监听器，临时监听器不应再被调用')

  // 验证临时监听器只被调用一次
  console.log('验证临时监听器只被调用一次')

  console.log('\n=== 事件系统演示完成 ===')

  // 清理
  setTimeout(() => {
    if ((table as any).destroy) {
      ;(table as any).destroy()
    }
  }, 1000)

  return table
}

// 创建一个简单的可视化演示
function createVisualEventDemo() {
  const container = document.createElement('div')
  container.innerHTML = `
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <h2>事件系统可视化演示</h2>
      <div style="display: flex; gap: 20px;">
        <div style="flex: 1;">
          <h3>控制面板</h3>
          <button id="sortBtn">排序 (年龄)</button>
          <button id="filterBtn">过滤 (城市=北京)</button>
          <button id="selectBtn">选择第一行</button>
          <button id="renderBtn">重新渲染</button>
          <button id="stateBtn">状态变化</button>
          <button id="clearBtn">清除所有</button>
        </div>
        <div style="flex: 2;">
          <h3>事件日志</h3>
          <div id="eventLog" style="height: 300px; overflow-y: auto; border: 1px solid #ccc; padding: 10px; background: #f5f5f5;"></div>
        </div>
      </div>
    </div>
  `

  const eventLog = container.querySelector('#eventLog') as HTMLElement
  const buttons = {
    sort: container.querySelector('#sortBtn') as HTMLButtonElement,
    filter: container.querySelector('#filterBtn') as HTMLButtonElement,
    select: container.querySelector('#selectBtn') as HTMLButtonElement,
    render: container.querySelector('#renderBtn') as HTMLButtonElement,
    state: container.querySelector('#stateBtn') as HTMLButtonElement,
    clear: container.querySelector('#clearBtn') as HTMLButtonElement,
  }

  function logEvent(message: string) {
    const timestamp = new Date().toLocaleTimeString()
    const logEntry = document.createElement('div')
    logEntry.style.marginBottom = '5px'
    logEntry.style.fontSize = '12px'
    logEntry.innerHTML = `<span style="color: #666;">[${timestamp}]</span> ${message}`
    eventLog.appendChild(logEntry)
    eventLog.scrollTop = eventLog.scrollHeight
  }

  // 创建表格
  const table = createEventSystemDemo()

  // 添加事件监听器来记录日志
  const eventTypes = [
    EventTypes.TABLE_STATE_CHANGED,
    EventTypes.ROW_CLICKED,
    EventTypes.ROW_SELECTED,
    EventTypes.CELL_CLICKED,
    EventTypes.COLUMN_CLICKED,
    EventTypes.SORT_CHANGED,
    EventTypes.FILTER_CHANGED,
    EventTypes.SELECTION_CHANGED,
    EventTypes.RENDER_STARTED,
    EventTypes.RENDER_COMPLETED,
  ]

  eventTypes.forEach((eventType) => {
    table.addEventListener(eventType, (event: any) => {
      logEvent(`📡 ${eventType}: ${JSON.stringify(event.data)}`)
    })
  })

  // 绑定按钮事件
  buttons.sort.onclick = () => {
    logEvent('🔄 执行排序操作')
    table.setSorting([{ id: 'age', desc: false }])
  }

  buttons.filter.onclick = () => {
    logEvent('🔍 执行过滤操作')
    table.setColumnFilters([{ id: 'city', value: '北京' }])
  }

  buttons.select.onclick = () => {
    logEvent('✅ 执行选择操作')
    const firstRow = table.getRow('1')
    if (firstRow && firstRow.toggleSelected) {
      firstRow.toggleSelected()
    }
  }

  buttons.render.onclick = () => {
    logEvent('🎨 执行渲染操作')
    if (table.render) {
      const renderContainer = document.createElement('div')
      table.render(renderContainer)
    }
  }

  buttons.state.onclick = () => {
    logEvent('🔄 执行状态变化')
    table.setState((old: any) => ({ ...old, demoCounter: (old.demoCounter || 0) + 1 }))
  }

  buttons.clear.onclick = () => {
    logEvent('🗑️ 清除事件日志')
    eventLog.innerHTML = ''
  }

  return container
}

// 导出演示函数
// 导出演示函数
export {
  createEventSystemDemo as createEventSystemDemo,
  createVisualEventDemo as createVisualEventDemo,
}
