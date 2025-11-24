import { RowData, Table, TableFeature, TableState, Row, Column, Cell } from '../types'

// 事件类型常量
const EventTypes = {
  // 表格级别事件
  TABLE_INITIALIZED: 'tableInitialized',
  TABLE_DESTROYED: 'tableDestroyed',
  TABLE_STATE_CHANGED: 'tableStateChanged',
  TABLE_DATA_CHANGED: 'tableDataChanged',
  TABLE_MOUNTED: 'tableOnMounted',

  // 行级别事件
  ROW_CLICKED: 'rowClicked',
  ROW_DOUBLE_CLICKED: 'rowDoubleClicked',
  ROW_SELECTED: 'rowSelected',
  ROW_DESELECTED: 'rowDeselected',
  ROW_EXPANDED: 'rowExpanded',
  ROW_COLLAPSED: 'rowCollapsed',
  ROW_ADDED: 'rowAdded',
  ROW_REMOVED: 'rowRemoved',
  ROW_UPDATED: 'rowUpdated',

  // 单元格级别事件
  CELL_CLICKED: 'cellClicked',
  CELL_DOUBLE_CLICKED: 'cellDoubleClicked',
  CELL_FOCUSED: 'cellFocused',
  CELL_BLURRED: 'cellBlurred',
  CELL_EDIT_STARTED: 'cellEditStarted',
  CELL_EDIT_ENDED: 'cellEditEnded',
  CELL_VALUE_CHANGED: 'cellValueChanged',

  // 列级别事件
  COLUMN_CLICKED: 'columnClicked',
  COLUMN_SORTED: 'columnSorted',
  COLUMN_FILTERED: 'columnFiltered',
  COLUMN_RESIZED: 'columnResized',
  COLUMN_REORDERED: 'columnReordered',
  COLUMN_PINNED: 'columnPinned',
  COLUMN_UNPINNED: 'columnUnpinned',
  COLUMN_VISIBILITY_CHANGED: 'columnVisibilityChanged',

  // 滚动事件
  SCROLL_STARTED: 'scrollStarted',
  SCROLL_ENDED: 'scrollEnded',
  SCROLL_POSITION_CHANGED: 'scrollPositionChanged',
  VISIBLE_RANGE_CHANGED: 'visibleRangeChanged',

  // 渲染事件
  RENDER_STARTED: 'renderStarted',
  RENDER_COMPLETED: 'renderCompleted',
  VIRTUAL_SCROLL_UPDATED: 'virtualScrollUpdated',

  // 选择事件
  SELECTION_CHANGED: 'selectionChanged',
  SELECTION_CLEARED: 'selectionCleared',
  ALL_ROWS_SELECTED: 'allRowsSelected',
  ALL_ROWS_DESELECTED: 'allRowsDeselected',

  // 过滤事件
  FILTER_CHANGED: 'filterChanged',
  FILTER_CLEARED: 'filterCleared',
  FILTER_APPLIED: 'filterApplied',

  // 排序事件
  SORT_CHANGED: 'sortChanged',
  SORT_CLEARED: 'sortCleared',
  SORT_APPLIED: 'sortApplied',

  // 分页事件
  PAGE_CHANGED: 'pageChanged',
  PAGE_SIZE_CHANGED: 'pageSizeChanged',

  // 分组事件
  GROUP_EXPANDED: 'groupExpanded',
  GROUP_COLLAPSED: 'groupCollapsed',
  GROUPING_CHANGED: 'groupingChanged',

  // 错误事件
  ERROR_OCCURRED: 'errorOccurred',
  VALIDATION_FAILED: 'validationFailed',

  // 自定义事件
  CUSTOM_EVENT: 'customEvent',
} as const

export type EventType = (typeof EventTypes)[keyof typeof EventTypes]

// 事件优先级常量
const EventPriorities = {
  LOW: 0,
  NORMAL: 1,
  HIGH: 2,
  CRITICAL: 3,
} as const

export type EventPriority = (typeof EventPriorities)[keyof typeof EventPriorities]

// 事件传播阶段常量
const EventPhases = {
  CAPTURING: 1,
  AT_TARGET: 2,
  BUBBLING: 3,
} as const

export type EventPhase = (typeof EventPhases)[keyof typeof EventPhases]

