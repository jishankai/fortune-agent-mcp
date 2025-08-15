# iztro 宫位 (Palace) 文档

## 宫位概述
紫微斗数共有12个主要宫位，代表人生的不同方面，如"命宫"（Life Palace）、"兄弟宫"（Siblings Palace）等。

## 宫位类型

### 主要宫位（12个）
1. 命宫 - 代表个人性格和基本运势
2. 兄弟宫 - 代表兄弟姐妹关系
3. 夫妻宫 - 代表婚姻感情
4. 子女宫 - 代表子女和创造力
5. 财帛宫 - 代表财运
6. 疾厄宫 - 代表健康
7. 迁移宫 - 代表外出和人际关系
8. 奴仆宫 - 代表下属和朋友
9. 官禄宫 - 代表事业
10. 田宅宫 - 代表家庭和房产
11. 福德宫 - 代表精神享受
12. 父母宫 - 代表父母和长辈

### 隐藏宫位（3个）
- 身宫 - 身宫所在位置
- 来因宫 - 前世因缘
- 暗合宫 - 暗合关系

## FunctionalPalace 类方法

### has() - 检查星曜
```javascript
palace.has(starNames);
```
检查宫位中是否包含特定星曜

### isEmpty() - 判断空宫
```javascript
palace.isEmpty();
```
判断宫位是否没有主星

### hasMutagen() - 检查四化星
```javascript
palace.hasMutagen(mutagenType);
```
检查宫位中是否有特定的四化星（禄权科忌）

### fliesTo() - 分析飞星
```javascript
palace.fliesTo(targetPalace);
```
分析星曜在宫位之间的飞化关系

### selfMutaged() - 自化分析
```javascript
palace.selfMutaged();
```
检查宫位内星曜的自我四化情况

## 使用建议
- 建议通过星盘对象访问宫位，而不是手动创建宫位对象
- 宫位的计算基于出生日期和时间
- 每个宫位都包含特定的星曜配置和属性

## 宫位计算
宫位根据出生日期和时间自动计算，用户通常不需要手动干预计算过程。