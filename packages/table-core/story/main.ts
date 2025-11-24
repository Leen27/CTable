import {
  createColumnHelper,
  getCoreRowModel,
  flexRender,
  useTable,
  TableOptionsResolved,
  createTable,
} from '../src'
import { EventTypes } from '../src/features/EventSystem'

type Person = {
  firstName: string
  lastName: string
  age: number
  visits: number
  status: string
  progress: number
}

const data: Person[] = [
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

// Compose in the generic options to the user options
const resolvedOptions: TableOptionsResolved<Person> = {
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  state: {}, // Dummy state
  onStateChange: () => {}, // noop
  renderFallbackValue: null,
}

// Create a new table
const table = createTable<Person>(resolvedOptions)

table.addEventListener(EventTypes.TABLE_MOUNTED, (data) => {
  console.log('表格dom 创建', data)
})
table.render(document.querySelector('#app') as HTMLElement)