// 事件对象接口
export interface TableEvent<T = any> {
  type: EventType | string
  target?: any
  currentTarget?: any
  data?: T
  timestamp: number
  priority: EventPriority
  phase: EventPhase
  bubbles: boolean
  cancelable: boolean
  defaultPrevented: boolean
  propagationStopped: boolean
  path: any[]
  nativeEvent?: Event
}

// 事件监听器接口
export interface EventListener<T = any> {
  (event: TableEvent<T>): void | Promise<void>
}

// 异步事件监听器接口
export interface AsyncEventListener<T = any> {
  (event: TableEvent<T>): Promise<void>
}

// 事件监听器选项
export interface EventListenerOptions {
  priority?: EventPriority
  once?: boolean
  passive?: boolean
  capture?: boolean
  async?: boolean
}

// 事件系统状态
export interface EventSystemState {
  enabled: boolean
  asyncProcessing: boolean
  eventQueue: any[]
  processingQueue: boolean
  listenerCount: number
  asyncListenerCount: number
  totalEventsDispatched: number
  totalEventsProcessed: number
  performanceMetrics: {
    averageProcessingTime: number
    maxProcessingTime: number
    minProcessingTime: number
    eventTypeStats: Record<string, number>
  }
}

export interface EventSystemTableState {
  eventSystem: EventSystemState
}

export interface EventSystemInitialTableState {
  eventSystem?: Partial<EventSystemState>
}

// 事件系统选项
export interface EventSystemOptions<TData extends RowData> {
  /** 是否启用事件系统 */
  enableEvents?: boolean
  /** 异步事件处理间隔 (ms) */
  asyncProcessingInterval?: number
  /** 事件队列最大长度 */
  maxEventQueueSize?: number
  /** 启用性能监控 */
  enablePerformanceMetrics?: boolean
  /** 启用事件冒泡 */
  enableEventBubbling?: boolean
  /** 事件监听器最大执行时间 (ms) */
  maxListenerExecutionTime?: number
  /** 启用内存管理 */
  enableMemoryManagement?: boolean
  /** 内存清理间隔 (ms) */
  memoryCleanupInterval?: number
}

export interface EventSystemInstance<TData extends RowData> {
  // 全局事件服务
  eventService: EventServiceClass
  /** 分发事件 */
  dispatchEvent: <T>(type: EventType | string, data?: T, target?: any) => Promise<void>
  /** 添加事件监听器 */
  addEventListener: <T>(
    type: EventType | string,
    listener: EventListener<T>,
    options?: EventListenerOptions,
  ) => () => void
  /** 移除事件监听器 */
  removeEventListener: <T>(type: EventType | string, listener: EventListener<T>) => void
  /** 添加一次性事件监听器 */
  addOneTimeEventListener: <T>(
    type: EventType | string,
    listener: EventListener<T>,
    options?: EventListenerOptions,
  ) => () => void
  /** 添加异步事件监听器 */
  addAsyncEventListener: <T>(
    type: EventType | string,
    listener: AsyncEventListener<T>,
    options?: EventListenerOptions,
  ) => () => void
  /** 清除所有事件监听器 */
  clearAllEventListeners: () => void
  /** 获取事件系统状态 */
  getEventSystemState: () => EventSystemState
  /** 启用/禁用事件系统 */
  setEventSystemEnabled: (enabled: boolean) => void
  /** 刷新事件队列 */
  flushEventQueue: () => Promise<void>
}

// 全局事件服务类
export class EventServiceClass {
  private listeners: Map<string, Set<EventListener>>
  private asyncListeners: Map<string, Set<AsyncEventListener>>
  private listenerOptions: Map<EventListener, EventListenerOptions>
  private eventQueue: Array<{ event: TableEvent; listeners: Set<EventListener> }>
  private processingQueue: boolean
  private asyncProcessingInterval: number
  private maxEventQueueSize: number
  private enabled: boolean
  private performanceMetrics: any
  private totalEventsDispatched: number
  private totalEventsProcessed: number
  private memoryCleanupInterval: number
  private memoryCleanupTimer: number | null
  private enableMemoryManagement: boolean
  private enablePerformanceMetrics: boolean
  private maxListenerExecutionTime: number
  private enableEventBubbling: boolean

