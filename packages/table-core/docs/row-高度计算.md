关于估计高度的代码实现，我找到了具体的实现位置：

## 1. 估计高度的核心逻辑

### 在 [`_getRowHeightForNode()`](packages/ag-grid-community/src/gridOptionsUtils.ts:78-122) 函数中：

```typescript
export function _getRowHeightForNode(
  beans: BeanCollection,
  rowNode: IRowNode,
  allowEstimate = false, // 是否允许估计
  defaultRowHeight?: number,
): { height: number; estimated: boolean } {
  // ... 其他逻辑

  if (_isGetRowHeightFunction(gos)) {
    if (allowEstimate) {
      // 如果允许估计，返回默认高度并标记为估计值
      return { height: defaultRowHeight, estimated: true }
    }

    // 如果不允许估计，调用实际的 getRowHeight 函数
    const height = gos.getCallback('getRowHeight')!(params)
    // ... 返回真实高度
  }

  // ... 其他逻辑
  return { height: rowHeight, estimated: false }
}
```

## 2. 估计高度的使用场景

### 在 [`ClientSideRowModel.setRowTopAndRowIndex()`](packages/ag-grid-community/src/clientSideRowModel/clientSideRowModel.ts:273-307) 中：

```typescript
private setRowTopAndRowIndex(outputDisplayedRowsMapped?: Set<string>): void {
    // 只有在正常布局模式下才允许估计
    const allowEstimate = _isDomLayout(this.gos, 'normal');

    for (let i = 0, len = rowsToDisplay.length; i < len; ++i) {
        const rowNode = rowsToDisplay[i];

        // 如果行高为 null，则计算行高
        if (rowNode.rowHeight == null) {
            // 传入 allowEstimate 参数
            const rowHeight = _getRowHeightForNode(beans, rowNode, allowEstimate, defaultRowHeight);
            // 设置行高和估计标志
            rowNode.setRowHeight(rowHeight.height, rowHeight.estimated);
        }

        // 设置位置
        rowNode.setRowTop(nextRowTop);
        nextRowTop += rowNode.rowHeight!;
    }
}
```

## 3. 估计标志的存储

### 在 [`RowNode.setRowHeight()`](packages/ag-grid-community/src/entities/rowNode.ts:456-461) 中：

```typescript
public setRowHeight(rowHeight: number | undefined | null, estimated: boolean = false): void {
    this.rowHeight = rowHeight;
    this.rowHeightEstimated = estimated;  // 存储估计标志

    this.dispatchRowEvent('heightChanged');
}
```

## 4. 估计高度的重新计算

### 在 [`ClientSideRowModel.ensureRowHeightsValid()`](packages/ag-grid-community/src/clientSideRowModel/clientSideRowModel.ts:174-212) 中：

```typescript
public ensureRowHeightsValid(
    startPixel: number,
    endPixel: number,
    startLimitIndex: number,
    endLimitIndex: number
): boolean {
    let atLeastOneChange: boolean;
    let res = false;

    do {
        atLeastOneChange = false;

        // 获取需要检查的行范围
        const rowAtStartPixel = this.getRowIndexAtPixel(startPixel);
        const rowAtEndPixel = this.getRowIndexAtPixel(endPixel);
        const firstRow = Math.max(rowAtStartPixel, startLimitIndex);
        const lastRow = Math.min(rowAtEndPixel, endLimitIndex);

        for (let rowIndex = firstRow; rowIndex <= lastRow; rowIndex++) {
            const rowNode = this.getRow(rowIndex);

            // 检查是否为估计高度
            if (rowNode.rowHeightEstimated) {
                // 重新计算真实高度
                const rowHeight = _getRowHeightForNode(this.beans, rowNode);
                rowNode.setRowHeight(rowHeight.height);
                atLeastOneChange = true;
                res = true;
            }
        }

        if (atLeastOneChange) {
            // 如果有变化，重新计算所有行的位置
            this.setRowTopAndRowIndex();
        }
    } while (atLeastOneChange);  // 循环直到没有更多变化

    return res;
}
```

## 5. 自动行高服务中的估计处理

### 在 [`RowAutoHeightService`](packages/ag-grid-community/src/rendering/row/rowAutoHeightService.ts) 中：

```typescript
private calculateRowHeights() {
    const updateDisplayedRowHeights = (row: RowNode) => {
        // 获取当前行的自动高度值
        const autoHeights = row.__autoHeights;
        let newRowHeight = _getRowHeightForNode(this.beans, row).height;

        // 检查每个自动高度列
        for (const col of displayedAutoHeightCols) {
            let cellHeight = autoHeights?.[col.getColId()];

            // 如果没有单元格高度，跳过此行
            if (cellHeight == null) {
                if (this.colSpanSkipCell(col, row)) {
                    continue;
                }
                return; // 自动高度未准备好，跳过此行
            }

            newRowHeight = Math.max(cellHeight, newRowHeight);
        }

        // 如果新高度与当前高度不同，更新行高
        if (newRowHeight !== row.rowHeight) {
            row.setRowHeight(newRowHeight);  // 这里会清除 estimated 标志
            anyNodeChanged = true;
        }
    };
}
```

## 总结

估计高度的机制工作流程：

1. **初始计算**：当行还没有实际渲染时，使用默认高度并设置 `estimated: true`
2. **标志存储**：将估计标志存储在 `rowNode.rowHeightEstimated` 属性中
3. **实际渲染时**：当行进入视口需要实际渲染时，重新计算真实高度
4. **位置更新**：重新计算真实高度后，更新行的位置信息
5. **循环处理**：处理高度变化可能引起的连锁反应，直到所有行的高度都确定

这个机制确保了虚拟滚动的性能，同时保证了实际渲染时的准确性。
