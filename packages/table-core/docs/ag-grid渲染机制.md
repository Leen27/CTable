基于对 ag-grid-community 源代码的深入分析，我总结了 ag-grid 的重新渲染机制及其触发时机：

## ag-grid 重新渲染机制分析

### 核心渲染架构

ag-grid 的渲染系统主要由以下几个核心组件构成：

1. **RowRenderer** ([`packages/ag-grid-community/src/rendering/rowRenderer.ts`](packages/ag-grid-community/src/rendering/rowRenderer.ts:50)) - 主要的行渲染管理器
2. **RowCtrl** ([`packages/ag-grid-community/src/rendering/row/rowCtrl.ts`](packages/ag-grid-community/src/rendering/row/rowCtrl.ts:104)) - 单个行的控制器
3. **CellCtrl** - 单元格控制器
4. **事件系统** - 通过 [`addManagedEventListeners`](packages/ag-grid-community/src/rendering/rowRenderer.ts:116) 和 [`addManagedPropertyListeners`](packages/ag-grid-community/src/rendering/rowRenderer.ts:125) 管理渲染触发

### 重新渲染的触发时机

#### 1. 数据相关触发

- **数据源变更** ([`datasourceChanged()`](packages/ag-grid-community/src/rendering/rowRenderer.ts:456)) - 当数据源完全更换时
- **分页变化** ([`onPageLoaded()`](packages/ag-grid-community/src/rendering/rowRenderer.ts:463)) - 分页导航时
- **行数据更新** ([`onRowNodeDataChanged()`](packages/ag-grid-community/src/rendering/row/rowCtrl.ts:889)) - 单个行数据变化时
- **固定行数据变化** ([`onPinnedRowDataChanged()`](packages/ag-grid-community/src/rendering/rowRenderer.ts:549))

#### 2. 滚动相关触发

- **垂直滚动** ([`onBodyScroll()`](packages/ag-grid-community/src/rendering/rowRenderer.ts:1007)) - 滚动时触发虚拟渲染
- **视口变化** - 当可见区域发生变化时

#### 3. 列相关触发

- **显示列变化** ([`onDisplayedColumnsChanged()`](packages/ag-grid-community/src/rendering/rowRenderer.ts:1188)) - 列显示/隐藏时
- **列宽变化** - 列宽度调整时
- **列移动** - 列位置变化时

#### 4. 配置相关触发

- **布局变化** ([`onDomLayoutChanged()`](packages/ag-grid-community/src/rendering/rowRenderer.ts:438)) - DOM布局模式变化时
- **属性变化** - 通过 [`addManagedPropertyListeners`](packages/ag-grid-community/src/rendering/rowRenderer.ts:125) 监听的各种配置属性变化

#### 5. 焦点相关触发

- **单元格焦点变化** ([`onCellFocusChanged()`](packages/ag-grid-community/src/rendering/rowRenderer.ts:268)) - 焦点移动时
- **行焦点变化** - 行焦点状态变化时

#### 6. 选择相关触发

- **行选择变化** - 行选择状态变化时
- **单元格选择变化** - 单元格选择状态变化时

### 渲染优化机制

#### 1. 虚拟化渲染

- **行虚拟化** - 只渲染可见区域内的行
- **列虚拟化** - 只渲染可见的列
- **缓冲区机制** - 通过 [`rowBuffer`](packages/ag-grid-community/src/rendering/rowRenderer.ts:1328) 设置预渲染行数

#### 2. 增量更新

- **单元格刷新** ([`refreshCells()`](packages/ag-grid-community/src/rendering/rowRenderer.ts:865)) - 只刷新指定的单元格
- **行刷新** ([`refreshRows()`](packages/ag-grid-community/src/rendering/rowRenderer.ts:879)) - 只刷新指定的行
- **行重用** ([`recycleRows`](packages/ag-grid-community/src/rendering/rowRenderer.ts:644)) - 在模型更新时重用行组件

#### 3. 动画帧优化

- **异步渲染** - 使用 [`requestAnimationFrame`](packages/ag-grid-community/src/rendering/rowRenderer.ts:168) 进行异步渲染
- **滚动优化** - 滚动时使用动画帧队列避免阻塞

#### 4. 缓存机制

- **行缓存** ([`RowCtrlCache`](packages/ag-grid-community/src/rendering/rowRenderer.ts:1593)) - 缓存可重用的行控制器
- **详情行缓存** - 通过 [`keepDetailRows`](packages/ag-grid-community/src/rendering/rowRenderer.ts:192) 设置详情行缓存

### 渲染流程控制

#### 1. 刷新锁机制

- **防止重复刷新** ([`refreshInProgress`](packages/ag-grid-community/src/rendering/rowRenderer.ts:100)) - 确保同一时间只有一个刷新操作
- **框架集成** - 通过 [`getLockOnRefresh`](packages/ag-grid-community/src/rendering/rowRenderer.ts:723) 和 [`releaseLockOnRefresh`](packages/ag-grid-community/src/rendering/rowRenderer.ts:726) 与框架集成

#### 2. 渲染状态管理

- **渲染状态跟踪** - 跟踪哪些行/单元格需要渲染
- **焦点恢复** - 在刷新后恢复焦点位置
- **编辑状态保持** - 在刷新时保持编辑状态

### 总结

ag-grid 的重新渲染机制是一个高度优化的系统，通过虚拟化、增量更新、缓存和异步渲染等技术，确保在大数据量下仍能保持良好的性能。系统会根据不同的触发条件选择最合适的渲染策略，从完整的重绘到精细的单元格刷新，实现了性能与功能的最佳平衡。
