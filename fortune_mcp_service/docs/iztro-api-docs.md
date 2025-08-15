# iztro API 文档

## 基本用法

### 安装
```bash
npm install iztro
```

### 导入
```javascript
import { astro } from 'iztro';
```

## 核心API

### astro.bySolar() - 阳历星盘生成
参数：
- `solarDateStr`: 阳历日期字符串，格式："YYYY-M-D" (必需)
- `timeIndex`: 出生时辰索引，0-12 (必需)
- `gender`: 性别，"男" 或 "女" (必需)
- `fixLeap`: 是否调整闰月，布尔值 (可选，默认true)
- `language`: 国际化选项 (可选，默认"zh-CN")

示例：
```javascript
const astrolabe = astro.bySolar("2000-8-16", 2, "女");
```

### astro.byLunar() - 农历星盘生成
参数：
- `lunarDateStr`: 农历日期字符串，格式："YYYY-M-D" (必需)
- `timeIndex`: 出生时辰索引，0-12 (必需)
- `gender`: 性别，"男" 或 "女" (必需)
- `isLeapMonth`: 是否闰月 (可选)
- `fixLeap`: 是否调整闰月，布尔值 (可选，默认true)
- `language`: 国际化选项 (可选，默认"zh-CN")

示例：
```javascript
const astrolabe = astro.byLunar("2000-7-17", 2, "女");
```

## 时辰对应表 (timeIndex)
- 0: 子时 (23:00-1:00)
- 1: 丑时 (1:00-3:00)
- 2: 寅时 (3:00-5:00)
- 3: 卯时 (5:00-7:00)
- 4: 辰时 (7:00-9:00)
- 5: 巳时 (9:00-11:00)
- 6: 午时 (11:00-13:00)
- 7: 未时 (13:00-15:00)
- 8: 申时 (15:00-17:00)
- 9: 酉时 (17:00-19:00)
- 10: 戌时 (19:00-21:00)
- 11: 亥时 (21:00-23:00)

## 运势查询

### 获取运限数据
```javascript
// 获取流年运势
const yearlyHoroscope = astrolabe.horoscope(2025);

// 获取流月运势
const monthlyHoroscope = astrolabe.horoscope(2025, 3);

// 获取流日运势
const dailyHoroscope = astrolabe.horoscope(new Date());
```

## 星盘对象结构
返回的 `FunctionalAstrolabe` 对象包含：
- `palaces`: 十二宫位信息
- `solarDate`: 阳历日期
- `lunarDate`: 农历日期
- `time`: 时辰
- `gender`: 性别
- `horoscope()`: 运势查询方法

## 注意事项
1. 日期格式必须为字符串
2. 时辰索引从0开始
3. 性别参数必须为中文"男"或"女"
4. 方法返回完整的星盘对象，包含所有宫位和星曜信息