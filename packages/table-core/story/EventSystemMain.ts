import {
  createColumnHelper,
  getCoreRowModel,
  flexRender,
  useTable,
  TableOptionsResolved,
  createTable,
} from '../src'
import { EventSystem, EventTypes } from '../src/features/EventSystem'
import { EventDrivenTable } from '../src/features/EventSystemExample'

type Person = {
  firstName: string
  lastName: string
  age: number
  visits: number
  status: string
  progress: number
}

const data: Person[] = [
  {
    firstName: 'tanner',
    lastName: 'linsley',
    age: 24,
    visits: 100,
    status: 'In Relationship',
    progress: 50,
  },
  {
    firstName: 'tandy',
    lastName: 'miller',
    age: 40,
    visits: 40,
    status: 'Single',
    progress: 80,
  },
  {
    firstName: 'joe',
    lastName: 'dirte',
    age: 45,
    visits: 20,
    status: 'Complicated',
    progress: 10,
  },
]

const columnHelper = createColumnHelper<Person>()

const columns = [
  columnHelper.accessor('firstName', {
    cell: (info) => info.getValue(),
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor((row) => row.lastName, {
    id: 'lastName',
    cell: (info) => `<i>${info.getValue()}</i>`,
    header: () => '<span>Last Name</span>',
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor('age', {
    header: () => 'Age',
    cell: (info) => info.renderValue(),
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor('visits', {
    header: () => '<span>Visits</span>',
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    footer: (info) => info.column.id,
  }),
  columnHelper.accessor('progress', {
    header: 'Profile Progress',
    footer: (info) => info.column.id,
  }),
]

// 创建带有事件系统的表格
console.log('=== 事件系统演示 ===')

const resolvedOptions: TableOptionsResolved<Person> = {
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  state: {}, // Dummy state
  onStateChange: (updater) => {
    console.log('状态更新:', updater)
  },
  renderFallbackValue: null,
  _features: [EventSystem, EventDrivenTable], // 添加事件系统功能
}

// 创建表格
const table = createTable<Person>(resolvedOptions)

// 添加事件监听器
table.addEventListener(EventTypes.TABLE_INITIALIZED, (event: any) => {
  console.log('🎉 表格初始化完成！')
})

table.addEventListener(EventTypes.TABLE_STATE_CHANGED, (event: any) => {
  console.log('🔄 表格状态发生变化')
})

table.addEventListener(EventTypes.ROW_CLICKED, (event: any) => {
  const { row } = event.data
  console.log(`👆 行点击 - ID: ${row.id}, 姓名: ${row.original.firstName} ${row.original.lastName}`)
})

table.addEventListener(EventTypes.CELL_CLICKED, (event: any) => {
  const { cell, value } = event.data
  console.log(`🎯 单元格点击 - 列: ${cell.column.id}, 值: ${value}`)
})

table.addEventListener(EventTypes.COLUMN_CLICKED, (event: any) => {
  const { column } = event.data
  console.log(`📋 列点击 - 列名: ${column.id}`)
})

table.addEventListener(EventTypes.SORT_CHANGED, (event: any) => {
  const { newSorting } = event.data
  console.log(`🔀 排序变化:`, newSorting)
})

table.addEventListener(EventTypes.FILTER_CHANGED, (event: any) => {
  const { newFilters } = event.data
  console.log(`🔍 过滤变化:`, newFilters)
})

table.addEventListener(EventTypes.SELECTION_CHANGED, (event: any) => {
  const { selectedCount } = event.data
  console.log(`📋 选择变化 - 选中 ${selectedCount} 行`)
})

table.addEventListener(EventTypes.RENDER_STARTED, (event: any) => {
  console.log('🎨 渲染开始')
})

table.addEventListener(EventTypes.RENDER_COMPLETED, (event: any) => {
  console.log('✨ 渲染完成')
})

// 渲染表格
console.log('渲染表格...')
table.render(document.querySelector('#app') as HTMLElement)

console.log('✅ 表格渲染完成，事件监听器已激活')

// 演示各种操作
console.log('\n=== 执行演示操作 ===')

setTimeout(() => {
  console.log('\n1. 执行排序操作...')
  table.setSorting([{ id: 'age', desc: false }])
}, 1000)

setTimeout(() => {
  console.log('\n2. 执行过滤操作...')
  table.setColumnFilters([{ id: 'status', value: 'Single' }])
}, 2000)

setTimeout(() => {
  console.log('\n3. 执行选择操作...')
  const firstRow = table.getRow('0') // 获取第一行
  if (firstRow && firstRow.toggleSelected) {
    firstRow.toggleSelected()
  }
}, 3000)

setTimeout(() => {
  console.log('\n4. 执行状态变化...')
  table.setState((old: any) => ({ ...old, demoTime: Date.now() }))
}, 4000)

setTimeout(() => {
  console.log('\n5. 获取事件系统状态...')
  const eventState = table.getEventSystemState()
  console.log('事件系统统计:', {
    监听器数量: eventState.listenerCount,
    异步监听器: eventState.asyncListenerCount,
    已分发事件: eventState.totalEventsDispatched,
    已处理事件: eventState.totalEventsProcessed,
    平均处理时间: eventState.performanceMetrics.averageProcessingTime.toFixed(2) + 'ms',
  })
}, 5000)

setTimeout(() => {
  console.log('\n=== 演示完成 ===')
  console.log('事件系统功能演示结束，展示了分层事件架构的强大功能。')
  console.log('包括：全局事件服务、本地事件服务、异步处理、性能监控等。')
}, 6000)

// 创建可视化事件演示
const demoContainer = document.createElement('div')
demoContainer.style.marginTop = '20px'
demoContainer.style.borderTop = '2px solid #ccc'
demoContainer.style.paddingTop = '20px'
document.body.appendChild(demoContainer)

// 导入可视化演示（简化版本）
const eventLog = document.createElement('div')
eventLog.id = 'eventLog'
eventLog.style.height = '200px'
eventLog.style.overflowY = 'auto'
eventLog.style.border = '1px solid #ccc'
eventLog.style.padding = '10px'
eventLog.style.background = '#f5f5f5'
eventLog.style.fontFamily = 'monospace'
eventLog.style.fontSize = '12px'

const logTitle = document.createElement('h3')
logTitle.textContent = '事件日志'
demoContainer.appendChild(logTitle)
demoContainer.appendChild(eventLog)

function logEvent(message: string) {
  const timestamp = new Date().toLocaleTimeString()
  const logEntry = document.createElement('div')
  logEntry.style.marginBottom = '3px'
  logEntry.innerHTML = `<span style="color: #666;">[${timestamp}]</span> ${message}`
  eventLog.appendChild(logEntry)
  eventLog.scrollTop = eventLog.scrollHeight
}

// 为现有事件监听器添加日志记录
const originalListeners = [
  { event: EventTypes.TABLE_INITIALIZED, message: '🎉 表格初始化完成' },
  { event: EventTypes.TABLE_STATE_CHANGED, message: '🔄 状态变化' },
  { event: EventTypes.ROW_CLICKED, message: '👆 行点击事件' },
  { event: EventTypes.CELL_CLICKED, message: '🎯 单元格点击事件' },
  { event: EventTypes.COLUMN_CLICKED, message: '📋 列点击事件' },
  { event: EventTypes.SORT_CHANGED, message: '🔀 排序变化' },
  { event: EventTypes.FILTER_CHANGED, message: '🔍 过滤变化' },
  { event: EventTypes.SELECTION_CHANGED, message: '📋 选择变化' },
  { event: EventTypes.RENDER_STARTED, message: '🎨 渲染开始' },
  { event: EventTypes.RENDER_COMPLETED, message: '✨ 渲染完成' },
]

originalListeners.forEach(({ event, message }) => {
  table.addEventListener(event, () => {
    logEvent(message)
  })
})

console.log('🎮 可视化事件演示已添加到页面底部')
