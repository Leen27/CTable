/**
 * watchObj 函数测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { watchObj, createWatchObj, watchObjects } from '../src/utils/watchVar'

describe('watchObj 测试', () => {
  // 保存原始的 console 方法
  const originalConsole = {
    log: console.log,
    group: console.group,
    groupEnd: console.groupEnd
  }
  
  // 模拟 console 方法
  const mockConsole = {
    log: vi.fn(),
    group: vi.fn(),
    groupEnd: vi.fn()
  }
  
  beforeEach(() => {
    // 替换 console 方法
    console.log = mockConsole.log
    console.group = mockConsole.group
    console.groupEnd = mockConsole.groupEnd
    
    // 清空 mock 调用记录
    mockConsole.log.mockClear()
    mockConsole.group.mockClear()
    mockConsole.groupEnd.mockClear()
  })
  
  afterEach(() => {
    // 恢复原始的 console 方法
    console.log = originalConsole.log
    console.group = originalConsole.group
    console.groupEnd = originalConsole.groupEnd
  })
  
  it('应该监控简单对象的属性修改', () => {
    const obj = watchObj({ name: 'Alice', age: 25 }, { name: 'person' })
    
    // 修改属性
    obj.name = 'Bob'
    
    // 验证控制台输出 - 注意实际输出使用的是"属性路径"而不是"属性"
    expect(mockConsole.group).toHaveBeenCalledWith('[person] 对象属性被修改')
    expect(mockConsole.log).toHaveBeenCalledWith('属性路径: name')
    expect(mockConsole.log).toHaveBeenCalledWith('旧值:', 'Alice')
    expect(mockConsole.log).toHaveBeenCalledWith('新值:', 'Bob')
  })
  
  it('应该监控嵌套对象的深度修改', () => {
    const obj = watchObj({ 
      user: { 
        name: 'Alice', 
        profile: { age: 25 } 
      } 
    }, { name: 'nestedObject', deep: true })
    
    // 修改嵌套属性
    obj.user.profile.age = 30
    
    // 验证控制台输出
    expect(mockConsole.group).toHaveBeenCalledWith('[nestedObject] 对象属性被修改')
    expect(mockConsole.log).toHaveBeenCalledWith('属性路径: user.profile.age')
    expect(mockConsole.log).toHaveBeenCalledWith('旧值:', 25)
    expect(mockConsole.log).toHaveBeenCalledWith('新值:', 30)
  })
  
  it('应该监控对象属性的删除', () => {
    const obj = watchObj({ name: 'Alice', age: 25 }, { name: 'person' })
    
    // 删除属性
    delete (obj as any).age
    
    // 验证控制台输出 - 删除操作也使用"属性路径"
    expect(mockConsole.group).toHaveBeenCalledWith('[person] 对象属性被删除')
    expect(mockConsole.log).toHaveBeenCalledWith('属性路径: age')
    expect(mockConsole.log).toHaveBeenCalledWith('被删除的值:', 25)
  })
  
  it('应该支持 createWatchObj 的重新赋值功能', () => {
    const watchedObj = createWatchObj({ x: 1, y: 2 }, { name: 'coordinates' })
    
    // 修改属性
    watchedObj.value.x = 100
    
    // 重新赋值
    watchedObj.value = { x: 200, y: 300 }
    
    // 验证控制台输出包含重新赋值信息
    const calls = mockConsole.group.mock.calls.map(call => call[0])
    expect(calls).toContain('[coordinates] 对象被重新赋值')
  })
  
  it('应该监控多个对象', () => {
    const watched = watchObjects({
      user: { name: 'Alice', age: 25 },
      settings: { theme: 'dark', lang: 'en' }
    })
    
    // 修改 user 对象
    ;(watched as any).user.name = 'Bob'
    
    // 修改 settings 对象
    ;(watched as any).settings.theme = 'light'
    
    // 验证控制台输出
    expect(mockConsole.group).toHaveBeenCalledWith('[user] 对象属性被修改')
    expect(mockConsole.group).toHaveBeenCalledWith('[settings] 对象属性被修改')
  })
  
  it('应该正确处理循环引用', () => {
    const obj: any = { name: 'Alice' }
    obj.self = obj // 创建循环引用
    
    const watchedObj = watchObj(obj, { name: 'circular', deep: true })
    
    // 修改属性
    watchedObj.name = 'Bob'
    
    // 验证没有无限递归
    expect(mockConsole.group).toHaveBeenCalledWith('[circular] 对象属性被修改')
    expect(mockConsole.log).toHaveBeenCalledWith('属性路径: name')
    expect(mockConsole.log).toHaveBeenCalledWith('旧值:', 'Alice')
    expect(mockConsole.log).toHaveBeenCalledWith('新值:', 'Bob')
  })
  
  it('应该支持 showStack 选项', () => {
    const obj = watchObj({ value: 1 }, { name: 'test', showStack: true })
    
    // 修改属性
    obj.value = 2
    
    // 验证调用栈信息被打印
    const calls = mockConsole.log.mock.calls.map(call => call[0])
    expect(calls).toContain('调用栈:')
  })
  
  it('应该支持非深度监控模式', () => {
    const obj = watchObj({ 
      user: { name: 'Alice' } 
    }, { name: 'shallow', deep: false })
    
    // 修改嵌套属性（不应该被监控）
    obj.user.name = 'Bob'
    
    // 只应该有一次初始化的监控输出
    const groupCalls = mockConsole.group.mock.calls.filter(call => 
      call[0].includes('[shallow] 对象属性被修改')
    )
    expect(groupCalls.length).toBe(0) // 非深度模式下嵌套修改不会被监控
  })
})