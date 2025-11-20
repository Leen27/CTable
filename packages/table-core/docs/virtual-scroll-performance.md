# 虚拟滚动性能优化指南

## 概述

本文档介绍了 `packages/table-core/src/features/RowVirtual.ts` 中的虚拟滚动性能优化策略，帮助开发者理解和配置最佳性能方案。

## 性能优化特性

### 1. 批量更新机制 (Batch Updates)

**问题**：频繁的滚动事件会导致大量的状态更新和重绘。

**解决方案**：

- 实现批量更新机制，将多个滚动事件合并为单次更新
- 默认使用 16ms 的批处理间隔（约 60fps）
- 可通过 `virtualPerformance.batchUpdateThreshold` 配置

```typescript
const table = useTable({
  virtualPerformance: {
    batchUpdateThreshold: 16, // 毫秒
  },
})
```

### 2. 行高缓存 (Row Height Caching)

**问题**：动态行高计算在每次滚动时都会重新计算，造成性能开销。

**解决方案**：

- 自动缓存计算过的行高
- 支持固定行高和函数行高
- 限制缓存大小防止内存泄漏

```typescript
const table = useTable({
  virtualPerformance: {
    enableCache: true,
    maxCacheSize: 1000, // 最大缓存行数
  },
  rowHeight: (row) => {
    // 动态行高函数
    return row.original.expanded ? 100 : 50
  },
})
```

### 3. Transform 替代 Padding（即将推出）

**问题**：使用 CSS padding 撑开容器会触发整个容器的重绘。

**解决方案**：

- 使用 CSS transform 替代 padding
- transform 只影响合成层，不会触发重排
- 显著减少重绘区域

```typescript
const table = useTable({
  virtualPerformance: {
    useTransform: true, // 即将推出
  },
})
```

### 4. 偏移量缓存 (Offset Caching)

**问题**：每次都需要重新计算行的偏移位置。

**解决方案**：

- 缓存已计算的偏移量
- 增量更新机制
- 减少重复计算

## 性能监控

### 获取性能指标

```typescript
// 获取性能监控数据
const metrics = table.getPerformanceMetrics()

console.log('缓存命中率:', metrics.cacheHitRate)
console.log('总计算次数:', metrics.totalCalculations)
console.log('平均计算时间:', metrics.averageCalculationTime)
```

### 性能指标说明

| 指标                   | 说明         | 优化建议                             |
| ---------------------- | ------------ | ------------------------------------ |
| cacheHitRate           | 缓存命中率   | 应该 > 0.8，低于此值考虑增加缓存大小 |
| totalCalculations      | 总计算次数   | 滚动越频繁，数值越高                 |
| averageCalculationTime | 平均计算时间 | 应该 < 1ms，过高考虑优化行高函数     |

### 清除缓存

```typescript
// 清除所有缓存
table.clearVirtualCache()
```

## 最佳实践

### 1. 固定行高 vs 动态行高

**推荐**：尽可能使用固定行高

- 固定行高性能最佳
- 动态行高需要额外计算，但支持缓存优化

```typescript
// 固定行高 - 最佳性能
rowHeight: 50

// 动态行高 - 支持缓存
rowHeight: (row) => {
  // 确保函数是纯函数，相同输入相同输出
  return calculateRowHeight(row)
}
```

### 2. 批处理配置

**推荐**：根据使用场景调整批处理间隔

```typescript
// 流畅滚动优先（默认）
batchUpdateThreshold: 16

// 实时性优先
batchUpdateThreshold: 0

// 平衡性能和实时性
batchUpdateThreshold: 32
```

### 3. 缓存配置

**推荐**：根据数据量调整缓存大小

```typescript
// 小数据量 (< 1000 行)
maxCacheSize: 1000

// 中等数据量 (1000-10000 行)
maxCacheSize: 5000

// 大数据量 (> 10000 行)
maxCacheSize: 10000
```

## 性能对比

| 优化策略    | 重绘次数 | 内存使用 | 计算时间 | 推荐场景 |
| ----------- | -------- | -------- | -------- | -------- |
| 基础实现    | 高       | 低       | 长       | 小数据量 |
| + 批处理    | 中       | 低       | 中       | 频繁滚动 |
| + 缓存      | 低       | 中       | 短       | 动态行高 |
| + Transform | 极低     | 中       | 短       | 大数据量 |

## 常见问题

### Q: 为什么滚动不够流畅？

A: 检查以下几点：

1. 批处理间隔是否合适（建议 16-32ms）
2. 行高函数是否过于复杂
3. 是否启用了缓存
4. 数据量是否过大（考虑分页）

### Q: 内存使用过高怎么办？

A: 尝试以下优化：

1. 减小缓存大小 (`maxCacheSize`)
2. 定期清除缓存 (`clearVirtualCache`)
3. 使用固定行高替代动态行高

### Q: 如何监控性能？

A: 使用内置的性能监控：

```typescript
// 定期输出性能指标
setInterval(() => {
  const metrics = table.getPerformanceMetrics()
  console.log('性能指标:', metrics)
}, 5000)
```

## 未来优化方向

1. **Web Workers 支持**：将计算密集型任务移到后台线程
2. **Intersection Observer**：更精确的可见性检测
3. **WebAssembly**：高性能计算模块
4. **GPU 加速**：利用 WebGL 进行大规模渲染

## 相关配置

完整的性能优化配置示例：

```typescript
const table = useTable({
  enableVirtual: true,
  rowHeight: (row) => calculateRowHeight(row),
  overscan: 5,
  viewportHeight: 600,
  virtualPerformance: {
    useTransform: true, // 使用 transform 减少重绘
    enableCache: true, // 启用缓存
    batchUpdateThreshold: 16, // 批处理间隔
    maxCacheSize: 1000, // 最大缓存
  },
  onVirtualScroll: (scrollTop) => {
    // 自定义滚动处理
    console.log('滚动位置:', scrollTop)
  },
})
```

## 总结

通过合理配置这些性能优化选项，可以显著提升虚拟滚动的性能表现。建议根据具体的使用场景和数据特点，选择合适的优化策略组合。
