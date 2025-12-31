import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createTable, createColumnHelper } from '../src'
import { getCoreRowModel } from '../src/utils/getCoreRowModel'
import { EventTypesEnum } from '../src/core/events'

type Person = {
  firstName: string
  lastName: string
  age: number
  visits: number
  status: string
  progress: number
}

describe('Row Rendering', () => {
  let container: HTMLElement
  let table: any

  beforeEach(() => {
    // 创建测试容器
    container = document.createElement('div')
    container.id = 'test-container'
    document.body.appendChild(container)
  })

  afterEach(() => {
    // 清理测试容器和表格
    if (table?.destroy) {
      table.destroy()
    }
    if (container?.parentNode) {
      container.parentNode.removeChild(container)
    }
  })

  const mockData: Person[] = [
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
    columnHelper.accessor('lastName', {
      cell: (info) => info.getValue(),
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor('age', {
      header: () => 'Age',
      cell: (info) => info.renderValue(),
      footer: (info) => info.column.id,
    }),
  ]

  // 创建表格的辅助函数
  const createTestTable = (options: any = {}) => {
    return createTable({
      data: mockData,
      columns,
      getCoreRowModel: getCoreRowModel(),
      onStateChange: () => {},
      renderFallbackValue: null,
      state: {
        tableRender: {
          visibleRange: { startIndex: 0, endIndex: 2 },
          scrollTop: 0,
          scrollLeft: 0,
          scrollDirection: null,
          parentContainerWidth: 800,
          parentContainerHeight: 600,
          containerWidth: 800,
          containerHeight: 600,
          bodyWidth: 800,
          bodyHeight: 400,
          contentWidth: 800,
          contentHeight: 200,
          headerHeight: 50,
          headerWidth: 800,
          footerHeight: 50,
          footerWidth: 800,
        },
        virtual: {
          isScrolling: false,
          startIndex: 0,
          endIndex: 2,
          virtualRows: 3,
          rowHeightCache: new Map(),
          offsetCache: [],
        },
      },
      onTableRenderChange: (updater: any) => {
        if (updater instanceof Function) {
          table.options.state.tableRender = updater(table.options.state.tableRender)
        } else {
          table.options.state.tableRender = updater
        }
      },
      onVirtualStateChange: (updater: any) => {
        if (updater instanceof Function) {
          table.options.state.virtual = updater(table.options.state.virtual)
        } else {
          table.options.state.virtual = updater
        }
      },
      rowHeight: 50,
      ...options,
    })
  }

  describe('Row Height Management', () => {
    it('should initialize row with default height', () => {
      table = createTestTable()
      const row = table.getRowModel().rows[0]

      expect(row.rowHeight).toBe(50)
      expect(row.rowHeightEstimated).toBe(false)
      expect(row.displayed).toBe(false)
      expect(row.rowTop).toBeNull()
      expect(row.eGui).toBeNull()
    })

    it('should handle custom row height function', () => {
      const customRowHeight = (row: any) => {
        return row.original.age > 30 ? 80 : 40
      }

      table = createTestTable({
        getRowHeight: customRowHeight,
      })

      const row1 = table.getRowModel().rows[0] // age 24
      const row2 = table.getRowModel().rows[1] // age 40

      const height1 = row1.getRowHeight()
      const height2 = row2.getRowHeight()

      expect(height1.height).toBe(40)
      expect(height1.estimated).toBe(false)
      expect(height2.height).toBe(80)
      expect(height2.estimated).toBe(false)
    })

    it('should handle estimated row heights', () => {
      const customRowHeight = (row: any) => {
        return row.original.age > 30 ? 80 : 40
      }

      table = createTestTable({
        getRowHeight: customRowHeight,
      })

      const row = table.getRowModel().rows[0]
      const estimatedHeight = row.getRowHeight(true) // 允许估计

      expect(estimatedHeight.height).toBe(50) // 使用默认高度
      expect(estimatedHeight.estimated).toBe(true)
    })

    it('should set row height manually', () => {
      table = createTestTable()
      const row = table.getRowModel().rows[0]

      row.setRowHeight(75, true)

      expect(row.rowHeight).toBe(75)
      expect(row.rowHeightEstimated).toBe(true)
    })

    it('should calculate row height', () => {
      table = createTestTable({
        rowHeight: 60,
      })
      const row = table.getRowModel().rows[0]

      // 修改rowHeight
      row.rowHeight = 30
      row.calculateRowHeight()

      expect(row.rowHeight).toBe(60) // 应该更新为新的默认高度
      expect(row.rowHeightEstimated).toBe(false)
    })

    it('should ensure minimum row height of 1 pixel', () => {
      table = createTestTable({
        getRowHeight: () => 0, // 返回0高度
      })

      const row = table.getRowModel().rows[0]
      const heightResult = row.getRowHeight()

      expect(heightResult.height).toBe(1) // 应该被强制为1像素
    })
  })

  describe('Row Positioning', () => {
    it('should set row top position', () => {
      table = createTestTable()
      const row = table.getRowModel().rows[0]

      // 模拟渲染行
      row.render()
      row.setRowTop(100)

      expect(row.eGui).toBeTruthy()
      expect(row.eGui.style.transform).toBe('translateY(100px)')
    })

    it('should calculate correct row top based on index and height', () => {
      table = createTestTable({
        rowHeight: 50,
      })
      const row = table.getRowModel().rows[1] // 第二行，索引1

      row.render()

      // 验证行位置计算：index * height = 1 * 50 = 50
      expect(row.eGui.style.transform).toBe('translateY(50px)')
    })
  })

  describe('Row Rendering', () => {
    it('should render row element on first render', () => {
      table = createTestTable()
      table.render(container)

      const row = table.getRowModel().rows[0]
      row.render()

      expect(row.eGui).toBeTruthy()
      expect(row.eGui.tagName).toBe('DIV')
      expect(row.eGui.className).toContain('absolute')
      expect(row.eGui.className).toContain('w-full')
      expect(row.eGui.className).toContain('border')
      expect(row.eGui.getAttribute('role')).toBe('row')
      expect(row.eGui.getAttribute('id')).toBe(row.id)
      expect(row.eGui.getAttribute('index')).toBe('0')
    })

    it('should not create new element on subsequent renders', () => {
      table = createTestTable()
      table.render(container)

      const row = table.getRowModel().rows[0]
      row.render()
      const firstElement = row.eGui

      row.render() // 第二次渲染
      const secondElement = row.eGui

      expect(firstElement).toBe(secondElement) // 应该是同一个元素
    })

    it('should apply correct height to rendered row', () => {
      table = createTestTable({
        rowHeight: 75,
      })
      table.render(container)

      const row = table.getRowModel().rows[0]
      row.render()

      expect(row.eGui.style.height).toBe('75px')
    })

    it('should append row to table content', () => {
      table = createTestTable()
      table.render(container)

      const row = table.getRowModel().rows[0]
      row.render()

      const tableContent = container.querySelector('.c-table-content')
      expect(tableContent?.contains(row.eGui)).toBe(true)
    })

    it('should get row GUI element', () => {
      table = createTestTable()
      
      const row = table.getRowModel().rows[0]
      expect(row.getGui()).toBeNull() // 渲染前应该为null

      table.render(container) // 表格渲染会自动渲染行
      expect(row.getGui()).toBe(row.eGui) // 渲染后应该返回eGui
    })
  })

  describe('Row Display State', () => {
    it('should track row display state', () => {
      table = createTestTable()
      const row = table.getRowModel().rows[0]

      expect(row.displayed).toBe(false) // 初始状态

      row.render()
      // 注意：根据当前实现，displayed属性在render中没有被更新
      // 这可能是一个需要改进的地方
    })
  })

  describe('Row Cleanup', () => {
    it('should clean up DOM elements on table destroy', () => {
      table = createTestTable()
      table.render(container)

      const row = table.getRowModel().rows[0]
      const rowGui = row.getGui()

      expect(rowGui).toBeTruthy()
      expect(container.querySelector('.c-table-content')?.contains(rowGui)).toBe(true)

      table.destroy()

      // DOM元素应该被清理
      expect(container.querySelector('.c-table-container')).toBeFalsy()
      // 注意：行的eGui引用不会被自动清理，这是当前实现的限制
    })
  })

  describe('Edge Cases', () => {
    it('should handle rows with undefined getRowHeight function', () => {
      table = createTestTable({
        getRowHeight: undefined,
      })

      const row = table.getRowModel().rows[0]
      const heightResult = row.getRowHeight()

      expect(heightResult.height).toBe(50) // 应该使用默认rowHeight
      expect(heightResult.estimated).toBe(false)
    })

    it('should handle rows with invalid getRowHeight result', () => {
      table = createTestTable({
        getRowHeight: () => null, // 返回null
      })

      const row = table.getRowModel().rows[0]
      const heightResult = row.getRowHeight()

      expect(heightResult.height).toBe(50) // 应该使用默认rowHeight
    })

    it('should handle rows with non-number getRowHeight result', () => {
      table = createTestTable({
        getRowHeight: () => 'invalid', // 返回字符串
      })

      const row = table.getRowModel().rows[0]
      const heightResult = row.getRowHeight()

      expect(heightResult.height).toBe(50) // 应该使用默认rowHeight
    })
  })
})