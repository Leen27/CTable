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
 * 监控对象变化的选项
 */
interface WatchObjectOptions {
  name?: string
  maxDepth?: number
  showStack?: boolean
  deep?: boolean  // 是否深度监控嵌套对象
}

/**
 * 深度克隆对象用于比较
 */
function deepCloneObj<T>(obj: T, visited: WeakSet<object> = new WeakSet()): T {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T
  if (obj instanceof Array) return obj.map(item => deepCloneObj(item, visited)) as unknown as T
  
  if (typeof obj === 'object') {
    // 防止循环引用
    if (visited.has(obj)) {
      return obj
    }
    visited.add(obj)
    
    const cloned = {} as T
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepCloneObj(obj[key], visited)
      }
    }
    return cloned
  }
  return obj
}

/**
 * 格式化对象输出，限制长度避免日志过多
 */
function formatObject(obj: any, maxLength: number = 200): string {
  try {
    const str = JSON.stringify(obj, null, 2)
    if (str.length > maxLength) {
      return str.substring(0, maxLength) + '...'
    }
    return str
  } catch (error) {
    // 处理循环引用的情况
    return `[Circular Object]: ${Object.keys(obj).join(', ')}`
  }
}

/**
 * 深度监控对象的所有嵌套属性
 */
function deepWatch<T extends Record<string, any>>(
  obj: T,
  path: string = '',
  name: string,
  showStack: boolean,
  maxDepth: number,
  visited: WeakSet<object> = new WeakSet()
): T {
  // 防止循环引用
  if (typeof obj === 'object' && obj !== null) {
    if (visited.has(obj)) {
      return obj
    }
    visited.add(obj)
  }

  return new Proxy(obj, {
    set(target, property, value, receiver) {
      const oldValue = target[property as keyof T]
      const propertyPath = path ? `${path}.${String(property)}` : String(property)
      
      // 如果新值是对象且需要深度监控，先对其进行代理
      let processedValue = value
      if (typeof value === 'object' && value !== null) {
        processedValue = deepWatch(value, propertyPath, name, showStack, maxDepth, visited)
      }
      
      const result = Reflect.set(target, property, processedValue, receiver)
      
      const stack = showStack ? getCallStack(maxDepth) : ''
      
      console.group(`[${name}] 对象属性被修改`)
      console.log(`属性路径: ${propertyPath}`)
      console.log(`旧值:`, oldValue)
      console.log(`新值:`, value)
      console.log(`当前对象:`, formatObject(target))
      if (showStack) {
        console.log('调用栈:')
        console.log(stack)
      }
      console.groupEnd()
      
      return result
    },
    
    get(target, property, receiver) {
      const value = target[property as keyof T]
      
      // 如果属性值是对象且需要深度监控，返回其代理版本
      if (typeof value === 'object' && value !== null && !visited.has(value)) {
        const propertyPath = path ? `${path}.${String(property)}` : String(property)
        return deepWatch(value, propertyPath, name, showStack, maxDepth, visited)
      }
      
      return Reflect.get(target, property, receiver)
    },
    
    deleteProperty(target, property) {
      const oldValue = target[property as keyof T]
      const result = Reflect.deleteProperty(target, property)
      
      const stack = showStack ? getCallStack(maxDepth) : ''
      const propertyPath = path ? `${path}.${String(property)}` : String(property)
      
      console.group(`[${name}] 对象属性被删除`)
      console.log(`属性路径: ${propertyPath}`)
      console.log(`被删除的值:`, oldValue)
      console.log(`当前对象:`, formatObject(target))
      if (showStack) {
        console.log('调用栈:')
        console.log(stack)
      }
      console.groupEnd()
      
      return result
    }
  })
}

/**
 * 创建一个可重新赋值的监控对象
 * @param targetObject 要监控的目标对象
 * @param options 监控选项
 * @returns 返回一个可重新赋值的监控对象
 */
