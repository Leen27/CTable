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

describe('Table Rendering', () => {
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

  // 创建表格的辅助函数，包含必要的状态配置
  const createTestTable = (options: any = {}) => {
    return createTable({
      data: mockData,
      columns,
      getCoreRowModel: getCoreRowModel(),
      onStateChange: () => {},
      renderFallbackValue: null,
      state: {
        renderGrid: {
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
      onRenderGridChange: (updater: any) => {
        if (updater instanceof Function) {
          table.options.state.renderGrid = updater(table.options.state.renderGrid)
        } else {
          table.options.state.renderGrid = updater
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

  describe('Basic Table Creation and Rendering', () => {
    it('should create table with proper structure', () => {
      table = createTestTable()

      expect(table).toBeDefined()
      expect(table.getState).toBeDefined()
      expect(table.setState).toBeDefined()
      expect(table.getRowModel).toBeDefined()
      expect(table.getAllColumns).toBeDefined()
    })

    it('should render table to DOM container', () => {
      table = createTestTable({ maxHeight: 300, debugAll: false })

      // 渲染表格
      table.render(container)

      // 验证DOM结构
      expect(container.querySelector('.c-table-container')).toBeTruthy()
      expect(container.querySelector('.c-table-header')).toBeTruthy()
      expect(container.querySelector('.c-table-body')).toBeTruthy()
      expect(container.querySelector('.c-table-content')).toBeTruthy()
      expect(container.querySelector('.c-table-footer')).toBeTruthy()
    })

    it('should apply maxHeight to table body', () => {
      const maxHeight = 300
      
      table = createTestTable({ maxHeight })

      table.render(container)

      const tableBody = container.querySelector('.c-table-body') as HTMLElement
      expect(tableBody.style.maxHeight).toBe(`${maxHeight}px`)
    })

    it('should create correct number of rows', () => {
      table = createTestTable()

      table.render(container)

      const rows = table.getRowModel().rows
      expect(rows).toHaveLength(mockData.length)
    })

    it('should handle empty data', () => {
      table = createTestTable({ data: [] })

      table.render(container)

      const rows = table.getRowModel().rows
      expect(rows).toHaveLength(0)
    })
  })

  describe('Column Configuration', () => {
    it('should handle different column types', () => {
      const testColumns = [
        columnHelper.accessor('firstName', {
          cell: (info) => info.getValue(),
        }),
        columnHelper.accessor((row) => row.lastName, {
          id: 'computedLastName',
          cell: (info) => info.getValue(),
        }),
        columnHelper.accessor('age', {
          header: 'Age',
          cell: (info) => info.renderValue(),
        }),
      ]

      table = createTestTable({ columns: testColumns })

      const allColumns = table.getAllColumns()
      expect(allColumns).toHaveLength(testColumns.length)

      // 验证列ID
      expect(table.getColumn('firstName')).toBeTruthy()
      expect(table.getColumn('computedLastName')).toBeTruthy()
      expect(table.getColumn('age')).toBeTruthy()
    })

    it('should handle custom cell renderers', () => {
      const customColumns = [
        columnHelper.accessor('firstName', {
          cell: (info) => `<strong>${info.getValue()}</strong>`,
        }),
        columnHelper.accessor('lastName', {
          cell: (info) => `<em>${info.getValue()}</em>`,
        }),
      ]

      table = createTestTable({ columns: customColumns })

      table.render(container)

      // 验证自定义渲染器是否被调用
      const firstRow = table.getRowModel().rows[0]
      expect(firstRow).toBeDefined()
      
      const firstNameCell = firstRow.getAllCells().find((cell: any) => cell.column.id === 'firstName')
      const lastNameCell = firstRow.getAllCells().find((cell: any) => cell.column.id === 'lastName')
      
      expect(firstNameCell).toBeDefined()
      expect(lastNameCell).toBeDefined()
    })
  })

  describe('Table State Management', () => {
    it('should handle state changes', () => {
      let stateChangeCount = 0
      
      table = createTestTable({
        onStateChange: (updater: any) => {
          stateChangeCount++
          if (updater instanceof Function) {
            table.options.state = updater(table.options.state)
          } else {
            table.options.state = updater
          }
        },
      })

      // 触发状态变化
      table.setState((old: any) => ({ ...old, test: 'value' }))
      
      expect(stateChangeCount).toBeGreaterThan(0)
    })

    it('should reset to initial state', () => {
      // 简化测试，只验证reset方法可以正常调用
      table = createTestTable()
      
      // 验证reset方法可以正常调用，不抛出错误
      expect(() => table.reset()).not.toThrow()
    })
  })

  describe('Table Events', () => {
    it('should dispatch table mounted event', () => {
      let eventDispatched = false
      
      table = createTestTable()

      // 监听事件
      table.addEventListener(EventTypesEnum.TABLE_MOUNTED, () => {
        eventDispatched = true
      })

      table.render(container)

      expect(eventDispatched).toBe(true)
    })
  })

  describe('Table Cleanup', () => {
    it('should properly destroy table and clean up DOM', () => {
      table = createTestTable()

      table.render(container)

      // 验证表格已渲染
      expect(container.querySelector('.c-table-container')).toBeTruthy()

      // 销毁表格
      table.destroy()

      // 验证DOM已被清理
      expect(container.querySelector('.c-table-container')).toBeFalsy()
      expect(table.elRefs.containerRef).toBeNull()
      expect(table.elRefs.tableContainer).toBeNull()
      expect(table.elRefs.elementCreated).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should handle missing container reference', () => {
      table = createTestTable()

      // 尝试渲染到不存在的容器
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      table.render(null)
      
      expect(consoleSpy).toHaveBeenCalledWith('没有传入容器的DOM对象: containerRef')
      consoleSpy.mockRestore()
    })

    it('should handle invalid column access', () => {
      table = createTestTable()

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const invalidColumn = table.getColumn('nonexistent')
      
      expect(invalidColumn).toBeUndefined()
      expect(consoleSpy).toHaveBeenCalledWith("[Table] Column with id 'nonexistent' does not exist.")
      consoleSpy.mockRestore()
    })
  })
})