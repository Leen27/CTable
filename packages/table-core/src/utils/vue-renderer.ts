import { createApp, h, App, Component, createVNode, defineComponent, render } from 'vue'
import { RowData } from '../types'
import { CellContext } from '../core/cell'

// 错误处理函数（模拟 ag-grid-community 的 _error 函数）
function _error(code: number, params: any): void {
  console.error(`Error ${code}:`, params)
  throw new Error(`Vue Component Error ${code}: ${JSON.stringify(params)}`)
}

export interface VueComponentRendererOptions<TData extends RowData, TValue> {
  component: Component | string
  props?: Record<string, any>
  context: CellContext<TData, TValue>
}

/**
 * Vue 组件工具类，提供组件定义获取、搜索和挂载功能
 */
export class VueComponentUtils {
  /**
   * 获取组件定义
   */
  private static getComponentDefinition(component: any, parent: any) {
    let componentDefinition: any

    // 当通过字符串引用组件时 - 例如: cellRenderer: 'MyComponent'
    if (typeof component === 'string') {
      // 在 Vue 中查找组件定义
      componentDefinition = this.searchForComponentInstance(parent, component)
    } else {
      componentDefinition = { extends: defineComponent({ ...component }) }
    }
    
    if (!componentDefinition) {
      _error(114, { component })
    }

    if (componentDefinition.extends) {
      if (componentDefinition.extends.setup) {
        componentDefinition.setup = componentDefinition.extends.setup
      }
      componentDefinition.extends.props = this.addParamsToProps(componentDefinition.extends.props)
    } else {
      componentDefinition.props = this.addParamsToProps(componentDefinition.props)
    }

    return componentDefinition
  }

  /**
   * 向 props 中添加 params 属性
   */
  private static addParamsToProps(props: any) {
    if (!props || (Array.isArray(props) && props.indexOf('params') === -1)) {
      props = ['params', ...(props ? props : [])]
    } else if (typeof props === 'object' && !props.params) {
      /* tslint:disable:no-string-literal */
      props['params'] = {
        type: Object,
      }
    }

    return props
  }

  /**
   * 搜索组件实例 - 4层查找策略
   */
  public static searchForComponentInstance(parent: any, component: any, maxDepth = 10, suppressError = false) {
    let componentInstance: any = null

    // 第一层：局部 components
    let depth = 0
    let currentParent = parent?.parent
    while (!componentInstance && currentParent && currentParent.components && ++depth < maxDepth) {
      if (currentParent.components && currentParent.components![component as any]) {
        componentInstance = currentParent.components![component as any]
      }
      currentParent = currentParent.parent
    }

    // 第二层：$options.components (Options API)
    depth = 0
    currentParent = parent?.parent
    while (!componentInstance && currentParent && currentParent.$options && ++depth < maxDepth) {
      const currentParentAsThis = currentParent as any
      if (
        currentParentAsThis.$options &&
        currentParentAsThis.$options.components &&
        currentParentAsThis.$options.components![component as any]
      ) {
        componentInstance = currentParentAsThis.$options.components![component as any]
      } else if (currentParentAsThis[component]) {
        componentInstance = currentParentAsThis[component]
      }
      currentParent = currentParent.parent
    }

    // 第三层：composition API 的 exposed
    depth = 0
    currentParent = parent?.parent
    while (!componentInstance && currentParent && ++depth < maxDepth) {
      if (currentParent.exposed) {
        const currentParentAsThis = currentParent as any
        if (currentParentAsThis.exposed && currentParentAsThis.exposed[component as any]) {
          componentInstance = currentParentAsThis.exposed![component as any]
        } else if (currentParentAsThis[component]) {
          componentInstance = currentParentAsThis[component]
        }
      }
      currentParent = currentParent.parent
    }

    // 第四层：全局注册的组件
    if (!componentInstance) {
      const components = parent?.appContext?.components
      if (components && components[component]) {
        componentInstance = components[component]
      }
    }

    if (!componentInstance && !suppressError) {
      _error(114, { component })
      return null
    }
    return componentInstance
  }

