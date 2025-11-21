import { createTable, ColumnResizeMode, getCoreRowModel } from '../src'

// 示例数据类型
interface Person {
  id: number
  name: string
  age: number
  email: string
  city: string
  department: string
  salary: number
}

// 示例数据
const sampleData: Person[] = [
  {
    id: 1,
    name: '张三',
    age: 28,
    email: 'zhangsan@example.com',
    city: '北京',
    department: '技术部',
    salary: 15000,
  },
  {
    id: 2,
    name: '李四',
    age: 32,
    email: 'lisi@example.com',
    city: '上海',
    department: '销售部',
    salary: 12000,
  },
  {
    id: 3,
    name: '王五',
    age: 25,
    email: 'wangwu@example.com',
    city: '广州',
    department: '市场部',
    salary: 10000,
  },
  {
    id: 4,
    name: '赵六',
    age: 30,
    email: 'zhaoliu@example.com',
    city: '深圳',
    department: '技术部',
    salary: 18000,
  },
  {
    id: 5,
    name: '钱七',
    age: 27,
    email: 'qianqi@example.com',
    city: '杭州',
    department: '人事部',
    salary: 9000,
  },
  {
    id: 6,
    name: '孙八',
    age: 35,
    email: 'sunba@example.com',
    city: '成都',
    department: '财务部',
    salary: 16000,
  },
  {
    id: 7,
    name: '周九',
    age: 29,
    email: 'zhoujiu@example.com',
    city: '武汉',
    department: '技术部',
    salary: 14000,
  },
  {
    id: 8,
    name: '吴十',
    age: 31,
    email: 'wushi@example.com',
    city: '南京',
    department: '销售部',
    salary: 13000,
  },
]

// 创建表格实例
const table = createTable<Person>({
  data: sampleData,
  columns: [
    {
      accessorKey: 'id',
      header: 'ID',
      size: 60,
    },
    {
      accessorKey: 'name',
      header: '姓名',
      size: 100,
    },
    {
      accessorKey: 'age',
      header: '年龄',
      size: 80,
    },
    {
      accessorKey: 'email',
      header: '邮箱',
      size: 600,
    },
    {
      accessorKey: 'city',
      header: '城市',
      size: 100,
    },
    {
      accessorKey: 'department',
      header: '部门',
      size: 120,
    },
    {
      accessorKey: 'salary',
      header: '薪资',
      size: 100,
      cell: ({ getValue }) => `¥${getValue<number>().toLocaleString()}`,
    },
  ],
  columnResizeMode: 'onChange',
  getCoreRowModel: getCoreRowModel(),
  getRowId: (row) => row.id.toString(),
  onStateChange: (updater) => {
    // 状态变化时的回调
    console.log('Table state changed:', updater)
  },
  state: {},
  renderFallbackValue: null,
  initialState: {
    pagination: {
      pageIndex: 0,
      pageSize: 5,
    },
  },
})

// 渲染表格到 DOM
function renderTable() {
  const app = document.getElementById('app')
  if (!app) {
    console.error('找不到 #app 元素')
    return
  }

  // 获取表格数据
  const rowModel = table.getRowModel()

  // 创建表格 HTML
  const tableHtml = `
    <div class="container">
      <h1>表格核心功能演示</h1>
      
      <div class="component-demo">
        <div class="component-title">员工信息表</div>
        
        <table id="data-table">
          <thead>
            <tr>
              ${table
                .getAllLeafColumns()
                .map(
                  (column) =>
                    `<th style="width: ${column.getSize()}px;">${column.columnDef.header}</th>`,
                )
                .join('')}
            </tr>
          </thead>
          <tbody>
            ${rowModel.rows
              .map(
                (row) => `
              <tr>
                ${table
                  .getAllLeafColumns()
                  .map((column) => {
                    const cell = row.getAllCells().find((cell) => cell.column.id === column.id)
                    return `<td>${cell?.getValue()?.toString() || ''}</td>`
                  })
                  .join('')}
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
        
        <div class="table-info">
          <p>总行数: ${rowModel.rows.length}</p>
          <p>当前页: ${table.getState().pagination?.pageIndex || 0 + 1}</p>
        </div>
      </div>
      
      <div class="component-demo">
        <div class="component-title">表格状态信息</div>
        <div class="log-container" id="state-info">
          <pre>${JSON.stringify(table.getState(), null, 2)}</pre>
        </div>
      </div>
      
      <div class="component-demo">
        <div class="component-title">操作按钮</div>
        <button onclick="addRow()">添加行</button>
        <button onclick="removeLastRow()">删除最后一行</button>
        <button onclick="updateTable()">更新表格</button>
        <button onclick="resetTable()">重置表格</button>
      </div>
    </div>
  `

  app.innerHTML = tableHtml
}

// 添加新行
function addRow() {
  const newId = Math.max(...sampleData.map((p) => p.id)) + 1
  const newRow: Person = {
    id: newId,
    name: `新员工${newId}`,
    age: 25,
    email: `newemployee${newId}@example.com`,
    city: '北京',
    department: '技术部',
    salary: 10000,
  }

  sampleData.push(newRow)
  table.setOptions((prev) => ({ ...prev, data: [...sampleData] }))
  renderTable()
}

// 删除最后一行
function removeLastRow() {
  if (sampleData.length > 0) {
    sampleData.pop()
    table.setOptions((prev) => ({ ...prev, data: [...sampleData] }))
    renderTable()
  }
}

// 更新表格
function updateTable() {
  // 随机更新一些数据
  const randomIndex = Math.floor(Math.random() * sampleData.length)
  if (sampleData[randomIndex]) {
    sampleData[randomIndex].salary = Math.floor(Math.random() * 20000) + 5000
    table.setOptions((prev) => ({ ...prev, data: [...sampleData] }))
    renderTable()
  }
}

// 重置表格
function resetTable() {
  table.reset()
  renderTable()
}

// 将函数挂载到全局作用域
;(window as any).addRow = addRow
;(window as any).removeLastRow = removeLastRow
;(window as any).updateTable = updateTable
;(window as any).resetTable = resetTable

// 初始渲染
renderTable()

// 监听表格状态变化
table.options.onStateChange = (updater) => {
  console.log('Table state updated')
  renderTable()
}

console.log('表格示例已初始化完成')
console.log('可用操作:')
console.log('- addRow(): 添加新行')
console.log('- removeLastRow(): 删除最后一行')
console.log('- updateTable(): 随机更新数据')
console.log('- resetTable(): 重置表格状态')
