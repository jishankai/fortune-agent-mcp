# iztro 运势 (Horoscope) 文档

## 运势时间范围
iztro库涵盖不同时间范围的运势：

### 时间维度
1. **大限** (Decadal) - 十年大运
2. **小限** (Age Limit) - 年龄限运
3. **流年** (Yearly) - 年运势
4. **流月** (Monthly) - 月运势  
5. **流日** (Daily) - 日运势
6. **流时** (Hourly) - 时运势

### 运势特点
- **大限**和**流年**：同时具有"流耀"（运势星曜）和"四化"（禄权科忌）
- **其他时间范围**：仅有"四化"
- **小限**：特殊情况，既没有运势星曜也没有四化

## FunctionalHoroscope 类方法

### getAgePalace() - 获取年龄宫位
```javascript
const agePalace = horoscope.getAgePalace();
```
获取当前年龄对应的宫位

### getPalaceInfo() - 获取宫位信息
```javascript
const palaceInfo = horoscope.getPalaceInfo(palaceName);
```
检索特定宫位的运势信息

### getSurroundingPalaces() - 获取周围宫位
```javascript
const surrounding = horoscope.getSurroundingPalaces(palaceName);
```
检查指定宫位周围的宫位运势

### hasHoroscopeStars() - 检查运势星曜
```javascript
const hasStars = horoscope.hasHoroscopeStars(palaceName);
```
验证宫位中是否存在运势星曜

### hasMutagens() - 检查四化
```javascript
const hasMutagens = horoscope.hasMutagens(palaceName, mutagenType);
```
检测宫位中特定的四化（禄权科忌）

## 使用示例
```javascript
// 获取流年运势
const yearlyHoroscope = astrolabe.horoscope(2025);

// 获取流月运势
const monthlyHoroscope = astrolabe.horoscope(2025, 3);

// 获取特定宫位的运势信息
const palaceHoroscope = yearlyHoroscope.getPalaceInfo("命宫");
```

## 运势计算原理
运势通过分析不同时间维度下的星曜变化和四化飞星来判断吉凶，为紫微斗数预测提供重要依据。

## 注意事项
- 不同时间范围的运势计算方法不同
- 大限和流年是最重要的运势分析维度
- 小限在现代紫微斗数中较少使用