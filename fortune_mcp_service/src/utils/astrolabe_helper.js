import { geoLookupService } from './geo_lookup_service.js';
import { solarTimeCalculator } from './solar_time_calculator.js';

/**
 * 星曜类型中文映射
 * @param {string} type - 英文星曜类型
 * @returns {string} 中文星曜类型
 */
function starsTypeMapping(type) {
  const stars = {
    'major': '主星',
    'soft': '吉星', 
    'tough': '煞星',
    'adjective': '杂耀',
    'flower': '桃花',
    'helper': '解神',
    'lucun': '禄存',
    'tianma': '天马'
  };
  
  return stars[type] || type;
}

function scopeMapping(scope) {
  const scopes = {
    'daily': '流日星耀',
    'monthly': '流月星耀',
    'yearly': '流年星耀',
    'decadal': '大限星耀',
    'origin': '本命星耀'
  };

  return scopes[scope] || scope;
}

const MUTAGENS_MAPPING = ['禄', '权', '科', '忌'];

/**
 * 计算时辰索引
 * @param {number} hour - 小时
 * @param {number} minute - 分钟
 * @returns {number} 时辰索引 (0-11对应子-亥时)
 */
function getTimeIndex(hour, minute) {
  const totalMinutes = hour * 60 + minute;
  
  // 子时: 23:00-01:00
  if (totalMinutes >= 23 * 60 || totalMinutes < 1 * 60) return 0;
  // 丑时: 01:00-03:00  
  else if (totalMinutes >= 1 * 60 && totalMinutes < 3 * 60) return 1;
  // 寅时: 03:00-05:00
  else if (totalMinutes >= 3 * 60 && totalMinutes < 5 * 60) return 2;
  // 卯时: 05:00-07:00
  else if (totalMinutes >= 5 * 60 && totalMinutes < 7 * 60) return 3;
  // 辰时: 07:00-09:00
  else if (totalMinutes >= 7 * 60 && totalMinutes < 9 * 60) return 4;
  // 巳时: 09:00-11:00
  else if (totalMinutes >= 9 * 60 && totalMinutes < 11 * 60) return 5;
  // 午时: 11:00-13:00
  else if (totalMinutes >= 11 * 60 && totalMinutes < 13 * 60) return 6;
  // 未时: 13:00-15:00
  else if (totalMinutes >= 13 * 60 && totalMinutes < 15 * 60) return 7;
  // 申时: 15:00-17:00
  else if (totalMinutes >= 15 * 60 && totalMinutes < 17 * 60) return 8;
  // 酉时: 17:00-19:00
  else if (totalMinutes >= 17 * 60 && totalMinutes < 19 * 60) return 9;
  // 戌时: 19:00-21:00
  else if (totalMinutes >= 19 * 60 && totalMinutes < 21 * 60) return 10;
  // 亥时: 21:00-23:00
  else return 11;
}

/**
 * 生成星盘（统一版本，支持阳历和农历）
 */
export async function generateAstrolabe({ birth_date, time, gender, city, is_lunar = false, is_leap = false }) {
  try {
    const { astro } = await import('iztro');
    astro.config({ yearDivide: 'normal' });
    const [hour, minute] = time.split(':').map(Number);
    
    // 检查必需参数
    if (!city) {
      throw new Error('城市参数为必填项');
    }
    
    // 获取城市坐标
    const locationResult = geoLookupService.lookupAddress(city);
    
    if (!locationResult.success) {
      throw new Error(`城市查询失败: ${locationResult.error}`);
    }
    
    const coordinates = {
      lat: locationResult.data.latitude,
      lng: locationResult.data.longitude
    };
    
    let astrolabe;
    let solarTimeResult;
    
    if (is_lunar) {
      // 农历处理：先获取对应的阳历日期
      const tempAstrolabe = astro.byLunar(birth_date, 0, gender, is_leap, true, 'zh-CN');
      const solarDate = tempAstrolabe.solarDate;
      const [year, month, day] = solarDate.split('-').map(Number);
      
      // 基于阳历日期计算真太阳时
      solarTimeResult = solarTimeCalculator.getSolarTime({
        dateTime: { year, month, day, hour, minute, second: 0 },
        longitude: coordinates.lng,
        latitude: coordinates.lat
      });
      
      if (!solarTimeResult.success) {
        throw new Error(`真太阳时计算失败: ${solarTimeResult.error}`);
      }
      
      // 使用真太阳时计算时辰
      const trueSolarTime = solarTimeResult.data.trueSolarTime;
      const timeIndex = getTimeIndex(trueSolarTime.hour, trueSolarTime.minute);
      
      // 使用修正后的时辰重新生成农历星盘
      astrolabe = astro.byLunar(birth_date, timeIndex, gender, is_leap, true, 'zh-CN');
    } else {
      // 阳历处理
      const [year, month, day] = birth_date.split('-').map(Number);
      
      // 计算真太阳时
      solarTimeResult = solarTimeCalculator.getSolarTime({
        dateTime: { year, month, day, hour, minute, second: 0 },
        longitude: coordinates.lng,
        latitude: coordinates.lat
      });
      
      if (!solarTimeResult.success) {
        throw new Error(`真太阳时计算失败: ${solarTimeResult.error}`);
      }
      
      // 使用真太阳时计算时辰
      const trueSolarTime = solarTimeResult.data.trueSolarTime;
      const timeIndex = getTimeIndex(trueSolarTime.hour, trueSolarTime.minute);
      
      // 生成阳历星盘
      astrolabe = astro.bySolar(birth_date, timeIndex, gender, is_leap, 'zh-CN');
    }
    
    return astrolabe;
  } catch (error) {
    throw new Error(`星盘生成失败: ${error.message}`);
  }
}

