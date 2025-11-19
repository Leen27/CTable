<script setup lang="ts">
import {
  createColumnHelper,
  FlexRender,
  getCoreRowModel,
  useITable,
} from '../hooks/useITable'
import type {
  Column,
  ColumnOrderState,
  ColumnPinningState,
  Header,
} from '../hooks/useITable'

import { makeData, type Person } from './makeData'
import { h, ref } from 'vue'
import { faker } from '@faker-js/faker'

const data = ref(makeData(5000))

const columnHelper = createColumnHelper<Person>()

const columns = ref([
  columnHelper.group({
    // id: 'Name',
    header: 'Name',
    footer: props => props.column.id,
    columns: [
      columnHelper.accessor('firstName', {
        cell: info => info.getValue(),
        footer: props => props.column.id,
      }),
      columnHelper.accessor(row => row.lastName, {
        id: 'lastName',
        cell: info => info.getValue(),
        header: () => 'Last Name',
        footer: props => props.column.id,
      }),
    ],
  }),
  columnHelper.group({
    header: 'Info',
    footer: props => props.column.id,
    columns: [
      columnHelper.accessor('age', {
        header: () => 'Age',
        footer: props => props.column.id,
      }),
      columnHelper.group({
        header: 'More Info',
        columns: [
          columnHelper.accessor('visits', {
            header: () => 'Visits',
            footer: props => props.column.id,
          }),
          columnHelper.accessor('status', {
            header: 'Status',
            footer: props => props.column.id,
          }),
          columnHelper.accessor('progress', {
            header: 'Profile Progress',
            footer: props => props.column.id,
          }),
        ],
      }),
    ],
  }),
])

const columnVisibility = ref({})
const columnOrder = ref<ColumnOrderState>([])

const columnPinning = ref<ColumnPinningState>({})
const isSplit = ref(false)

const rerender = () => (data.value = makeData(5000))

const table = useITable({
  get data() {
    return data.value
  },
  get columns() {
    return columns.value
  },
  state: {
    get columnVisibility() {
      return columnVisibility.value
    },
    get columnOrder() {
      return columnOrder.value
    },
    get columnPinning() {
      return columnPinning.value
    },
  },

  onColumnOrderChange: order => {
    columnOrder.value =
      order instanceof Function ? order(columnOrder.value) : order
  },
  onColumnPinningChange: pinning => {
    columnPinning.value =
      pinning instanceof Function ? pinning(columnPinning.value) : pinning
  },
  getCoreRowModel: getCoreRowModel(),
  debugTable: true,
  debugHeaders: true,
  debugColumns: true,
})

const randomizeColumns = () => {
  table.setColumnOrder(
    faker.helpers.shuffle(table.getAllLeafColumns().map(d => d.id))
  )
}

function toggleColumnVisibility(column: Column<any, any>) {
  columnVisibility.value = {
    ...columnVisibility.value,
    [column.id]: !column.getIsVisible(),
  }
}

function toggleAllColumnsVisibility() {
  table.getAllLeafColumns().forEach(column => {
    toggleColumnVisibility(column)
  })
}

// function createHeader(header: Header<any, any>) {
//   return () => h()
// }
</script>

<template>
  <div class="h-[400px] w-[400px]">
    <div role="root" class="iTable-root">
      <div class="iTable-mainContent">
        <div class="iTable-main">
          <div class="iTable-virtualScroller">
            <div class="iTable-topContainer">
              <div class="iTable-columnHeaders">
                <div
                  v-for="headerGroup in table.getHeaderGroups()" 
                  :key="headerGroup.id"
                  role="row"
                  class="iTable-row"
                >
                  <div
                    v-for="header in headerGroup.headers"
                    :key="header.id"
                    role="columnheader"
                    class="iTable-columnHeader"
                    :class="{
                      sticky: header.column.getIsPinned(),
                    }"
                    :style="{
                      width: header.getSize() + 'px',
                      left: header.column.getIsPinned() === 'left' ? header.getStart() + 'px' : '0px',
                      right: header.column.getIsPinned() === 'right' ? table.getTotalSize() - header.getStart() - header.getSize() + 'px' : '0px',
                      zIndex: header.column.getIsPinned() ? 40 : 1
                    }"
                  >
                    <FlexRender
                      v-if="!header.isPlaceholder"
                      :render="header.column.columnDef.header"
                      :props="header.getContext()"
                    />

                    <button
                      v-if="header.column.getIsPinned() !== 'left'"
                      @click="header.column.pin('left')"
                      class="px-2 border rounded"
                    >
                      {{ '<=' }}
                    </button>
                    <button
                      v-if="header.column.getIsPinned()"
                      @click="header.column.pin(false)"
                      class="px-2 border rounded"
                    >
                      X
                    </button>
                    <button
                      v-if="header.column.getIsPinned() !== 'right'"
                      @click="header.column.pin('right')"
                      class="px-2 border rounded"
                    >
                      {{ '=>' }}
                    </button>
                  </div>
                </div>
              </div>
              <div
                class="iTable-virtualScrollerContent"
                :style="{
                  width: table.getTotalSize() + 'px',
                }"
              ></div>
            </div>
          </div> 
        </div>
      </div>
    </div>
  </div>
</template>

<style>
:root {
  --iTable-rowWidth: 960px;
  --iTable-t-header-background-base: #cdeeea;
  --iTable-rowBorderColor: rgba(#e0e0e0);
}
.iTable-root {
  width: 100%;
  height: 100%;
}
.iTable-mainContent {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex: 1 1 0%;
}
.iTable-main {
  -webkit-box-flex: 1;
  flex-grow: 1;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.iTable-virtualScroller {
  position: relative;
  height: 100%;
  -webkit-box-flex: 1;
  flex-grow: 1;
  overflow: scroll;
  scrollbar-width: none;
  display: flex;
  flex-direction: column;
  z-index: 0;
}

.iTable-topContainer {
  position: sticky;
  z-index: 40;
  top: 0px;
}

.iTable-columnHeaders {
  width: var(--iTable-rowWidth);
  background-color: var(--iTable-t-header-background-base);
  -webkit-tap-highlight-color: transparent;
  box-sizing: border-box;
}

.iTable-columnHeader {
  border-bottom: 1px solid var(--iTable-rowBorderColor);
  color: #333;
  background-color: var(--iTable-t-header-background-base);
}

.iTable-row {
  display: flex;
}

.iTable-virtualScrollerContent {
  flex-shrink: 0;
}
</style>