  /**
   * 创建并挂载组件（简化版本，使用 createApp）
   */
  public static createAndMountComponent(component: any, params: any, parent: any, provides: any) {
    try {
      let componentToRender: Component
      
      // 如果是字符串，先查找组件定义
      if (typeof component === 'string') {
        componentToRender = this.searchForComponentInstance(parent, component, 10, true)
        if (!componentToRender) {
          throw new Error(`Component '${component}' not found`)
        }
      } else {
        componentToRender = component
      }

      // 创建容器元素
      const container = document.createElement('div')
      
      // 使用 createApp 创建应用
      const app = createApp({
        render: () => h(componentToRender, { params: Object.freeze(params) })
      })

      // 设置上下文
      if (parent?.appContext) {
        app._context = { ...parent.appContext, ...app._context }
      }

      // 挂载
      app.mount(container)

      // 返回销毁函数和元素
      const destroy = () => {
        try {
          app.unmount()
        } catch (error) {
          console.error('Error unmounting app:', error)
        }
      }

      return {
        componentInstance: app._instance?.proxy,
        element: container,
        destroy,
      }
    } catch (error) {
      console.error('Failed to create and mount component:', error)
      return undefined
    }
  }

  /**
   * 挂载组件到 DOM
   */
  public static mount(component: any, props: any, parent: any, provides: any) {
    let vNode: any = createVNode(component, props)

    // 确保 appContext 存在且包含必要的属性
    const appContext = parent?.appContext || {
      config: { globalProperties: {} },
      provides: provides || {},
      components: {},
      directives: {},
      filters: {},
      mixins: [],
      optionsCache: new WeakMap(),
      propsCache: new WeakMap(),
      emitsCache: new WeakMap()
    }
    
    vNode.appContext = { ...appContext, provides: { ...appContext.provides, ...provides } }

    let el: any = document.createDocumentFragment()
    
    try {
      render(vNode, el)
    } catch (error) {
      console.error('Vue mount error:', error)
      // 如果渲染失败，返回一个空的销毁函数
      return {
        vNode,
        destroy: () => {},
        el: document.createDocumentFragment()
      }
    }

    const destroy = () => {
      if (el) {
        try {
          render(null, el)
        } catch (error) {
          console.error('Vue unmount error:', error)
        }
      }
      el = null
      vNode = null
    }

    return { vNode, destroy, el }
  }
}

/**
 * Vue 组件渲染器
 * 用于在表格单元格中渲染 Vue 组件
 */
export class VueComponentRenderer {
  private app: App | null = null
  private container: HTMLElement | null = null

  /**
   * 渲染 Vue 组件到指定的 DOM 元素
   * 支持字符串组件引用和组件对象
   */
  render<TData extends RowData, TValue>(
    component: Component | string,
    props: Record<string, any>,
    container: HTMLElement,
    parent?: any // 父组件上下文，用于字符串组件引用
  ): void {
    // 清理之前的实例
    this.destroy()

    this.container = container

    try {
      let componentToRender: Component
      
      // 如果是字符串组件引用，先查找组件定义
      if (typeof component === 'string') {
        if (!parent) {
          throw new Error('Parent context is required for string component references')
        }
        
        const componentDefinition = VueComponentUtils.searchForComponentInstance(parent, component, 10, true)
        if (!componentDefinition) {
          throw new Error(`Component '${component}' not found`)
        }
        componentToRender = componentDefinition
      } else {
        componentToRender = component
      }

      // 使用 createApp 方式，这是更稳定的方法
      this.app = createApp({
        render: () => h(componentToRender, props)
      })

      // 如果有父上下文，设置 appContext
      if (parent?.appContext) {
        this.app._context = { ...parent.appContext, ...this.app._context }
      }

      // 挂载到容器
      this.app.mount(container)
    } catch (error) {
      console.error('Failed to render Vue component:', error)
      // 降级处理：显示错误信息
      const errorMessage = error instanceof Error ? error.message : String(error)
      container.innerHTML = `<span style="color: red;">Component Error: ${errorMessage}</span>`
    }
  }

  /**
   * 销毁 Vue 实例
   */
  destroy(): void {
    // 清理 app 方式
    if (this.app) {
      this.app.unmount()
      this.app = null
    }
    
    if (this.container) {
      this.container.innerHTML = ''
      this.container = null
    }
  }

