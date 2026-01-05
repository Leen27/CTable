interface TreeNode {
  id: string
  name: string
  type: 'folder' | 'file'
  size?: number
  modified: string
  children?: TreeNode[]
}

// 生成树形文件系统数据
const createTreeData = (): TreeNode[] => {
  return [
    {
      id: '1',
      name: 'src',
      type: 'folder',
      modified: '2024-01-15 10:30:00',
      children: [
        {
          id: '1-1',
          name: 'components',
          type: 'folder',
          modified: '2024-01-14 15:20:00',
          children: [
            {
              id: '1-1-1',
              name: 'Button.vue',
              type: 'file',
              size: 2048,
              modified: '2024-01-13 09:15:00'
            },
            {
              id: '1-1-2',
              name: 'Table.vue',
              type: 'file',
              size: 4096,
              modified: '2024-01-12 14:30:00'
            },
            {
              id: '1-1-3',
              name: 'Form.vue',
              type: 'file',
              size: 3072,
              modified: '2024-01-11 16:45:00'
            }
          ]
        },
        {
          id: '1-2',
          name: 'utils',
          type: 'folder',
          modified: '2024-01-10 11:00:00',
          children: [
            {
              id: '1-2-1',
              name: 'helper.ts',
              type: 'file',
              size: 1024,
              modified: '2024-01-09 13:20:00'
            },
            {
              id: '1-2-2',
              name: 'constants.ts',
              type: 'file',
              size: 512,
              modified: '2024-01-08 10:10:00'
            }
          ]
        },
        {
          id: '1-3',
          name: 'main.ts',
          type: 'file',
          size: 1536,
          modified: '2024-01-07 08:30:00'
        },
        {
          id: '1-4',
          name: 'App.vue',
          type: 'file',
          size: 2560,
          modified: '2024-01-06 17:00:00'
        }
      ]
    },
    {
      id: '2',
      name: 'public',
      type: 'folder',
      modified: '2024-01-05 12:00:00',
      children: [
        {
          id: '2-1',
          name: 'favicon.ico',
          type: 'file',
          size: 4286,
          modified: '2024-01-04 09:30:00'
        },
        {
          id: '2-2',
          name: 'index.html',
          type: 'file',
          size: 1024,
          modified: '2024-01-03 15:15:00'
        }
      ]
    },
    {
      id: '3',
      name: 'package.json',
      type: 'file',
      size: 2048,
      modified: '2024-01-02 11:45:00'
    },
    {
      id: '4',
      name: 'README.md',
      type: 'file',
      size: 4096,
      modified: '2024-01-01 14:20:00'
    },
    {
      id: '5',
      name: 'node_modules',
      type: 'folder',
      modified: '2023-12-31 18:00:00',
      children: [
        {
          id: '5-1',
          name: 'vue',
          type: 'folder',
          modified: '2023-12-30 16:30:00',
          children: [
            {
              id: '5-1-1',
              name: 'package.json',
              type: 'file',
              size: 3072,
              modified: '2023-12-29 14:00:00'
            }
          ]
        },
        {
          id: '5-2',
          name: 'typescript',
          type: 'folder',
          modified: '2023-12-28 13:15:00',
          children: [
            {
              id: '5-2-1',
              name: 'package.json',
              type: 'file',
              size: 2048,
              modified: '2023-12-27 11:30:00'
            }
          ]
        }
      ]
    }
  ]
}

// 扁平化树形数据以供表格使用
const flattenTreeData = (nodes: TreeNode[], parentId?: string, depth: number = 0): any[] => {
  const result: any[] = []
  
  nodes.forEach((node, index) => {
    const row = {
      id: node.id,
      name: node.name,
      type: node.type,
      size: node.size,
      modified: node.modified,
      parentId: parentId,
      depth: depth,
      index: index,
      subRows: node.children ? flattenTreeData(node.children, node.id, depth + 1) : []
    }
    
    result.push(row)
    
    // 如果节点有子节点且当前是展开状态，添加子节点
    // 注意：这里我们会在展开时动态处理，初始状态只添加根节点
    if (depth === 0) {
      // 只添加根节点，子节点通过展开功能动态添加
    }
  })
  
  return result
}

// 获取子节点函数
const getSubRows = (row: any) => {
  return row.subRows || []
}

// 创建表格数据
const createTableData = () => {
  const treeData = createTreeData()
  return flattenTreeData(treeData)
}

export { createTableData, getSubRows, TreeNode }
export default createTableData