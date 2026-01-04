/**
 * 监控数组变化的工具函数
 * 当数组被修改时会打印修改的代码位置和值
 */

interface WatchArrayOptions {
  name?: string
  maxDepth?: number
  showStack?: boolean
}

/**
 * 获取调用栈信息
 */
function getCallStack(depth: number = 3): string {
  const stack = new Error().stack
  if (!stack) return '无法获取调用栈'
  
  const lines = stack.split('\n')
  // 跳过前几个栈帧（Error构造函数、getCallStack、watchArr等）
  const relevantLines = lines.slice(3, 3 + depth)
  
  return relevantLines
    .map(line => {
      // 解析栈信息，提取文件名、行号等
      const match = line.match(/at\s+(.*)\s+\((.*):(\d+):(\d+)\)/) ||
                   line.match(/at\s+(.*):(\d+):(\d+)/)
      
      if (match) {
      if (match.length === 5) {
        // 格式: at functionName (file:line:column)
        const [, funcName, file, line, col] = match
        const fileName = file?.split('/').pop() || file || 'unknown'
        return `  ${funcName} (${fileName}:${line}:${col})`
      } else if (match.length === 4) {
        // 格式: at file:line:column
        const [, file, line, col] = match
        const fileName = file?.split('/').pop() || file || 'unknown'
        return `  ${fileName}:${line}:${col}`
      }
    }
      return `  ${line.trim()}`
    })
    .join('\n')
}

/**
 * 深度克隆数组用于比较
 */
function deepClone<T>(arr: T[]): T[] {
  return JSON.parse(JSON.stringify(arr))
}

/**
 * 格式化数组输出，限制长度避免日志过多
 */
function formatArray(arr: any[], maxLength: number = 100): string {
  const str = JSON.stringify(arr)
  if (str.length > maxLength) {
    return str.substring(0, maxLength) + '...'
  }
  return str
}

/**
 * 创建一个可重新赋值的监控数组
 * @param targetArray 要监控的目标数组
 * @param options 监控选项
 * @returns 返回一个可重新赋值的监控数组对象
 */
export function createWatchArr<T>(targetArray: T[], options: WatchArrayOptions = {}) {
  const { name = 'Array', maxDepth = 2, showStack = true } = options
  
  // 保存原始数组的副本用于比较
  let originalArray = deepClone(targetArray)
  
  console.log(`[${name}] 开始监控数组:`, formatArray(targetArray))
  
  // 创建代理数组
  const proxyArray = new Proxy(targetArray, {
    set(target, property, value, receiver) {
      const oldValue = target[property as keyof T[]]
      const result = Reflect.set(target, property, value, receiver)
      
      // 只监控数组索引的修改和长度变化
      if (property !== 'length' && !isNaN(Number(property))) {
        const index = Number(property)
        const stack = showStack ? getCallStack(maxDepth) : ''
        
        console.group(`[${name}] 数组元素被修改`)
        console.log(`索引: ${index}`)
        console.log(`旧值:`, oldValue)
        console.log(`新值:`, value)
        console.log(`修改后数组:`, formatArray(target))
        if (showStack) {
          console.log('调用栈:')
          console.log(stack)
        }
        console.groupEnd()
      } else if (property === 'length') {
        const oldLength = originalArray.length
        const newLength = target.length
        
        if (oldLength !== newLength) {
          const stack = showStack ? getCallStack(maxDepth) : ''
          
          console.group(`[${name}] 数组长度变化`)
          console.log(`旧长度: ${oldLength}`)
          console.log(`新长度: ${newLength}`)
          console.log(`当前数组:`, formatArray(target))
          if (showStack) {
            console.log('调用栈:')
            console.log(stack)
          }
          console.groupEnd()
        }
      }
      
      // 更新原始数组副本
      originalArray = deepClone(target)
      return result
    },
    
    get(target, property, receiver) {
      const value = target[property as keyof T[]]
      
      // 监控数组方法的调用
      if (typeof value === 'function') {
        return function(this: any, ...args: any[]) {
          const methodName = property as string
          const oldArray = deepClone(target)
          
          // 使用正确的 this 上下文调用原始方法
          const result = (value as Function).apply(target, args)
          
          // 检查数组是否发生变化
          const newArray = deepClone(target)
          const hasChanged = JSON.stringify(oldArray) !== JSON.stringify(newArray)
          
          if (hasChanged) {
            const stack = showStack ? getCallStack(maxDepth) : ''
            
            console.group(`[${name}] 数组方法被调用: ${methodName}`)
            console.log(`参数:`, args)
            console.log(`修改前:`, formatArray(oldArray))
            console.log(`修改后:`, formatArray(newArray))
            if (showStack) {
              console.log('调用栈:')
              console.log(stack)
            }
            console.groupEnd()
          }
          
          originalArray = newArray
          return result
        }
      }
      
      return value
    }
  })
  
  // 返回一个可重新赋值的包装对象
  const watchWrapper = {
    _array: proxyArray,
    _name: name,
    _showStack: showStack,
    _maxDepth: maxDepth,
    
    // 获取当前数组
    get value() {
      return this._array
    },
    
    // 设置新数组值 - 这是关键功能
    set value(newArray: T[]) {
      const oldArray = deepClone(this._array)
      const stack = this._showStack ? getCallStack(this._maxDepth) : ''
      
      console.group(`[${this._name}] 数组被重新赋值`)
      console.log(`旧数组:`, formatArray(this._array))
      console.log(`新数组:`, formatArray(newArray))
      if (this._showStack) {
        console.log('调用栈:')
        console.log(stack)
      }
      console.groupEnd()
      
      // 清空原数组并复制新元素
      this._array.length = 0
      this._array.push(...newArray)
    }
  }
  
  return watchWrapper
}

/**
 * 兼容旧版本的 watchArr - 直接返回代理数组
 * 注意：这种方式不支持重新赋值追踪
 */
export function watchArr<T>(targetArray: T[], options: WatchArrayOptions = {}): T[] {
  return createWatchArr(targetArray, options).value
}

/**
 * 监控多个数组
 */
export function watchArrays(arrays: Record<string, any[]>, options: Omit<WatchArrayOptions, 'name'> = {}) {
  const watched: Record<string, any[]> = {}
  
  for (const [name, arr] of Object.entries(arrays)) {
    watched[name] = watchArr(arr, { ...options, name })
  }
  
  return watched
}

/**
 * 示例用法
 * 
 * // 监控单个数组
 * const myArr = watchArr([1, 2, 3], { name: 'myArray' })
 * myArr.push(4) // 会打印调用信息
 * myArr[0] = 10 // 会打印元素修改信息
 * 
 * // 监控多个数组
 * const { arr1, arr2 } = watchArrays({
 *   arr1: [1, 2, 3],
 *   arr2: ['a', 'b', 'c']
 * })
 */