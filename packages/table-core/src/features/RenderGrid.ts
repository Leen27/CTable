import { InitialTableState, RowData, Table, TableFeature, TableState } from '../types'

export interface RenderGridState {
  /** 可见行范围 */
  visibleRange: { startIndex: number; endIndex: number }
  /** DOM 容器引用 */
  containerRef: HTMLElement | null
  /** 滚动位置 */
  scrollTop: number
}

export interface RenderGridTableState {
  renderGrid: RenderGridState
}

export interface RenderGridInitialTableState {
  renderGrid?: Partial<RenderGridState>
}

export interface RenderGridStateOptions<TData extends RowData> {
  /** 行高（像素） */
  rowHeight?: number
}

const defaultRenderGridState: RenderGridState = {
  visibleRange: { startIndex: 0, endIndex: 0 },
  containerRef: null,
  scrollTop: 0,
}

export const RenderGrid: TableFeature = {
  getInitialState: (state): RenderGridTableState => {
    return {
      ...state,
      renderGrid: {
        ...defaultRenderGridState,
        ...(state?.renderGrid || {}),
      },
    }
  },

  getDefaultOptions: <TData extends RowData>(): Partial<RenderGridStateOptions<TData>> => {
    return {
      rowHeight: 20,
    }
  },
}
