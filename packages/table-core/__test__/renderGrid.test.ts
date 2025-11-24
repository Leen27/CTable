import { describe, it, expect, beforeEach } from 'vitest'
import { createTable } from '../src/core/table'
import { getCoreRowModel } from '../src/utils/getCoreRowModel'
import { RenderGrid } from '../src/features/RenderGrid'

describe('RenderGrid Feature', () => {
  let container: HTMLElement

  beforeEach(() => {
    // 创建一个测试容器
    container = document.createElement('div')
    container.setAttribute('id', 'app')
    container.style.width = '800px'
    container.style.height = '600px'
    document.body.appendChild(container)
  })

  it('should create table DOM structure', () => {
    const data = [
      { id: 1, name: 'John', age: 25 },
      { id: 2, name: 'Jane', age: 30 },
    ]

    const columns = [
      { accessorKey: 'id', header: 'ID' },
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'age', header: 'Age' },
    ]

    const table = createTable({
      data,
      columns,
      getCoreRowModel: getCoreRowModel(),
      onStateChange: () => {},
      renderFallbackValue: null,
      state: {},
      _features: [RenderGrid],
    })

    // 调用渲染方法
    table.render(document.querySelector('#app') as HTMLElement)

    // 验证DOM结构
    const tableContainer = container.querySelector('.ts-table-container')
    expect(tableContainer).toBeTruthy()

    const tableHeader = container.querySelector('.ts-table-header')
    expect(tableHeader).toBeTruthy()

    const tableBody = container.querySelector('.ts-table-body')
    expect(tableBody).toBeTruthy()

    const tableFooter = container.querySelector('.ts-table-footer')
    expect(tableFooter).toBeTruthy()

    // 验证表头
    const headerCells = container.querySelectorAll('.ts-table-header-cell')
    expect(headerCells).toHaveLength(3)
    expect(headerCells[0]?.textContent).toBe('ID')
    expect(headerCells[1]?.textContent).toBe('Name')
    expect(headerCells[2]?.textContent).toBe('Age')

    // 验证行数据
    const rows = container.querySelectorAll('.ts-table-row')
    expect(rows).toHaveLength(2)

    // 验证第一行数据
    const firstRowCells = rows[0]?.querySelectorAll('.ts-table-cell')
    expect(firstRowCells).toHaveLength(3)
    expect(firstRowCells?.[0]?.textContent).toBe('1')
    expect(firstRowCells?.[1]?.textContent).toBe('John')
    expect(firstRowCells?.[2]?.textContent).toBe('25')
  })

  it('should handle empty data', () => {
    const data: any[] = []

    const columns = [
      { accessorKey: 'id', header: 'ID' },
      { accessorKey: 'name', header: 'Name' },
    ]

    const table = createTable({
      data,
      columns,
      getCoreRowModel: getCoreRowModel(),
      onStateChange: () => {},
      renderFallbackValue: null,
      state: {},
      _features: [RenderGrid],
    })

    // 调用渲染方法，传入容器
    table.render(container)

    // 验证表头存在
    const headerCells = container.querySelectorAll('.ts-table-header-cell')
    expect(headerCells).toHaveLength(2)

    // 验证没有数据行
    const rows = container.querySelectorAll('.ts-table-row')
    expect(rows).toHaveLength(0)
  })

  it('should apply correct styles to table elements', () => {
    const data = [{ id: 1, name: 'John' }]

    const columns = [
      { accessorKey: 'id', header: 'ID' },
      { accessorKey: 'name', header: 'Name' },
    ]

    const table = createTable({
      data,
      columns,
      getCoreRowModel: getCoreRowModel(),
      onStateChange: () => {},
      renderFallbackValue: null,
      state: {},
      _features: [RenderGrid],
    })

    // 调用渲染方法，传入容器
    table.render(container)

    // 验证表格容器样式
    const tableContainer = container.querySelector('.ts-table-container') as HTMLElement
    expect(tableContainer.style.display).toBe('flex')
    expect(tableContainer.style.flexDirection).toBe('column')
    expect(tableContainer.style.width).toBe('100%')
    expect(tableContainer.style.height).toBe('100%')

    // 验证表头样式
    const tableHeader = container.querySelector('.ts-table-header') as HTMLElement
    expect(tableHeader.style.position).toBe('sticky')
    expect(tableHeader.style.top).toBe('0px')
    expect(tableHeader.style.zIndex).toBe('10')

    // 验证主体样式
    const tableBody = container.querySelector('.ts-table-body') as HTMLElement
    expect(tableBody.style.flex).toContain('1')
    expect(tableBody.style.overflow).toBe('auto')
  })
})
