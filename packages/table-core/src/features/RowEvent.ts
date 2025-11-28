import { LocalEventService, ITableEvent, IEventListener, EventTypesEnum } from '../core/events'
import { Row, RowData, Table, TableFeature } from '../types'

export interface RowEventRow<TData extends RowData> {
  // 本地事件服务
  eventService: LocalEventService

  dispatchEvent: <TEvent extends ITableEvent<string>>(event: TEvent) => Promise<void>

  addEventListener: <T extends string>(
    type: T,
    listener: IEventListener<T>,
    async?: boolean,
  ) => void

  removeEventListener: <T extends string>(type: T, listener: IEventListener<T>) => void
}

// 事件系统选项
export interface TableEventOptions<TData extends RowData> {}

// 表格事件系统功能
export const RowEvent: TableFeature = {
  createRow: <TData extends RowData>(row: Row<TData>, table: Table<TData>): void => {
    const eventService = new LocalEventService<string>()
    // 将事件服务添加到表格实例
    row.eventService = eventService

    // 表格销毁时的清理
    const originalDestroy = table.destroy || (() => {})
    row.destroy = () => {
      // 分发表格销毁事件
      eventService.dispatchEvent({
        type: EventTypesEnum.TABLE_DESTROYED,
      })

      // 清理事件服务
      eventService.destroy()
      originalDestroy()
    }

    // 添加事件系统方法
    row.dispatchEvent = async <T extends string>(e: ITableEvent<T>): Promise<void> => {
      await eventService.dispatchEvent(e)
    }

    row.addEventListener = <T extends string>(
      type: T,
      listener: IEventListener<T>,
      async?: boolean,
    ): (() => void) => {
      return eventService.addEventListener(type, listener, async)
    }
    row.removeEventListener = <T extends string>(type: T, listener: IEventListener<T>): void => {
      eventService.removeEventListener(type, listener)
    }
  },
}
