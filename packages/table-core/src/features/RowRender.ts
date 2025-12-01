import { Row, RowData, Table, TableFeature } from '../types'

export interface IRowRenderState {}

export interface IRowRenderRow {
  /** Dynamic row heights are done on demand, only when row is visible. However for row virtualisation
   * we need a row height to do the 'what rows are in viewport' maths. So we assign a row height to each
   * row based on defaults and rowHeightEstimated=true, then when the row is needed for drawing we do
   * the row height calculation and set rowHeightEstimated=false.*/
  rowHeightEstimated: boolean
}

export const RowRender: TableFeature = {
  createRow: <TData extends RowData>(row: Row<TData>, table: Table<TData>): void => {
    row.rowHeightEstimated = false
  },
}
