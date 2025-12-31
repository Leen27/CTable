import { RowData, Table, TableFeature, Header, HeaderGroup } from "../types";
import { createElement, addStylesToElement } from "../utils/dom";
import { flexRender } from "./TableRender";

export interface ColumnRenderInstance<TData extends RowData> {
  createColumnsElement(): HTMLElement
}

export interface ColumnRenderOptions<TData extends RowData> {
  /**
   * 自定义列渲染函数
   * 如果提供，将使用此函数渲染每个列
   * 如果不提供，将使用默认渲染逻辑
   */
  renderColumn?: (header: Header<TData, unknown>, table: Table<TData>) => HTMLElement;
  
  /**
   * 自定义列容器渲染函数
   * 如果提供，将使用此函数渲染整个列容器
   * 如果不提供，将使用默认容器渲染
   */
  renderColumnsContainer?: (headers: HeaderGroup<TData>[], table: Table<TData>) => HTMLElement;
}

/**
 * 默认列渲染函数
 * 渲染单个列元素
 */
const defaultRenderColumn = <TData extends RowData>(
  header: Header<TData, unknown>,
  table: Table<TData>
): HTMLElement => {
  const columnElement = createElement('div', {
    className: 'c-table-column',
    attributes: {
      'data-column-id': header.column.id,
      'data-column-index': header.index.toString(),
      'data-header-depth': header.depth.toString(),
    }
  });

  addStylesToElement(columnElement, {
    width: header.getSize() + 'px'
  })

  // 渲染列头内容
  const headerContent = flexRender(header.column.columnDef.header, header.getContext());
  
  if (typeof headerContent === 'string') {
    columnElement.textContent = headerContent;
  } else if (headerContent instanceof HTMLElement) {
    columnElement.appendChild(headerContent);
  } else if (headerContent != null) {
    columnElement.innerHTML = String(headerContent);
  }

  return columnElement;
};

/**
 * 默认列容器渲染函数
 * 渲染包含所有列的容器元素
 */
const defaultRenderColumnsContainer = <TData extends RowData>(
  headerGroups: HeaderGroup<TData>[],
  table: Table<TData>
): HTMLElement => {
  const container = createElement('div', {
    className: 'c-table-columns-container w-full h-full',
  });

  // 渲染每个列
  headerGroups.forEach(hg => {
    const colRow = createElement('div', {
      className: 'c-table-columns-row-container w-full h-full flex',
    });

    hg.headers.forEach(header => {
      const columnElement = table.options.renderColumn
        ? table.options.renderColumn(header, table)
        : defaultRenderColumn(header, table);
      colRow.appendChild(columnElement)
    });

    container.appendChild(colRow);
  });

  return container;
};

/**
 * 表格Column渲染
 */
export const ColumnRender: TableFeature = {
  getDefaultOptions: <TData extends RowData>(
    table: Table<TData>
  ): Partial<ColumnRenderOptions<TData>> => {
    return {
      renderColumn: defaultRenderColumn,
      renderColumnsContainer: defaultRenderColumnsContainer,
    };
  },

  createTable: <TData extends RowData>(table: Table<TData>): void => {
    table.createColumnsElement = () => {
      // 获取所有可见的叶子列头
      const headerGroups = table.getHeaderGroups();
      
      // 使用用户自定义的容器渲染函数或默认函数
      const columnsContainer = table.options.renderColumnsContainer
        ? table.options.renderColumnsContainer(headerGroups, table)
        : defaultRenderColumnsContainer(headerGroups, table);

      return columnsContainer;
    };
  }
}