  constructor(
    options: {
      enableEvents?: boolean
      asyncProcessingInterval?: number
      maxEventQueueSize?: number
      enablePerformanceMetrics?: boolean
      enableEventBubbling?: boolean
      maxListenerExecutionTime?: number
      enableMemoryManagement?: boolean
      memoryCleanupInterval?: number
    } = {},
  ) {
    this.listeners = new Map()
    this.asyncListeners = new Map()
    this.listenerOptions = new Map()
    this.eventQueue = []
    this.processingQueue = false
    this.asyncProcessingInterval = options.asyncProcessingInterval ?? 16
    this.maxEventQueueSize = options.maxEventQueueSize ?? 1000
    this.enabled = options.enableEvents ?? true
    this.performanceMetrics = {
      averageProcessingTime: 0,
      maxProcessingTime: 0,
      minProcessingTime: Infinity,
      eventTypeStats: {},
    }
    this.totalEventsDispatched = 0
    this.totalEventsProcessed = 0
    this.memoryCleanupInterval = options.memoryCleanupInterval ?? 30000
    this.memoryCleanupTimer = null
    this.enableMemoryManagement = options.enableMemoryManagement ?? true
    this.enablePerformanceMetrics = options.enablePerformanceMetrics ?? true
    this.maxListenerExecutionTime = options.maxListenerExecutionTime ?? 100
    this.enableEventBubbling = options.enableEventBubbling ?? true

    if (this.enableMemoryManagement) {
      this.startMemoryCleanup()
    }
  }

