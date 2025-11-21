// Development entry point for table-core
import { createTable } from '../src/index'
import { getCoreRowModel } from '../src/utils/getCoreRowModel'

// Custom logger to display messages in the browser
function logMessage(message: string) {
  const logOutput = document.getElementById('logOutput')
  if (logOutput) {
    logOutput.textContent += `\n${message}`
    logOutput.scrollTop = logOutput.scrollHeight
  }
  console.log(message)
}

logMessage('Table Core Development Environment Loaded')

// Create sample data
const data = [
  { firstName: 'John', lastName: 'Doe', age: 30, visits: 10, progress: 50, status: 'single' },
  {
    firstName: 'Jane',
    lastName: 'Smith',
    age: 25,
    visits: 15,
    progress: 75,
    status: 'relationship',
  },
  {
    firstName: 'Bob',
    lastName: 'Johnson',
    age: 35,
    visits: 8,
    progress: 25,
    status: 'complicated',
  },
  {
    firstName: 'Alice',
    lastName: 'Brown',
    age: 28,
    visits: 12,
    progress: 60,
    status: 'relationship',
  },
  { firstName: 'Charlie', lastName: 'Davis', age: 42, visits: 5, progress: 90, status: 'single' },
]

// Define columns
const columns = [
  {
    accessorKey: 'firstName',
    header: 'First Name',
  },
  {
    accessorKey: 'lastName',
    header: 'Last Name',
  },
  {
    accessorKey: 'age',
    header: 'Age',
  },
  {
    accessorKey: 'visits',
    header: 'Visits',
  },
  {
    accessorKey: 'progress',
    header: 'Progress',
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
]

try {
  // Create table instance
  const table = createTable({
    data,
    columns,
    state: {},
    onStateChange: () => {},
    renderFallbackValue: null,
    getCoreRowModel: getCoreRowModel(),
  })

  logMessage('Table instance created successfully')

  // Display table data in the console
  const rowData = table.getRowModel().rows
  logMessage(`Table data loaded with ${rowData.length} rows`)

  // Populate table in the DOM
  const tableBody = document.getElementById('tableBody')
  if (tableBody) {
    tableBody.innerHTML = ''
    rowData.forEach((row) => {
      const tr = document.createElement('tr')
      row.getVisibleCells().forEach((cell) => {
        const td = document.createElement('td')
        td.textContent = String(cell.getValue())
        tr.appendChild(td)
      })
      tableBody.appendChild(tr)
    })
  }

  logMessage('Table rendered in the DOM')
} catch (error) {
  logMessage(`Error creating table: ${error instanceof Error ? error.message : String(error)}`)
}

// You can add more example code here to test other features
