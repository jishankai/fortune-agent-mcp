import { geoLookupService } from '../utils/geo_lookup_service.js';
import { solarTimeCalculator } from '../utils/solar_time_calculator.js';

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
 * 构建完整的星盘数据
 * @param {Object} astrolabe - iztro星盘对象
 * @returns {Object} 完整的星盘数据
 */
function buildCompleteAstrolabeData(astrolabe) {
  // 构建宫位数据 - 包含所有星曜信息
  const palace_data = astrolabe.palaces.map(palace => {
    const allStars = [
      ...palace.majorStars,
      ...palace.minorStars,
      ...palace.adjectiveStars
    ];
    
    return {
      name: palace.name,
      index: palace.index,
      heavenly_stem: palace.heavenlyStem,
      earthly_branch: palace.earthlyBranch,
      is_body_palace: palace.isBodyPalace,
      is_original_palace: palace.isOriginalPalace,
      // 主星列表
      major_stars: palace.majorStars.map(star => ({
        name: star.name,
        type: star.type,
        scope: star.scope,
        brightness: star.brightness,
        mutagen: star.mutagen || null
      })),
      // 辅星列表  
      minor_stars: palace.minorStars.map(star => ({
        name: star.name,
        type: star.type,
        scope: star.scope,
        brightness: star.brightness,
        mutagen: star.mutagen || null
      })),
      // 杂曜列表
      adjective_stars: palace.adjectiveStars.map(star => ({
        name: star.name,
        type: star.type,
        scope: star.scope,
        brightness: star.brightness,
        mutagen: star.mutagen || null
      })),
      // 所有星曜合并列表（为了兼容）
      stars: allStars.map(star => ({
        name: star.name,
        type: star.type,
        scope: star.scope,
        brightness: star.brightness,
        mutagen: star.mutagen || null
      }))
    };
  });
  
  // 构建星曜位置映射
  const star_locations = {};
  astrolabe.palaces.forEach(palace => {
    const allStars = [
      ...palace.majorStars,
      ...palace.minorStars,
      ...palace.adjectiveStars
    ];
    allStars.forEach(star => {
      star_locations[star.name] = {
        name: star.name,
        palace: palace.name,
        palace_index: palace.index,
        brightness: star.brightness,
        type: star.type,
        scope: star.scope,
        mutagen: star.mutagen || null
      };
    });
  });
  
  return { palace_data, star_locations };
}

/**
 * 生成阳历星盘（增强版）
 */
export async function generateAstrolabeSolar({ solar_date, time, gender, city, is_leap = false, include_fortune = true, query_year, query_month, query_day }) {
  try {
    const { astro } = await import('iztro');
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
    
    // 解析日期
    const [year, month, day] = solar_date.split('-').map(Number);
    
    // 计算真太阳时
    const solarTimeResult = solarTimeCalculator.getSolarTime({
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
    
    // 生成星盘
    const astrolabe = astro.bySolar(solar_date, timeIndex, gender, is_leap, 'zh-CN');
    
    // 构建基础信息 - 更完整的信息
    const basic_info = {
      solar_date: astrolabe.solarDate,
      lunar_date: astrolabe.lunarDate,
      time: astrolabe.time,
      time_range: astrolabe.timeRange,
      gender: gender,
      zodiac: astrolabe.zodiac,
      five_elements: astrolabe.fiveElementsClass,
      city: city,
      coordinates: coordinates,
      // 添加身宫信息
      body_palace: astrolabe.palaces.find(p => p.isBodyPalace)?.name || null
    };
    
    // 时间计算信息
    const time_calculation = {
      original_time: solarTimeResult.data.meanSolarTime,
      true_solar_time: trueSolarTime,
      time_index: timeIndex,
      time_branch: ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'][timeIndex],
      adjustment_minutes: Math.round(solarTimeResult.data.corrections.totalCorrection),
      equation_of_time: Math.round(solarTimeResult.data.corrections.equationOfTime),
      astronomical_data: solarTimeResult.data.astronomicalData
    };
    
    // 构建完整的星盘数据
    const { palace_data, star_locations } = buildCompleteAstrolabeData(astrolabe);
    
    // 构建返回结果
    const result = {
      success: true,
      data: {
        basic_info,
        time_calculation,
        palace_data,
        star_locations
      },
      message: '阳历星盘生成成功，已包含真太阳时计算'
    };
    
    return result;
  } catch (error) {
    console.error('阳历星盘生成失败:', error);
    return {
      success: false,
      error: error.message,
      message: '阳历星盘生成失败'
    };
  }
}

/**
 * 生成阴历星盘（增强版）
 */
export async function generateAstrolabeLunar({ lunar_date, time, gender, city, is_leap = false, include_fortune = true, query_year, query_month, query_day }) {
  try {
    const { astro } = await import('iztro');
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
    
    // 先生成基础星盘获取阳历日期
    const tempAstrolabe = astro.byLunar(lunar_date, 0, gender, is_leap, true, 'zh-CN');
    const solarDate = tempAstrolabe.solarDate;
    const [year, month, day] = solarDate.split('-').map(Number);
    
    // 计算真太阳时
    const solarTimeResult = solarTimeCalculator.getSolarTime({
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
    
    // 重新生成星盘
    const astrolabe = astro.byLunar(lunar_date, timeIndex, gender, is_leap, true, 'zh-CN');
    
    // 构建基础信息 - 更完整的信息
    const basic_info = {
      solar_date: astrolabe.solarDate,
      lunar_date: astrolabe.lunarDate,
      time: astrolabe.time,
      time_range: astrolabe.timeRange,
      gender: gender,
      zodiac: astrolabe.zodiac,
      five_elements: astrolabe.fiveElementsClass,
      city: city,
      coordinates: coordinates,
      is_leap_month: is_leap,
      // 添加身宫信息
      body_palace: astrolabe.palaces.find(p => p.isBodyPalace)?.name || null
    };
    
    // 时间计算信息
    const time_calculation = {
      original_time: solarTimeResult.data.meanSolarTime,
      true_solar_time: trueSolarTime,
      time_index: timeIndex,
      time_branch: ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'][timeIndex],
      adjustment_minutes: Math.round(solarTimeResult.data.corrections.totalCorrection),
      equation_of_time: Math.round(solarTimeResult.data.corrections.equationOfTime),
      astronomical_data: solarTimeResult.data.astronomicalData
    };
    
    // 构建完整的星盘数据
    const { palace_data, star_locations } = buildCompleteAstrolabeData(astrolabe);
    
    // 构建返回结果
    const result = {
      success: true,
      data: {
        basic_info,
        time_calculation,
        palace_data,
        star_locations
      },
      message: '阴历星盘生成成功，已包含真太阳时计算'
    };
    
    return result;
  } catch (error) {
    console.error('阴历星盘生成失败:', error);
    return {
      success: false,
      error: error.message,
      message: '阴历星盘生成失败'
    };
  }
}