  // 添加事件监听器
  addEventListener<T>(
    type: string,
    listener: EventListener<T>,
    options: EventListenerOptions = {},
  ): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }

    const listeners = this.listeners.get(type)!
    listeners.add(listener as EventListener)
    this.listenerOptions.set(listener as EventListener, options)

    // 返回取消函数
    return () => this.removeEventListener(type, listener as EventListener)
  }

  // 添加异步事件监听器
  addAsyncEventListener<T>(
    type: string,
    listener: AsyncEventListener<T>,
    options: EventListenerOptions = {},
  ): () => void {
    if (!this.asyncListeners.has(type)) {
      this.asyncListeners.set(type, new Set())
    }

    const listeners = this.asyncListeners.get(type)!
    listeners.add(listener as AsyncEventListener)
    this.listenerOptions.set(listener as AsyncEventListener, { ...options, async: true })

    // 返回取消函数
    return () => this.removeAsyncEventListener(type, listener as AsyncEventListener)
  }

  // 移除事件监听器
  removeEventListener(type: string, listener: EventListener): void {
    const listeners = this.listeners.get(type)
    if (listeners) {
      listeners.delete(listener)
      this.listenerOptions.delete(listener)
      if (listeners.size === 0) {
        this.listeners.delete(type)
      }
    }
  }

  // 移除异步事件监听器
  removeAsyncEventListener(type: string, listener: AsyncEventListener): void {
    const listeners = this.asyncListeners.get(type)
    if (listeners) {
      listeners.delete(listener)
      this.listenerOptions.delete(listener)
      if (listeners.size === 0) {
        this.asyncListeners.delete(type)
      }
    }
  }

  // 分发事件
  async dispatchEvent<T>(event: TableEvent<T>): Promise<void> {
    if (!this.enabled) return

    this.totalEventsDispatched++

    // 记录事件类型统计
    if (this.enablePerformanceMetrics) {
      this.performanceMetrics.eventTypeStats[event.type] =
        (this.performanceMetrics.eventTypeStats[event.type] || 0) + 1
    }

    // 创建事件队列项
    const listeners = new Set<EventListener>()

    // 获取同步监听器
    const syncListeners = this.listeners.get(event.type)
    if (syncListeners) {
      syncListeners.forEach((listener) => listeners.add(listener))
    }

    // 添加到事件队列
    if (listeners.size > 0) {
      this.eventQueue.push({ event, listeners })

      // 检查队列长度限制
      if (this.eventQueue.length > this.maxEventQueueSize) {
        this.eventQueue.shift() // 移除最老的事件
      }
    }

    // 处理异步监听器
    const asyncListeners = this.asyncListeners.get(event.type)
    if (asyncListeners && asyncListeners.size > 0) {
      // 异步处理
      this.processAsyncListeners(event, asyncListeners)
    }

    // 触发队列处理
    if (!this.processingQueue && this.eventQueue.length > 0) {
      this.processEventQueue()
    }
  }

  // 处理事件队列
  private async processEventQueue(): Promise<void> {
    if (this.processingQueue || this.eventQueue.length === 0) return

    this.processingQueue = true

    while (this.eventQueue.length > 0) {
      const queueItem = this.eventQueue.shift()!
      const startTime = performance.now()

      try {
        // 执行同步监听器
        for (const listener of queueItem.listeners) {
          const options = this.listenerOptions.get(listener) || {}

          // 检查执行时间限制
          const listenerStartTime = performance.now()

          try {
            if (options.once) {
              this.removeEventListener(queueItem.event.type, listener)
            }

            await listener(queueItem.event)

            // 检查执行时间
            const executionTime = performance.now() - listenerStartTime
            if (executionTime > this.maxListenerExecutionTime) {
              console.warn(
                `Event listener for ${queueItem.event.type} took ${executionTime}ms to execute`,
              )
            }
          } catch (error) {
            console.error(`Error in event listener for ${queueItem.event.type}:`, error)
          }
        }

        this.totalEventsProcessed++

        // 更新性能指标
        if (this.enablePerformanceMetrics) {
          const processingTime = performance.now() - startTime
          this.updatePerformanceMetrics(processingTime)
        }
      } catch (error) {
        console.error('Error processing event queue:', error)
      }

      // 小延迟以避免阻塞主线程
      if (this.eventQueue.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, this.asyncProcessingInterval))
      }
    }

    this.processingQueue = false
  }

  // 处理异步监听器
  private async processAsyncListeners<T>(
    event: TableEvent<T>,
    listeners: Set<AsyncEventListener>,
  ): Promise<void> {
    for (const listener of listeners) {
      try {
        const options = this.listenerOptions.get(listener as EventListener) || {}

        if (options.once) {
          this.removeAsyncEventListener(event.type, listener as AsyncEventListener)
        }

        // 异步执行，不等待
        listener(event).catch((error) => {
          console.error(`Error in async event listener for ${event.type}:`, error)
        })
      } catch (error) {
        console.error(`Error processing async listener for ${event.type}:`, error)
      }
    }
  }

  // 更新性能指标
  private updatePerformanceMetrics(processingTime: number): void {
    const { averageProcessingTime, maxProcessingTime, minProcessingTime } = this.performanceMetrics

    // 更新平均处理时间（简单移动平均）
    this.performanceMetrics.averageProcessingTime =
      (averageProcessingTime * this.totalEventsProcessed + processingTime) /
      (this.totalEventsProcessed + 1)

    // 更新最大/最小处理时间
    this.performanceMetrics.maxProcessingTime = Math.max(maxProcessingTime, processingTime)
    this.performanceMetrics.minProcessingTime = Math.min(minProcessingTime, processingTime)
  }

  // 启动内存清理
  private startMemoryCleanup(): void {
    if (this.memoryCleanupTimer) {
      clearInterval(this.memoryCleanupTimer)
    }

    this.memoryCleanupTimer = window.setInterval(() => {
      this.cleanupMemory()
    }, this.memoryCleanupInterval)
  }

  // 内存清理
  private cleanupMemory(): void {
    // 清理空的事件监听器集合
    for (const [type, listeners] of this.listeners) {
      if (listeners.size === 0) {
        this.listeners.delete(type)
      }
    }

    for (const [type, listeners] of this.asyncListeners) {
      if (listeners.size === 0) {
        this.asyncListeners.delete(type)
      }
    }

    // 清理事件队列
    if (this.eventQueue.length > this.maxEventQueueSize * 2) {
      this.eventQueue = this.eventQueue.slice(-this.maxEventQueueSize)
    }
  }

  // 清除所有事件监听器
  clearAllEventListeners(): void {
    this.listeners.clear()
    this.asyncListeners.clear()
    this.listenerOptions.clear()
    this.eventQueue = []
  }

  // 获取事件系统状态
  getState(): EventSystemState {
    let totalListeners = 0
    let totalAsyncListeners = 0

    for (const listeners of this.listeners.values()) {
      totalListeners += listeners.size
    }

    for (const listeners of this.asyncListeners.values()) {
      totalAsyncListeners += listeners.size
    }

    return {
      enabled: this.enabled,
      asyncProcessing: this.processingQueue,
      eventQueue: [...this.eventQueue],
      processingQueue: this.processingQueue,
      listenerCount: totalListeners,
      asyncListenerCount: totalAsyncListeners,
      totalEventsDispatched: this.totalEventsDispatched,
      totalEventsProcessed: this.totalEventsProcessed,
      performanceMetrics: { ...this.performanceMetrics },
    }
  }

  // 设置启用状态
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  // 刷新事件队列
  async flushEventQueue(): Promise<void> {
    await this.processEventQueue()
  }

  // 销毁
  destroy(): void {
    if (this.memoryCleanupTimer) {
      clearInterval(this.memoryCleanupTimer)
      this.memoryCleanupTimer = null
    }

    this.clearAllEventListeners()
  }
}

