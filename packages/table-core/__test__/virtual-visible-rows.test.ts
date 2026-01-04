import { describe, it, expect, beforeEach } from 'vitest'
import { Table } from '../src'

describe('Virtual Visible Rows', () => {
  let table: Table<any>
  
  const mockData = [
    { id: 1, name: 'Row 1' },
    { id: 2, name: 'Row 2' },
    { id: 3, name: 'Row 3' },
    { id: 4, name: 'Row 4' },
    { id: 5, name: 'Row 5' },
    { id: 6, name: 'Row 6' },
    { id: 7, name: 'Row 7' },
    { id: 8, name: 'Row 8' },
    { id: 9, name: 'Row 9' },
    { id: 10, name: 'Row 10' },
  ]

  beforeEach(() => {
    table = new Table({
      data: mockData,
      columns: [
        { accessorKey: 'id', header: 'ID' },
        { accessorKey: 'name', header: 'Name' },
      ],
      rowHeight: 50,
      overscan: 2,
    })
  })

  it('should have getVisibleRowModel method', () => {
    expect(table.getVisibleRowModel).toBeDefined()
    expect(typeof table.getVisibleRowModel).toBe('function')
  })

  it('should return empty rows when bodyHeight is 0', () => {
    const visibleRowModel = table.getVisibleRowModel()
    expect(visibleRowModel.rows).toEqual([])
    expect(visibleRowModel.flatRows).toEqual([])
    expect(Object.keys(visibleRowModel.rowsById)).toEqual([])
  })

  it('should return all rows when virtual state covers all data', () => {
    // 模拟虚拟状态覆盖所有数据
    table.setState((old: any) => ({
      ...old,
      tableRender: {
        ...old.tableRender,
        bodyHeight: 500,
      },
      virtual: {
        startIndex: 0,
        endIndex: 9,
        isScrolling: false,
        virtualRows: 10,
      },
    }))

    const visibleRowModel = table.getVisibleRowModel()
    
    // 由于 overscan 为 2，应该包含所有行（0-9 + 2 overscan = 所有行）
    expect(visibleRowModel.rows.length).toBe(10)
    expect(visibleRowModel.rows[0].id).toBe('1')
    expect(visibleRowModel.rows[9].id).toBe('10')
  })

  it('should include overscan rows in visible model', () => {
    // 模拟虚拟状态只显示中间部分
    table.setState((old: any) => ({
      ...old,
      tableRender: {
        ...old.tableRender,
        bodyHeight: 200,
      },
      virtual: {
        startIndex: 3,
        endIndex: 5,
        isScrolling: false,
        virtualRows: 3,
      },
    }))

    const visibleRowModel = table.getVisibleRowModel()
    
    // 原始范围是 3-5，加上 overscan 2，应该是 1-7
    expect(visibleRowModel.rows.length).toBe(7)
    expect(visibleRowModel.rows[0].id).toBe('2') // index 1
    expect(visibleRowModel.rows[6].id).toBe('8') // index 7
  })

  it('should handle edge cases with overscan at boundaries', () => {
    // 模拟虚拟状态在开始位置
    table.setState((old: any) => ({
      ...old,
      tableRender: {
        ...old.tableRender,
        bodyHeight: 200,
      },
      virtual: {
        startIndex: 0,
        endIndex: 2,
        isScrolling: false,
        virtualRows: 3,
      },
    }))

    const visibleRowModel = table.getVisibleRowModel()
    
    // 开始位置不能小于0，所以应该是 0-4
    expect(visibleRowModel.rows.length).toBe(5)
    expect(visibleRowModel.rows[0].id).toBe('1') // index 0
    expect(visibleRowModel.rows[4].id).toBe('5') // index 4
  })

  it('should create correct rowsById mapping', () => {
    table.setState((old: any) => ({
      ...old,
      tableRender: {
        ...old.tableRender,
        bodyHeight: 200,
      },
      virtual: {
        startIndex: 2,
        endIndex: 4,
        isScrolling: false,
        virtualRows: 3,
      },
    }))

    const visibleRowModel = table.getVisibleRowModel()
    
    // 检查 rowsById 是否正确映射
    expect(visibleRowModel.rowsById['3']).toBeDefined()
    expect(visibleRowModel.rowsById['3'].id).toBe('3')
    expect(visibleRowModel.rowsById['4'].id).toBe('4')
    expect(visibleRowModel.rowsById['5'].id).toBe('5')
  })

  it('should use default overscan when not specified', () => {
    const tableWithoutOverscan = new Table({
      data: mockData,
      columns: [
        { accessorKey: 'id', header: 'ID' },
        { accessorKey: 'name', header: 'Name' },
      ],
      rowHeight: 50,
      // 不指定 overscan
    })

    tableWithoutOverscan.setState((old: any) => ({
      ...old,
      tableRender: {
        ...old.tableRender,
        bodyHeight: 200,
      },
      virtual: {
        startIndex: 3,
        endIndex: 5,
        isScrolling: false,
        virtualRows: 3,
      },
    }))

    const visibleRowModel = tableWithoutOverscan.getVisibleRowModel()
    
    // 默认 overscan 应该是 5
    expect(visibleRowModel.rows.length).toBe(8) // 3-5 + 5 overscan = 0-10，但总共只有10行
  })
})