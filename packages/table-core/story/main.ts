import '../src/index.css'
import {
  createColumnHelper,
  getCoreRowModel,
  flexRender,
  useTable,
  TableOptionsResolved,
  createTable,
  TableState,
  ColumnDef,
} from '../src'
import { EventTypesEnum } from '../src/core/events'
import MockData from './mock-data'
import { createElement } from '../src/utils/dom'

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

const columns: ColumnDef<Person, any>[] = [
  {
    header: 'Name',
    columns: [
      columnHelper.accessor('firstName', {
        cell: (info) => info.getValue(),
        footer: (info) => info.column.id,
        size: 500
      }),
      columnHelper.accessor((row) => row.lastName, {
        id: 'lastName',
        cell: (info) => `<i>${info.getValue()}</i>`,
        header: () => '<span>Last Name</span>',
        footer: (info) => info.column.id,
        size: 500
      }),
    ]
  },
  columnHelper.accessor('age', {
    header: () => 'Age',
    cell: (info) => info.renderValue(),
    footer: (info) => info.column.id,
    size: 500
  }),
  columnHelper.accessor('visits', {
    header: () => '<span>Visits</span>',
    footer: (info) => info.column.id,
    size: 500
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    footer: (info) => info.column.id,
    size: 500
  }),
  columnHelper.accessor('progress', {
    header: 'Profile Progress',
    footer: (info) => info.column.id,
    size: 500
  }),
]

// Compose in the generic options to the user options
const resolvedOptions: TableOptionsResolved<Person> = {
  data: MockData,
  columns,
  getCoreRowModel: getCoreRowModel(),
  dynamic: false,
  state: {
    columnVisibility: {},
  }, // Dummy state
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
    table.getVirtualRowModel().rows.forEach((row) => row.render())
  },
  renderFallbackValue: null,
  maxHeight: 300,
  debugAll: true,
}

// Create a new table
const table = createTable<Person>(resolvedOptions)
table.setOptions((pre) => ({
  ...pre,
  state: { ...table.initialState },
}))

table.render(document.querySelector('#app') as HTMLElement)
table.willUpdateVirtual()

document.querySelector('#app')?.append(
  createElement('div', {
    attributes: {
      id: 'xxx',
    },
  }),
)