export function createWatchObj<T extends Record<string, any>>(targetObject: T, options: WatchObjectOptions = {}) {
  const { name = 'Object', maxDepth = 2, showStack = true, deep = true } = options
  
  // 保存原始对象的副本用于比较
  let originalObject = deepCloneObj(targetObject)
  
  console.log(`[${name}] 开始监控对象:`, formatObject(targetObject))
  
  // 创建代理对象
  let proxyObject: T
  
  if (deep) {
    // 深度监控模式
    proxyObject = deepWatch(targetObject, '', name, showStack, maxDepth)
  } else {
    // 浅层监控模式
    proxyObject = new Proxy(targetObject, {
      set(target, property, value, receiver) {
        const oldValue = target[property as keyof T]
        const result = Reflect.set(target, property, value, receiver)
        
        const stack = showStack ? getCallStack(maxDepth) : ''
        
        console.group(`[${name}] 对象属性被修改`)
        console.log(`属性: ${String(property)}`)
        console.log(`旧值:`, oldValue)
        console.log(`新值:`, value)
        console.log(`当前对象:`, formatObject(target))
        if (showStack) {
          console.log('调用栈:')
          console.log(stack)
        }
        console.groupEnd()
        
        return result
      },
      
      deleteProperty(target, property) {
        const oldValue = target[property as keyof T]
        const result = Reflect.deleteProperty(target, property)
        
        const stack = showStack ? getCallStack(maxDepth) : ''
        
        console.group(`[${name}] 对象属性被删除`)
        console.log(`属性: ${String(property)}`)
        console.log(`被删除的值:`, oldValue)
        console.log(`当前对象:`, formatObject(target))
        if (showStack) {
          console.log('调用栈:')
          console.log(stack)
        }
        console.groupEnd()
        
        return result
      }
    })
  }
  
  // 返回一个可重新赋值的包装对象
  const watchWrapper = {
    _object: proxyObject,
    _name: name,
    _showStack: showStack,
    _maxDepth: maxDepth,
    _deep: deep,
    
    // 获取当前对象
    get value() {
      return this._object
    },
    
    // 设置新对象值 - 这是关键功能
    set value(newObject: T) {
      const oldObject = deepCloneObj(this._object)
      const stack = this._showStack ? getCallStack(this._maxDepth) : ''
      
      console.group(`[${this._name}] 对象被重新赋值`)
      console.log(`旧对象:`, formatObject(this._object))
      console.log(`新对象:`, formatObject(newObject))
      if (this._showStack) {
        console.log('调用栈:')
        console.log(stack)
      }
      console.groupEnd()
      
      // 重新创建代理对象
      if (this._deep) {
        this._object = deepWatch(newObject, '', this._name, this._showStack, this._maxDepth)
      } else {
        this._object = new Proxy(newObject, {
          set(target, property, value, receiver) {
            const oldValue = target[property as keyof T]
            const result = Reflect.set(target, property, value, receiver)
            
            const stack = showStack ? getCallStack(maxDepth) : ''
            
            console.group(`[${name}] 对象属性被修改`)
            console.log(`属性: ${String(property)}`)
            console.log(`旧值:`, oldValue)
            console.log(`新值:`, value)
            console.log(`当前对象:`, formatObject(target))
            if (showStack) {
              console.log('调用栈:')
              console.log(stack)
            }
            console.groupEnd()
            
            return result
          }
        })
      }
    }
  }
  
  return watchWrapper
}

/**
 * 兼容旧版本的 watchObj - 直接返回代理对象
 * 注意：这种方式不支持重新赋值追踪
 */
export function watchObj<T extends Record<string, any>>(targetObject: T, options: WatchObjectOptions = {}): T {
  return createWatchObj(targetObject, options).value
}

/**
 * 监控多个对象
 */
export function watchObjects(objects: Record<string, Record<string, any>>, options: Omit<WatchObjectOptions, 'name'> = {}) {
  const watched: Record<string, Record<string, any>> = {}
  
  for (const [name, obj] of Object.entries(objects)) {
    watched[name] = watchObj(obj, { ...options, name })
  }
  
  return watched
}

/**
 * 示例用法
 * 
 * // 监控单个对象
 * const myObj = watchObj({ a: 1, b: { c: 2 } }, { name: 'myObject', deep: true })
 * myObj.a = 10 // 会打印属性修改信息
 * myObj.b.c = 20 // 深度监控也会打印嵌套属性修改
 * 
 * // 使用可重新赋值的包装器
 * const watchedObj = createWatchObj({ x: 1, y: 2 }, { name: 'watchedObject' })
 * watchedObj.value.x = 100 // 监控属性修改
 * watchedObj.value = { x: 200, y: 300 } // 监控对象重新赋值
 * 
 * // 监控多个对象
 * const { obj1, obj2 } = watchObjects({
 *   obj1: { name: 'Alice', age: 25 },
 *   obj2: { title: 'Hello', count: 0 }
 * })
 */