import '../src/index.css'
import {
  createColumnHelper,
  getCoreRowModel,
  getExpandedRowModel,
  flexRender,
  useTable,
  TableOptionsResolved,
  createTable,
  TableState,
  ColumnDef,
  Row,
} from '../src'
import { EventTypesEnum } from '../src/core/events'
import { createElement } from '../src/utils/dom'
import { ProgressBar, StatusTag, Avatar, NumberBadge } from './vue-components'
import createTreeData, { getSubRows } from './tree-mock-data'

interface FileNode {
  id: string
  name: string
  type: 'folder' | 'file'
  size?: number
  modified: string
  parentId?: string
  depth: number
  subRows?: FileNode[]
}

// 使用树形数据
const data = createTreeData()

const columnHelper = createColumnHelper<FileNode>()

// 文件类型图标
const getFileIcon = (type: string, name: string) => {
  if (type === 'folder') {
    return '📁'
  }
  if (name.endsWith('.vue')) {
    return '💚'
  }
  if (name.endsWith('.ts')) {
    return '🔷'
  }
  if (name.endsWith('.json')) {
    return '📋'
  }
  if (name.endsWith('.html')) {
    return '🌐'
  }
  if (name.endsWith('.ico')) {
    return '🎨'
  }
  if (name.endsWith('.md')) {
    return '📝'
  }
  return '📄'
}

// 格式化文件大小
const formatFileSize = (bytes?: number) => {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const columns: ColumnDef<FileNode, any>[] = [
  {
    header: 'Name',
    columns: [
      columnHelper.accessor('name', {
        cell: (info: any) => {
          const row = info.row.original
          const icon = getFileIcon(row.type, row.name)
          return `${icon} ${info.getValue()}`
        },
        header: 'File Name',
        footer: (info: any) => info.column.id,
        size: 300
      }),
    ]
  },
  columnHelper.accessor('type', {
    header: 'Type',
    cell: (info: any) => {
      const type = info.getValue()
      return type === 'folder' ? '📂 Folder' : '📄 File'
    },
    footer: (info: any) => info.column.id,
    size: 100
  }),
  columnHelper.accessor('size', {
    header: 'Size',
    cell: (info: any) => {
      const size = info.getValue()
      return formatFileSize(size)
    },
    footer: (info: any) => info.column.id,
    size: 100
  }),
  columnHelper.accessor('modified', {
    header: 'Modified',
    cell: (info: any) => info.getValue(),
    footer: (info: any) => info.column.id,
    size: 150
  }),
]

// Compose in the generic options to the user options
const resolvedOptions: TableOptionsResolved<FileNode> = {
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
  getSubRows: getSubRows,
  getRowCanExpand: (row: any) => {
    return row.original.type === 'folder' && (row.original.subRows?.length || 0) > 0
  },
  dynamic: true,
  state: {
    columnVisibility: {},
    expanded: {}, // 初始状态：所有节点折叠
  },
  onStateChange: (updater) => {
    if (updater instanceof Function) {
      table.options.state = updater(table.options.state as TableState)
    } else {
      table.options.state = updater
    }
  },
  onTableRenderChange: (updater) => {
    if (updater instanceof Function) {
      table.options.state.tableRender = updater(table.options.state.tableRender!)
    } else {
      table.options.state.tableRender = updater
    }
  },
  onVirtualStateChange(updater) {
    if (updater instanceof Function) {
      table.options.state.virtual = updater(table.options.state.virtual!)
    } else {
      table.options.state.virtual = updater
    }
    table.getVirtualRowModel().rows.forEach((row: any) => row.render())
  },
  onExpandedChange(updater) {
    table.getVirtualRowModel().rows.forEach((row: Row<any>) => row.destroy())
    if (updater instanceof Function) {
      table.options.state.expanded = updater(table.options.state.expanded!)
    } else {
      table.options.state.expanded = updater
    }
    table.getVirtualRowModel().rows.forEach((row: Row<any>) => row.render())
  },
  renderFallbackValue: null,
  maxHeight: 500,
  debugAll: true,
}

// Create a new table
const table = createTable<FileNode>(resolvedOptions)
table.setOptions((pre: any) => ({
  ...pre,
  state: { ...table.initialState },
}))

// 添加标题和说明
const container = document.querySelector('#tree-table-app') as HTMLElement

// 创建标题
const title = createElement('h1', {
  className: 'text-2xl font-bold mb-4 text-gray-800',
  textContent: '🌳 Tree Table Demo'
})

// 创建说明
const description = createElement('p', {
  className: 'text-gray-600 mb-6',
  textContent: 'Click on the expand/collapse icons to explore the file system structure. Folders can be expanded to show their contents.'
})

// 创建控制按钮
const controls = createElement('div', {
  className: 'mb-4 space-x-2'
})

const expandAllBtn = createElement('button', {
  className: 'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600',
  textContent: 'Expand All',
  attributes: { type: 'button' }
})

const collapseAllBtn = createElement('button', {
  className: 'px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600',
  textContent: 'Collapse All',
  attributes: { type: 'button' }
})

controls.appendChild(expandAllBtn)
controls.appendChild(collapseAllBtn)

// 添加事件监听器
expandAllBtn.addEventListener('click', () => {
  table.toggleAllRowsExpanded(true)
})

collapseAllBtn.addEventListener('click', () => {
  table.toggleAllRowsExpanded(false)
})

// 清空容器并添加元素
container.innerHTML = ''
container.appendChild(title)
container.appendChild(description)
container.appendChild(controls)

// 渲染表格
table.render(container)
table.willUpdateVirtual()

// 将表格实例暴露到全局窗口对象，供 HTML 中的按钮调用
;(window as any).treeTableInstance = table

// 添加一些样式
const style = createElement('style', {
  textContent: `
    .c-table-cell {
      padding: 8px 12px;
      font-size: 14px;
    }
    .c-table-cell button {
      transition: all 0.2s ease;
    }
    .c-table-cell button:hover {
      transform: scale(1.1);
    }
  `
})
document.head.appendChild(style)