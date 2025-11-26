/**
 * 插件风格的事件系统
 * 基于 AG Grid Community 事件系统设计思路
 * 提供分层、可扩展的事件处理架构
 */

// 事件类型常量
export const EventTypesEnum = {
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

// 基础事件接口
export interface ITableEvent<TEventType = string> {
  /** 事件标识符 */
  type: TEventType
}

// 事件监听器类型
export type IEventListener<TEventType extends string> = (event: ITableEvent<TEventType>) => void
export type IGlobalEventListener<TEventType> = (
  eventType: TEventType,
  event: ITableEvent<TEventType>,
) => void

// 本地事件服务 - 核心事件处理引擎
export class LocalEventService<TEventType extends string = string> {
  private readonly syncListeners = new Map<TEventType, Set<IEventListener<TEventType>>>()
  private readonly asyncListeners = new Map<TEventType, Set<IEventListener<TEventType>>>()
  private readonly globalSyncListeners = new Set<IGlobalEventListener<TEventType>>()
  private readonly globalAsyncListeners = new Set<IGlobalEventListener<TEventType>>()

  private destroyFunctions: (() => void)[] = []
  private destroyed = false

  private asyncFunctionsQueue: (() => void)[] = []
  private scheduled = false

  // 已触发事件记录，用于一次性事件
  private firedEvents: Record<string, boolean> = {}

  // 获取指定事件类型的监听器集合
  private getListeners(
    eventType: TEventType,
    async: boolean,
    autoCreate = false,
  ): Set<IEventListener<TEventType>> | undefined {
    const listenerMap = async ? this.asyncListeners : this.syncListeners
    let listeners = listenerMap.get(eventType)

    if (!listeners && autoCreate) {
      listeners = new Set()
      listenerMap.set(eventType, listeners)
    }

    return listeners
  }

  // 检查是否没有注册的监听器
  public noRegisteredListenersExist(): boolean {
    return (
      this.syncListeners.size === 0 &&
      this.asyncListeners.size === 0 &&
      this.globalSyncListeners.size === 0 &&
      this.globalAsyncListeners.size === 0
    )
  }

  // 添加事件监听器
  public addEventListener<T extends TEventType>(
    eventType: T,
    listener: IEventListener<T>,
    async = false,
  ): () => void {
    this.getListeners(eventType, async, true)!.add(listener as IEventListener<TEventType>)

    const destroyFunc = () => {
      this.removeEventListener(eventType, listener, async)
    }

    this.destroyFunctions.push(destroyFunc)

    return destroyFunc
  }

  // 移除事件监听器
  public removeEventListener<T extends TEventType>(
    eventType: T,
    listener: IEventListener<T>,
    async = false,
  ): void {
    const listeners = this.getListeners(eventType, async, false)
    if (!listeners) return

    listeners.delete(listener as IEventListener<TEventType>)

    // 如果监听器集合为空，删除该事件类型的条目
    if (listeners.size === 0) {
      const listenerMap = async ? this.asyncListeners : this.syncListeners
      listenerMap.delete(eventType)
    }
  }

  // 添加全局事件监听器
  public addGlobalListener(listener: IGlobalEventListener<TEventType>, async = false): () => void {
    const listeners = async ? this.globalAsyncListeners : this.globalSyncListeners
    listeners.add(listener)
    const destroyFunc = () => {
      this.removeGlobalListener(listener, async)
    }

    this.destroyFunctions.push(destroyFunc)

    return destroyFunc
  }

  // 移除全局事件监听器
  public removeGlobalListener(listener: IGlobalEventListener<TEventType>, async = false): void {
    const listeners = async ? this.globalAsyncListeners : this.globalSyncListeners
    listeners.delete(listener)
  }

  // 分发事件
  public dispatchEvent<TEvent extends ITableEvent<TEventType>>(event: TEvent): void {
    // 先分发同步事件，再分发异步事件
    this.dispatchToListeners(event, false)
    this.dispatchToListeners(event, true)

    // 记录事件已触发
    this.firedEvents[String(event.type)] = true
  }

  // 分发一次性事件（如果该类型事件还未触发过）
  public dispatchEventOnce<TEvent extends ITableEvent<TEventType>>(event: TEvent): void {
    if (!this.firedEvents[String(event.type)]) {
      this.dispatchEvent(event)
    }
  }

  // 分发事件到监听器
  private dispatchToListeners<TEvent extends ITableEvent<TEventType>>(
    event: TEvent,
    async: boolean,
  ): void {
    const eventType = event.type

    // 处理普通监听器
    const originalListeners = this.getListeners(eventType, async, false)
    if (originalListeners?.size) {
      // 创建监听器副本，防止在事件处理过程中修改监听器集合
      const listeners = Array.from(originalListeners)
      for (const listener of listeners) {
        if (async) {
          this.dispatchAsync(() => listener(event))
        } else {
          listener(event)
        }
      }
    }

    // 处理全局监听器
    const globalListeners = async ? this.globalAsyncListeners : this.globalSyncListeners
    if (globalListeners.size) {
      const listeners = Array.from(globalListeners)
      for (const listener of listeners) {
        if (async) {
          this.dispatchAsync(() => listener(eventType, event))
        } else {
          listener(eventType, event)
        }
      }
    }
  }

  // 异步分发事件
  private dispatchAsync(func: () => void): void {
    this.asyncFunctionsQueue.push(func)

    if (!this.scheduled) {
      // 使用 setTimeout 在下一个事件循环执行
      setTimeout(() => this.flushAsyncQueue(), 0)
      this.scheduled = true
    }
  }

  // 刷新异步事件队列
  private flushAsyncQueue(): void {
    this.scheduled = false

    // 复制队列，防止在事件处理过程中修改队列
    const queueCopy = this.asyncFunctionsQueue.slice()
    this.asyncFunctionsQueue = []

    // 执行队列中的函数
    for (const func of queueCopy) {
      func()
    }
  }

  // 销毁
  public destroy(): void {
    if (this.destroyed) return

    // 执行所有销毁函数
    for (const func of this.destroyFunctions) {
      func()
    }

    this.destroyFunctions.length = 0
    this.destroyed = true
  }

  // 检查是否存活
  public isAlive(): boolean {
    return !this.destroyed
  }
}