/**
 * 格式化宫位的通用函数
 */
export function formatPalace(palace, horoscope = {}, scope = 'origin') {
  console.log(horoscope);
  const ret = {
    "宫位索引": palace.index,
    "宫位名称": horoscope?.palaceNames?.[palace.index] || palace.name,
    "是否身宫": palace.isBodyPalace,
    "是否本宫": palace.isOriginalPalace,
    "天干": palace.heavenlyStem,
    "地支": palace.earthlyBranch,
    "主星": palace.majorStars?.map(star => ({
      "星曜名称": star.name,
      "星曜类型": starsTypeMapping(star.type),
      "作用范围": scopeMapping(star.scope),
      "亮度": star.brightness || "无",
      "本命盘四化": star.mutagen ? star.name+'化'+star.mutagen : "无"
    })) || [],
    "辅星": palace.minorStars?.map(star => ({
      "星曜名称": star.name,
      "星曜类型": starsTypeMapping(star.type),
      "作用范围": scopeMapping(star.scope),
      "亮度": star.brightness || "无"
    })) || [],
    "杂曜": palace.adjectiveStars?.map(star => ({
      "星曜名称": star.name,
      "星曜类型": starsTypeMapping(star.type),
      "作用范围": scopeMapping(star.scope)
    })) || [],
  };
  if (scope == 'origin') {
    ret["长生十二神"] = palace.changsheng12 || "无",
    ret["博士十二神"] = palace.boshi12 || "无"
  } else {
    ret["将前十二神"] = palace.jiangqian12 || "无",
    ret["岁前十二神"] = palace.suiqian12 || "无"
  }
  if (scope == 'decadal') {
    ret["运耀"] = horoscope.stars[palace.index]?.map(star => ({
      "星曜名称": star.name,
      "星曜类型": starsTypeMapping(star.type),
      "作用范围": scopeMapping(star.scope),
      "亮度": star.brightness || "无",
      "运耀四化": star.mutagen ? star.name+'化'+star.mutagen : "无"
    })) || [];
    // 查询stars.name是不是在horoscope.mutagens里
    ret["大限飞星四化"] = horoscope.mutagen?.reduce((acc, mutagen, i) => {
      if (palace.majorStars?.some(star => star.name === mutagen)) {
        acc.push(mutagen + '化' + MUTAGENS_MAPPING[i]);
      }
      return acc;
    }, []) || [];

  }
  if (scope == 'yearly') {
    ret["流曜"] = horoscope.stars[palace.index]?.map(star => ({
      "星曜名称": star.name,
      "星曜类型": starsTypeMapping(star.type),
      "作用范围": scopeMapping(star.scope),
      "亮度": star.brightness || "无",
      "流曜四化": star.mutagen ? star.name+'化'+star.mutagen : "无"
    })) || [];
    ret["流年飞星四化"] = horoscope.mutagen?.reduce((acc, mutagen, i) => {
      if (palace.majorStars?.some(star => star.name === mutagen)) {
        acc.push(mutagen + '化' + MUTAGENS_MAPPING[i]);
      }
      return acc;
    }, []) || [];
  }
  return ret;
}

/**
 * 格式化三方四正宫位信息
 */
export function formatSurroundedPalaces(surroundedPalaces, horoscope = {}, scope = 'origin') {
  return {
    "对宫": formatPalace(surroundedPalaces.opposite, horoscope, scope),
    "三方": {
      "三合宫之一": formatPalace(surroundedPalaces.wealth, horoscope, scope),
      "三合宫之二": formatPalace(surroundedPalaces.career, horoscope, scope),
    },
  };
}

/**
 * 获取星盘基本信息的通用函数
 */
export function getAstrolabeBasicInfo(astrolabe) {
  return {
    "阳历日期": astrolabe.solarDate,
    "农历日期": astrolabe.lunarDate,
    "四柱": astrolabe.chineseDate,
    "时辰": astrolabe.time,
    "时辰对应时间段": astrolabe.timeRange,
    "星座": astrolabe.sign,
    "生肖": astrolabe.zodiac,
    "命宫地支": astrolabe.earthlyBranchOfSoulPalace,
    "身宫地支": astrolabe.earthlyBranchOfBodyPalace,
    "命主": astrolabe.soul,
    "身主": astrolabe.body,
    "五行局": astrolabe.fiveElementsClass
  };
}
