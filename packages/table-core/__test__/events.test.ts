import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { LocalEventService, EventTypesEnum, ITableEvent } from '../src/core/events'

describe('事件核心', () => {
  describe('本地事件服务', () => {
    let eventService: LocalEventService
    const testEventType = 'testEvent'
    const testEvent: ITableEvent = { type: testEventType }

    beforeEach(() => {
      eventService = new LocalEventService()
    })

    afterEach(() => {
      eventService.destroy()
    })

    describe('基本功能', () => {
      it('应该创建事件服务实例', () => {
        expect(eventService).toBeDefined()
        expect(eventService.isAlive()).toBe(true)
      })

      it('初始时应该没有注册的监听器', () => {
        expect(eventService.noRegisteredListenersExist()).toBe(true)
      })
    })

    describe('事件监听器管理', () => {
      it('应该添加和移除事件监听器', () => {
        const listener = vi.fn()

        // 添加监听器
        const destroyFunc = eventService.addEventListener(testEventType, listener)
        expect(eventService.noRegisteredListenersExist()).toBe(false)

        // 分发事件
        eventService.dispatchEvent(testEvent)
        expect(listener).toHaveBeenCalledWith(testEvent)
        expect(listener).toHaveBeenCalledTimes(1)

        // 移除监听器
        destroyFunc()
        expect(eventService.noRegisteredListenersExist()).toBe(true)

        // 再次分发事件，监听器不应被调用
        eventService.dispatchEvent(testEvent)
        expect(listener).toHaveBeenCalledTimes(1)
      })

      it('应该处理同一事件类型的多个监听器', () => {
        const listener1 = vi.fn()
        const listener2 = vi.fn()

        eventService.addEventListener(testEventType, listener1)
        eventService.addEventListener(testEventType, listener2)

        eventService.dispatchEvent(testEvent)

        expect(listener1).toHaveBeenCalledWith(testEvent)
        expect(listener2).toHaveBeenCalledWith(testEvent)
        expect(listener1).toHaveBeenCalledTimes(1)
        expect(listener2).toHaveBeenCalledTimes(1)
      })
    })

    describe('异步事件处理', () => {
      it('应该处理异步事件监听器', async () => {
        const listener = vi.fn()

        eventService.addEventListener(testEventType, listener, true)

        eventService.dispatchEvent(testEvent)

        // 异步监听器应该在下一次事件循环中执行
        expect(listener).not.toHaveBeenCalled()

        await vi.waitFor(() => {
          expect(listener).toHaveBeenCalledWith(testEvent)
        })
      })
    })

    describe('全局事件监听器', () => {
      it('应该处理全局事件监听器', () => {
        const globalListener = vi.fn()

        eventService.addGlobalListener(globalListener)

        eventService.dispatchEvent(testEvent)

        expect(globalListener).toHaveBeenCalledWith(testEventType, testEvent)
      })
    })

    describe('事件分发', () => {
      it('应该只分发一次事件', () => {
        const listener = vi.fn()

        eventService.addEventListener(testEventType, listener)

        // 第一次分发
        eventService.dispatchEventOnce(testEvent)
        expect(listener).toHaveBeenCalledTimes(1)

        // 第二次分发，应该被忽略
        eventService.dispatchEventOnce(testEvent)
        expect(listener).toHaveBeenCalledTimes(1)
      })
    })

    describe('服务生命周期', () => {
      it('应该正确销毁服务', () => {
        const listener = vi.fn()
        const globalListener = vi.fn()

        eventService.addEventListener(testEventType, listener)
        eventService.addGlobalListener(globalListener)

        // 销毁服务
        eventService.destroy()

        expect(eventService.isAlive()).toBe(false)
        expect(eventService.noRegisteredListenersExist()).toBe(true)

        // 销毁后分发事件不应触发监听器
        eventService.dispatchEvent(testEvent)
        expect(listener).not.toHaveBeenCalled()
        expect(globalListener).not.toHaveBeenCalled()
      })
    })

    describe('边界情况', () => {
      it('应该处理移除不存在的监听器', () => {
        const nonExistentListener = vi.fn()

        // 尝试移除不存在的监听器，不应抛出错误
        expect(() => {
          eventService.removeEventListener(testEventType, nonExistentListener)
        }).not.toThrow()
      })

      it('应该处理没有监听器的事件分发', () => {
        // 分发事件到没有监听器的事件类型，不应抛出错误
        expect(() => {
          eventService.dispatchEvent(testEvent)
        }).not.toThrow()
      })
    })
  })
})