  /**
   * 检查是否为 Vue 组件
   */
  static isVueComponent(component: any): boolean {
    if (!component || typeof component !== 'object') {
      return false
    }
    
    // 检查是否是 Vue 组件定义
    return !!(
      component.render ||
      component.template ||
      component.setup ||
      component.__file ||  // Vue 3 组件通常有这个属性
      component.name ||     // 组件名称
      (component.extends && (component.extends.render || component.extends.template || component.extends.setup))
    )
  }
}

/**
 * 创建单元格内容渲染器
 * 支持字符串、函数和 Vue 组件
 * 新增对字符串组件引用的支持
 */
export function createCellRenderer<TData extends RowData, TValue>(
  cellContent: any,
  context: CellContext<TData, TValue>,
  container: HTMLElement,
  parentContext?: any // 父组件上下文，用于字符串组件引用
): void {
  // 清理容器
  container.innerHTML = ''

  // 如果是 Vue 组件（对象形式）
  if (VueComponentRenderer.isVueComponent(cellContent)) {
    const renderer = new VueComponentRenderer()
    // 传递表格上下文数据作为 props
    const props = {
      getValue: context.getValue,
      renderValue: context.renderValue,
      row: context.row,
      column: context.column,
      cell: context.cell,
      table: context.table
    }
    
    try {
      renderer.render(cellContent, props, container, parentContext)
      // 存储渲染器实例以便后续清理
      ;(container as any).__vueRenderer = renderer
    } catch (error) {
      console.error('Failed to create cell renderer:', error)
      container.innerHTML = `<span style="color: red;">Renderer Error</span>`
    }
    return
  }

  // 如果是函数，调用函数获取内容
  if (typeof cellContent === 'function') {
    const result = cellContent(context)
    
    // 如果函数返回的是 Vue 组件
    if (VueComponentRenderer.isVueComponent(result)) {
      const renderer = new VueComponentRenderer()
      const props = {
        getValue: context.getValue,
        renderValue: context.renderValue,
        row: context.row,
        column: context.column,
        cell: context.cell,
        table: context.table
      }
      
      try {
        renderer.render(result, props, container, parentContext)
        ;(container as any).__vueRenderer = renderer
      } catch (error) {
        console.error('Failed to create cell renderer from function result:', error)
        container.innerHTML = `<span style="color: red;">Renderer Error</span>`
      }
      return
    }
    
    // 如果返回的是 HTML 字符串
    if (typeof result === 'string' && result.includes('<')) {
      container.innerHTML = result
      return
    }
    
    // 普通文本内容
    container.textContent = result ?? ''
    return
  }

  // 如果是 HTML 字符串
  if (typeof cellContent === 'string' && cellContent.includes('<')) {
    container.innerHTML = cellContent
    return
  }

  // 普通文本内容
  container.textContent = cellContent ?? ''
}

/**
 * 清理单元格中的 Vue 实例
 */
export function cleanupCellRenderer(container: HTMLElement): void {
  const renderer = (container as any).__vueRenderer
  if (renderer) {
    renderer.destroy()
    ;(container as any).__vueRenderer = null
  }
}

/**
 * 创建 Vue 组件渲染器选项
 */
function createVueRendererOptions<TData extends RowData, TValue>(
  component: Component | string,
  props: Record<string, any> = {},
  context: CellContext<TData, TValue>
): VueComponentRendererOptions<TData, TValue> {
  return {
    component,
    props: {
      ...props,
      getValue: context.getValue,
      renderValue: context.renderValue,
      row: context.row,
      column: context.column,
      cell: context.cell,
      table: context.table
    },
    context
  }
}

/**
 * 从父组件上下文中获取组件
 */
function getComponentFromContext(
  componentName: string,
  parentContext: any
): Component | null {
  return VueComponentUtils.searchForComponentInstance(parentContext, componentName, 10, true)
}

/**
 * 检查是否需要父上下文
 */
function requiresParentContext(component: any): boolean {
  return typeof component === 'string'
}

// 工具函数集合
export const VueRendererUtils = {
  createVueRendererOptions,
  getComponentFromContext,
  requiresParentContext
}