// 本地事件服务类
export class LocalEventServiceClass {
  private listeners: Map<string, Set<EventListener>>
  private asyncListeners: Map<string, Set<AsyncEventListener>>
  private parentService?: EventServiceClass
  private componentId: string
  private enabled: boolean

  constructor(componentId: string, parentService?: EventServiceClass) {
    this.listeners = new Map()
    this.asyncListeners = new Map()
    this.componentId = componentId
    this.parentService = parentService
    this.enabled = true
  }

  // 添加事件监听器
  addEventListener<T>(
    type: string,
    listener: EventListener<T>,
    options: EventListenerOptions = {},
  ): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }

    const listeners = this.listeners.get(type)!
    listeners.add(listener as EventListener)

    // 返回取消函数
    return () => this.removeEventListener(type, listener as EventListener)
  }

  // 添加异步事件监听器
  addAsyncEventListener<T>(
    type: string,
    listener: AsyncEventListener<T>,
    options: EventListenerOptions = {},
  ): () => void {
    if (!this.asyncListeners.has(type)) {
      this.asyncListeners.set(type, new Set())
    }

    const listeners = this.asyncListeners.get(type)!
    listeners.add(listener as AsyncEventListener)

    // 返回取消函数
    return () => this.removeAsyncEventListener(type, listener as AsyncEventListener)
  }

  // 移除事件监听器
  removeEventListener(type: string, listener: EventListener): void {
    const listeners = this.listeners.get(type)
    if (listeners) {
      listeners.delete(listener)
      if (listeners.size === 0) {
        this.listeners.delete(type)
      }
    }
  }

  // 移除异步事件监听器
  removeAsyncEventListener(type: string, listener: AsyncEventListener): void {
    const listeners = this.asyncListeners.get(type)
    if (listeners) {
      listeners.delete(listener)
      if (listeners.size === 0) {
        this.asyncListeners.delete(type)
      }
    }
  }

  // 分发本地事件
  async dispatchEvent<T>(event: TableEvent<T>): Promise<void> {
    if (!this.enabled) return

    // 本地处理
    const listeners = this.listeners.get(event.type)
    if (listeners) {
      for (const listener of listeners) {
        try {
          await listener(event)
        } catch (error) {
          console.error(`Error in local event listener for ${event.type}:`, error)
        }
      }
    }

    // 处理异步监听器
    const asyncListeners = this.asyncListeners.get(event.type)
    if (asyncListeners) {
      for (const listener of asyncListeners) {
        try {
          listener(event).catch((error) => {
            console.error(`Error in async local event listener for ${event.type}:`, error)
          })
        } catch (error) {
          console.error(`Error processing async local listener for ${event.type}:`, error)
        }
      }
    }

    // 冒泡到全局事件服务
    if (this.parentService && event.bubbles) {
      event.path = [...(event.path || []), this.componentId]
      await this.parentService.dispatchEvent(event)
    }
  }

  // 分发本地事件（简化版）
  async dispatchLocalEvent<T>(type: string, data?: T): Promise<void> {
    const event: TableEvent<T> = {
      type,
      data,
      target: this.componentId,
      currentTarget: this.componentId,
      timestamp: Date.now(),
      priority: EventPriorities.NORMAL,
      phase: EventPhases.AT_TARGET,
      bubbles: true,
      cancelable: false,
      defaultPrevented: false,
      propagationStopped: false,
      path: [this.componentId],
    }

    await this.dispatchEvent(event)
  }

  // 清除所有事件监听器
  clearAllEventListeners(): void {
    this.listeners.clear()
    this.asyncListeners.clear()
  }

  // 设置启用状态
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  // 销毁
  destroy(): void {
    this.clearAllEventListeners()
  }
}

