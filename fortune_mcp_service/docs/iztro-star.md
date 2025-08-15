# iztro 星曜 (Star) 文档

## 星曜概述
星曜是紫微斗数系统中性格分析的关键组成部分。

## 星曜分类

### 主要分类
1. **主星** (Main Stars) - 主要影响力的星曜
2. **辅星** (Auxiliary Stars) - 辅助性星曜
3. **杂曜** (Miscellaneous Stars) - 其他星曜

### 特殊说明
- 48颗神煞星不归类于星曜系统

## FunctionalStar 接口方法

### palace() - 获取所在宫位
```javascript
const palace = star.palace();
```
识别星曜所在的宫位

### surroundedPalaces() - 获取周围宫位
```javascript
const surrounding = star.surroundedPalaces();
```
查找星曜周围的宫位

### oppositePalace() - 获取对宫
```javascript
const opposite = star.oppositePalace();
```
确定星曜的对宫位置

### brightness() - 获取亮度
```javascript
const brightness = star.brightness();
```
检查星曜的亮度状态（庙、旺、得、利、平、不、陷）

### mutagen() - 获取四化
```javascript
const mutagen = star.mutagen();
```
检测星曜的四化状态（禄、权、科、忌）

## 使用示例
```javascript
// 通过星盘获取星曜
const astrolabe = astro.bySolar("2000-8-16", 2, "女", true, "zh-CN");
const purpleStar = astrolabe.star("紫微");
const palace = purpleStar.palace();
```

## 重要提醒
- 用户不应手动创建 `FunctionalStar` 对象
- 应使用其他对象返回的星曜实例
- 所有星曜操作都通过星盘对象进行

## 星曜属性
每个星曜都有以下关键属性：
- **位置**：所在宫位
- **亮度**：星曜的强弱状态
- **四化**：禄权科忌的转化状态
- **周围关系**：与其他宫位的关系