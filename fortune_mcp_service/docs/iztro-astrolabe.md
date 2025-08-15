# iztro 星盘 (Astrolabe) 文档

## 星盘结构
紫微斗数星盘由12个宫位和一个中央宫位组成，宫位按顺时针排列，从"寅"宫开始，索引为0。

## 静态方法

### 1. bySolar() - 阳历生成星盘
生成基于阳历日期的星盘
```javascript
const astrolabe = astro.bySolar(date, timeIndex, gender, language);
```
参数：
- `date`: 阳历日期
- `timeIndex`: 时辰索引  
- `gender`: 性别
- `language`: 语言（可选）

### 2. byLunar() - 农历生成星盘
生成基于农历日期的星盘
```javascript
const astrolabe = astro.byLunar(date, timeIndex, gender, language);
```
参数类似于`bySolar()`，建议优先使用`bySolar()`方法。

### 3. withOptions() - 灵活配置生成
使用各种配置选项灵活生成星盘
```javascript
const astrolabe = astro.withOptions(options);
```

## 星盘对象方法

### horoscope() - 获取运势信息
```javascript
const fortune = astrolabe.horoscope(year, month);
```
获取指定时间的运势/运气信息

### palace() - 获取宫位详情
```javascript
const palaceInfo = astrolabe.palace(palaceName);
```
检索特定宫位的详细信息

### star() - 获取星曜信息
```javascript
const starInfo = astrolabe.star(starName);
```
获取特定星曜的信息

### surroundedPalaces() - 分析周围宫位
```javascript
const surrounding = astrolabe.surroundedPalaces(palaceName);
```
分析指定宫位周围的宫位关系

## 特色功能
1. **多语言支持**：支持多种语言输出
2. **全面分析**：提供完整的占星学分析工具
3. **灵活配置**：可根据需要配置各种选项
4. **运势查询**：支持多种时间维度的运势查询

## 数据结构
星盘对象包含：
- 12个宫位的详细信息
- 各宫位中的星曜分布
- 四化飞星信息
- 运势分析方法
- 其他占星学相关数据