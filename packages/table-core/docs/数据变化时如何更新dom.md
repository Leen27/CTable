基于对 RowCtrl.ts 和 CellCtrl.ts 的详细分析，我可以为你解释当 row 和 cell 发生变化时，ag-grid 是如何更新 DOM 的：

## Row 变化时的 DOM 更新机制

### 1. 数据变化监听入口

在 [`RowCtrl.addListeners()`](packages/ag-grid-community/src/rendering/row/rowCtrl.ts:792) 中，RowCtrl 会监听 RowNode 的数据变化事件：

```typescript
this.addManagedListeners(rowNode, {
  dataChanged: this.onRowNodeDataChanged.bind(this), // 行数据变化
  cellChanged: this.postProcessCss.bind(this), // 单元格变化
  // ... 其他事件
})
```

### 2. 行数据变化处理

当行数据发生变化时，会触发 [`onRowNodeDataChanged()`](packages/ag-grid-community/src/rendering/row/rowCtrl.ts:889)：

```typescript
private onRowNodeDataChanged(event: DataChangedEvent): void {
    this.refreshRow({
        suppressFlash: !event.update,
        newData: !event.update,
    });
}
```

### 3. 核心刷新逻辑

[`refreshRow()`](packages/ag-grid-community/src/rendering/row/rowCtrl.ts:896) 是处理行变化的核心方法：

```typescript
public refreshRow(params: RefreshRowsParams & { newData?: boolean }): void {
    // 1. 检查是否需要重新渲染整行（全宽行类型变化）
    const fullWidthChanged = this.isFullWidth() !== !!this.isNodeFullWidthCell();
    if (fullWidthChanged) {
        this.beans.rowRenderer.redrawRow(this.rowNode);  // 完全重绘
        return;
    }

    // 2. 处理全宽行的刷新
    if (this.isFullWidth()) {
        const refresh = this.refreshFullWidth();
        if (!refresh) {
            this.beans.rowRenderer.redrawRow(this.rowNode);
        }
        return;
    }

    // 3. 普通单元格刷新 - 这是主要路径
    for (const cellCtrl of this.getAllCellCtrls()) {
        cellCtrl.refreshCell(params);  // 调用 CellCtrl 刷新
    }

    // 4. 更新 DOM 属性
    for (const gui of this.allRowGuis) {
        this.setRowCompRowId(gui.rowComp);     // 更新行 ID
        this.updateRowBusinessKey();           // 更新业务键
        this.setRowCompRowBusinessKey(gui.rowComp);
    }

    // 5. 重新应用样式
    this.onRowSelected();   // 选中状态
    this.postProcessCss();  // CSS 样式
}
```

## Cell 变化时的 DOM 更新机制

### 1. 单元格变化监听

在 [`RowCtrl.addListenersForCellComps()`](packages/ag-grid-community/src/rendering/row/rowCtrl.ts:867) 中：

```typescript
this.addManagedListeners(this.rowNode, {
  cellChanged: (event) => {
    for (const cellCtrl of this.getAllCellCtrls()) {
      cellCtrl.onCellChanged(event) // 通知所有单元格
    }
  },
})
```

### 2. 单元格变化处理

在 [`CellCtrl.onCellChanged()`](packages/ag-grid-community/src/rendering/cell/cellCtrl.ts:553)：

```typescript
public onCellChanged(event: CellChangedEvent): void {
    const eventImpactsThisCell = event.column === this.column;
    if (eventImpactsThisCell) {
        this.refreshCell({});  // 只刷新受影响的单元格
    }
}
```

### 3. 单元格刷新核心逻辑

[`CellCtrl.refreshCell()`](packages/ag-grid-community/src/rendering/cell/cellCtrl.ts:584) 是单元格刷新的核心：

```typescript
public refreshCell({ force, suppressFlash, newData }: RefreshCellsParams & { newData?: boolean } = {}): void {
    // 1. 更新和格式化值
    const valuesDifferent = this.updateAndFormatValue(true);
    const dataNeedsUpdating = force || valuesDifferent || newData;

    if (!dataNeedsUpdating) {
        return;  // 值没变，不需要刷新
    }

    // 2. 更新显示值
    this.showValue(!!newData, false);  // 关键：更新 DOM

    // 3. 处理闪烁效果
    const flashCell = !suppressFlash && enableCellChangeFlash;
    if (flashCell) {
        cellFlashSvc?.flashCell(this);
    }

    // 4. 重新应用样式
    editStyleFeature?.applyCellStyles?.();
    customStyleFeature?.applyUserStyles();
    customStyleFeature?.applyClassesFromColDef();
    rowEditStyleFeature?.applyRowStyles();

    // 5. 更新工具提示
    tooltipFeature?.refreshTooltip();
}
```

### 4. 实际的 DOM 更新

在 [`CellCtrl.showValue()`](packages/ag-grid-community/src/rendering/cell/cellCtrl.ts:363) 中完成实际的 DOM 更新：

```typescript
private showValue(forceNewCellRendererInstance: boolean, skipRangeHandleRefresh: boolean): void {
    // 获取要显示的值
    let valueToDisplay = this.getValueToDisplay();
    let compDetails: UserCompDetails | undefined;

    // 确定是否需要单元格渲染器
    if (isSsrmLoading || this.isCellRenderer()) {
        const params = this.createCellRendererParams();
        compDetails = _getCellRendererDetails(userCompFactory, colDef, params);
    }

    // 关键：调用 CellComp 设置渲染详情 - 这会更新 DOM
    this.comp.setRenderDetails(compDetails, valueToDisplay, forceNewCellRendererInstance);
}
```

## 总结

### Row 变化时的 DOM 更新流程：

1. **事件触发** → RowNode 数据变化
2. **RowCtrl 处理** → `onRowNodeDataChanged()` → `refreshRow()`
3. **CellCtrl 刷新** → 遍历所有单元格，调用 `cellCtrl.refreshCell()`
4. **DOM 更新** → `cellCtrl.showValue()` → `comp.setRenderDetails()`
5. **样式更新** → 重新应用 CSS 类和样式

### Cell 变化时的 DOM 更新流程：

1. **事件触发** → 特定单元格数据变化
2. **RowCtrl 分发** → `cellChanged` 事件分发给所有 CellCtrl
3. **CellCtrl 过滤** → 只处理受影响的单元格
4. **值比较** → 检查值是否真的发生变化
5. **DOM 更新** → `showValue()` → `comp.setRenderDetails()`

这种设计确保了：

- **性能优化**：只更新真正需要变化的 DOM
- **模块化**：RowCtrl 负责行级别，CellCtrl 负责单元格级别
- **可扩展性**：通过渲染器模式支持自定义单元格内容