// BeanStub 基类，用于托管事件监听器
export class BeanStubClass {
  private managedListeners: Array<() => void>
  private localEventService: LocalEventServiceClass

  constructor(componentId: string, parentEventService?: EventServiceClass) {
    this.managedListeners = []
    this.localEventService = new LocalEventServiceClass(componentId, parentEventService)
  }

  // 添加托管的事件监听器
  addManagedEventListener<T>(
    type: string,
    listener: EventListener<T>,
    options?: EventListenerOptions,
  ): () => void {
    const unsubscribe = this.localEventService.addEventListener(type, listener, options)
    this.managedListeners.push(unsubscribe)
    return unsubscribe
  }

  // 添加托管的异步事件监听器
  addManagedAsyncEventListener<T>(
    type: string,
    listener: AsyncEventListener<T>,
    options?: EventListenerOptions,
  ): () => void {
    const unsubscribe = this.localEventService.addAsyncEventListener(type, listener, options)
    this.managedListeners.push(unsubscribe)
    return unsubscribe
  }

  // 分发事件
  async dispatchEvent<T>(type: string, data?: T): Promise<void> {
    await this.localEventService.dispatchLocalEvent(type, data)
  }

  // 销毁所有托管的监听器
  destroy(): void {
    this.managedListeners.forEach((unsubscribe) => unsubscribe())
    this.managedListeners = []
    this.localEventService.destroy()
  }

  // 获取本地事件服务
  getLocalEventService(): LocalEventServiceClass {
    return this.localEventService
  }
}

export interface EventServiceRow<TData> {
  rowService: RowEventService<TData>
  dispatchRowEvent: (type: EventType, data?: any) => Promise<void>
  addRowEventListener: <T>(
    type: EventType | string,
    listener: EventListener<T>,
    options?: EventListenerOptions,
  ) => () => void
  destroy: () => void
}

// 行节点类，支持事件分发
export class RowEventService<TData extends RowData> extends BeanStubClass {
  private row: Row<TData>
  private table: Table<TData>

  constructor(row: Row<TData>, table: Table<TData>) {
    super(`row-${row.id}`, table.eventService)
    this.row = row
    this.table = table
  }

  // 分发行事件
  async dispatchRowEvent(type: EventType, data?: any): Promise<void> {
    const eventData = {
      row: this.row,
      rowId: this.row.id,
      rowIndex: this.row.index,
      data: this.row.original,
      ...data,
    }

    await this.dispatchEvent(type, eventData)
  }

  // 处理行点击
  async handleRowClick(event: MouseEvent): Promise<void> {
    await this.dispatchRowEvent(EventTypes.ROW_CLICKED, { nativeEvent: event })
  }

  // 处理行双击
  async handleRowDoubleClick(event: MouseEvent): Promise<void> {
    await this.dispatchRowEvent(EventTypes.ROW_DOUBLE_CLICKED, { nativeEvent: event })
  }

  // 获取行数据
  getRow(): Row<TData> {
    return this.row
  }
}

export interface EventServiceCell<TData> {
  cellEventService: CellEventService<TData>
  dispatchCellEvent: (type: EventType, data?: any) => Promise<void>
  addCellEventListener: <T>(
    type: EventType | string,
    listener: EventListener<T>,
    options?: EventListenerOptions,
  ) => () => void
  destroy: () => void
}

// 单元格节点类，支持事件分发
export class CellEventService<TData extends RowData, TValue = any> extends BeanStubClass {
  private cell: Cell<TData, TValue>
  private table: Table<TData>

  constructor(cell: Cell<TData, TValue>, table: Table<TData>) {
    super(`cell-${cell.id}`, table.eventService)
    this.cell = cell
    this.table = table
  }

  // 分发单元格事件
  async dispatchCellEvent(type: EventType, data?: any): Promise<void> {
    const eventData = {
      cell: this.cell,
      row: this.cell.row,
      column: this.cell.column,
      value: this.cell.getValue(),
      ...data,
    }

    await this.dispatchEvent(type, eventData)
  }

