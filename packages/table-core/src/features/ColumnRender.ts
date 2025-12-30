import { RowData, Table, TableFeature } from "../types";
import { createElement } from "../utils/dom";

export interface ColumnRenderInstance<TData extends RowData> {
  createColumnsElement(): HTMLElement
}
/**
 * 表格Column渲染
 */
export const ColumnRender: TableFeature = {
    createTable: <TData extends RowData>(table: Table<TData>): void => {
      table.createColumnsElement = () => {
        return createElement('div', {
          className: 'c-table-columns-container w-full h-full',
          innerHTML: 'header',
        })
      }
    }
}