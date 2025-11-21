import { describe, it, expect } from 'vitest'
import { createTable } from '../src/core/table'
import { getCoreRowModel } from '../src/utils/getCoreRowModel'

describe('Table Core', () => {
  it('should create table with required options', () => {
    const table = createTable({
      data: [],
      columns: [],
      getCoreRowModel: getCoreRowModel(),
      onStateChange: () => {},
      renderFallbackValue: null,
      state: {},
    })

    expect(table).toBeDefined()
    expect(table.getState).toBeDefined()
    expect(table.setState).toBeDefined()
  })

  it('should handle basic data', () => {
    const data = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
    ]

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
    })

    const rows = table.getRowModel().rows
    expect(rows).toHaveLength(2)
    expect(rows[0]?.getValue('id')).toBe(1)
    expect(rows[0]?.getValue('name')).toBe('John')
  })
})