  // 处理单元格点击
  async handleCellClick(event: MouseEvent): Promise<void> {
    await this.dispatchCellEvent(EventTypes.CELL_CLICKED, { nativeEvent: event })
  }

  // 处理单元格双击
  async handleCellDoubleClick(event: MouseEvent): Promise<void> {
    await this.dispatchCellEvent(EventTypes.CELL_DOUBLE_CLICKED, { nativeEvent: event })
  }

  // 获取单元格数据
  getCell(): Cell<TData, TValue> {
    return this.cell
  }
}

export interface EventServiceColumn<TData> {
  addColumnEventListener: <T>(
    type: EventType | string,
    listener: EventListener<T>,
    options?: EventListenerOptions,
  ) => () => void
  dispatchColumnEvent: (type: EventType, data?: any) => Promise<void>
}

// 表格事件系统功能
export const EventSystem: TableFeature = {
  getDefaultOptions: <TData extends RowData>(
    table: Table<TData>,
  ): Partial<EventSystemOptions<TData>> => {
    return {
      enableEvents: true,
      asyncProcessingInterval: 16,
      maxEventQueueSize: 1000,
      enablePerformanceMetrics: true,
      enableEventBubbling: true,
      maxListenerExecutionTime: 100,
      enableMemoryManagement: true,
      memoryCleanupInterval: 30000,
    }
  },

  createTable: <TData extends RowData>(table: Table<TData>): void => {
    // 创建全局事件服务
    const eventService = new EventServiceClass({
      enableEvents: table.options.enableEvents,
      asyncProcessingInterval: table.options.asyncProcessingInterval,
      maxEventQueueSize: table.options.maxEventQueueSize,
      enablePerformanceMetrics: table.options.enablePerformanceMetrics,
      enableEventBubbling: table.options.enableEventBubbling,
      maxListenerExecutionTime: table.options.maxListenerExecutionTime,
      enableMemoryManagement: table.options.enableMemoryManagement,
      memoryCleanupInterval: table.options.memoryCleanupInterval,
    })

    // 将事件服务添加到表格实例
    table.eventService = eventService

    // 分发表格初始化事件
    eventService.dispatchEvent({
      type: EventTypes.TABLE_INITIALIZED,
      target: table,
      currentTarget: table,
      timestamp: Date.now(),
      priority: EventPriorities.HIGH,
      phase: EventPhases.AT_TARGET,
      bubbles: false,
      cancelable: false,
      defaultPrevented: false,
      propagationStopped: false,
      path: ['table'],
    })

    // 监听表格状态变化
    const originalSetState = table.setState
    table.setState = (updater: any) => {
      const oldState = table.getState()
      originalSetState(updater)
      const newState = table.getState()

      // 分发状态变化事件
      eventService.dispatchEvent({
        type: EventTypes.TABLE_STATE_CHANGED,
        data: { oldState, newState },
        target: table,
        currentTarget: table,
        timestamp: Date.now(),
        priority: EventPriorities.NORMAL,
        phase: EventPhases.AT_TARGET,
        bubbles: false,
        cancelable: false,
        defaultPrevented: false,
        propagationStopped: false,
        path: ['table'],
      })
    }

    // 表格销毁时的清理
    const originalDestroy = table.destroy || (() => {})
    table.destroy = () => {
      // 分发表格销毁事件
      eventService.dispatchEvent({
        type: EventTypes.TABLE_DESTROYED,
        target: table,
        currentTarget: table,
        timestamp: Date.now(),
        priority: EventPriorities.HIGH,
        phase: EventPhases.AT_TARGET,
        bubbles: false,
        cancelable: false,
        defaultPrevented: false,
        propagationStopped: false,
        path: ['table'],
      })

      // 清理事件服务
      eventService.destroy()
      originalDestroy()
    }

    // 添加事件系统方法
    table.dispatchEvent = async <T>(
      type: EventType | string,
      data?: T,
      target?: any,
    ): Promise<void> => {
      const event: TableEvent<T> = {
        type,
        data,
        target: target || table,
        currentTarget: table,
        timestamp: Date.now(),
        priority: EventPriorities.NORMAL,
        phase: EventPhases.AT_TARGET,
        bubbles: true,
        cancelable: false,
        defaultPrevented: false,
        propagationStopped: false,
        path: ['table'],
      }

      await eventService.dispatchEvent(event)
    }
    table.addEventListener = <T>(
      type: EventType | string,
      listener: EventListener<T>,
      options?: EventListenerOptions,
    ): (() => void) => {
      return eventService.addEventListener(type, listener, options)
    }
    table.removeEventListener = <T>(type: EventType | string, listener: EventListener<T>): void => {
      eventService.removeEventListener(type, listener)
    }
    table.addOneTimeEventListener = <T>(
      type: EventType | string,
      listener: EventListener<T>,
      options?: EventListenerOptions,
    ): (() => void) => {
      return eventService.addEventListener(type, listener, { ...options, once: true })
    }
    table.addAsyncEventListener = <T>(
      type: EventType | string,
      listener: AsyncEventListener<T>,
      options?: EventListenerOptions,
    ): (() => void) => {
      return eventService.addAsyncEventListener(type, listener, options)
    }
    table.clearAllEventListeners = (): void => {
      eventService.clearAllEventListeners()
    }
    table.getEventSystemState = (): EventSystemState => {
      return eventService.getState()
    }
    table.setEventSystemEnabled = (enabled: boolean): void => {
      eventService.setEnabled(enabled)
      table.setState(
        (old: TableState) =>
          ({
            ...old,
            eventSystem: {
              ...((old as any).eventSystem || {}),
              enabled,
            },
          }) as any,
      )
    }
    table.flushEventQueue = async (): Promise<void> => {
      await eventService.flushEventQueue()
    }
  },

  createRow: <TData extends RowData>(row: Row<TData>, table: Table<TData>): void => {
    // 创建行节点
    const rowService = new RowEventService(row, table)

    // 将行节点添加到行对象
    row.rowService = rowService

    // 添加行事件方法
    row.dispatchRowEvent = async (type: EventType, data?: any): Promise<void> => {
      await rowService.dispatchRowEvent(type, data)
    }

    // 添加行事件监听器
    row.addRowEventListener = <T>(
      type: EventType | string,
      listener: EventListener<T>,
      options?: EventListenerOptions,
    ): (() => void) => {
      return rowService.addManagedEventListener(type, listener, options)
    }

    // 清理方法
    const originalDestroy = row.destroy || (() => {})
    row.destroy = () => {
      rowService.destroy()
      originalDestroy()
    }
  },

  createCell: <TData extends RowData>(
    cell: Cell<TData, unknown>,
    column: Column<TData>,
    row: Row<TData>,
    table: Table<TData>,
  ): void => {
    // 创建单元格节点
    const cellEventService = new CellEventService(cell, table)

    // 将单元格节点添加到单元格对象
    cell.cellEventService = cellEventService

    // 添加单元格事件方法
    cell.dispatchCellEvent = async (type: EventType, data?: any): Promise<void> => {
      await cellEventService.dispatchCellEvent(type, data)
    }

    // 添加单元格事件监听器
    cell.addCellEventListener = <T>(
      type: EventType | string,
      listener: EventListener<T>,
      options?: EventListenerOptions,
    ): (() => void) => {
      return cellEventService.addManagedEventListener(type, listener, options)
    }

    // 清理方法
    const originalDestroy = cell.destroy || (() => {})
    cell.destroy = () => {
      cellEventService.destroy()
      originalDestroy()
    }
  },

  createColumn: <TData extends RowData>(column: Column<TData>, table: Table<TData>): void => {
    // 为列添加事件功能
    column.dispatchColumnEvent = async (type: EventType, data?: any): Promise<void> => {
      const eventData = {
        column,
        columnId: column.id,
        ...data,
      }

      await table.dispatchEvent(type, eventData, column)
    }
    column.addColumnEventListener = <T>(
      type: EventType | string,
      listener: EventListener<T>,
      options?: EventListenerOptions,
    ): (() => void) => {
      return table.addEventListener(
        type,
        (event: any) => {
          if (event.data?.columnId === column.id) {
            listener(event)
          }
        },
        options,
      )
    }
  },
}

export type LocalEventService = LocalEventServiceClass
export type BeanStub = BeanStubClass
export type RowEvent<TData extends RowData> = RowEventService<TData>
export type CellEvent<TData extends RowData, TValue = any> = CellEventService<TData, TValue>

// 导出常量
export { EventTypes, EventPriorities, EventPhases }

// 默认导出
export default EventSystem
