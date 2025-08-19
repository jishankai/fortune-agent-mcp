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
 * 生成阳历运势
 */
async function generateHoroscopeSolar({ solar_date, time, gender, city, is_leap = false, query_year, query_month, query_day }) {
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

    // 使用星盘的horoscope方法获取运势
    const queryDate = new Date(query_year, query_month - 1, query_day);
    const fortune_analysis = astrolabe.horoscope(queryDate);

    return fortune_analysis;
  } catch (error) {
    throw new Error(`阳历运势生成失败: ${error.message}`);
  }
}

/**
 * 生成阴历运势
 */
async function generateHoroscopeLunar({ lunar_date, time, gender, city, is_leap = false, query_year, query_month, query_day }) {
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

    // 使用星盘的horoscope方法获取运势
    const queryDate = new Date(query_year, query_month - 1, query_day);
    const fortune_analysis = astrolabe.horoscope(queryDate);

    return fortune_analysis;
  } catch (error) {
    throw new Error(`阴历运势生成失败: ${error.message}`);
  }
}

export async function getDecadalHoroscope(date, time, gender, city, is_lunar = false, query_year) {
  try {
    let horoscopeData;
    if (!is_lunar) {
      horoscopeData = await generateHoroscopeSolar({solar_date: date, time, gender, city, is_leap: false, query_year, query_month: 1, query_day: 1});
    } else {
      horoscopeData = await generateHoroscopeLunar({lunar_date: date, time, gender, city, is_leap: false, query_year, query_month: 1, query_day: 1});
    }
    return {
      success: true,
      data: horoscopeData.decadal,
      message: '运势生成成功'
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error.message,
      message: '运势生成失败'
    };
  }
}

export async function getAgeHoroscope(date, time, gender, city, is_lunar = false, query_year) {
  try {
    let horoscopeData;
    if (!is_lunar) {
      horoscopeData = await generateHoroscopeSolar({solar_date: date, time, gender, city, is_leap: false, query_year, query_month: 1, query_day: 1});
    } else {
      horoscopeData = await generateHoroscopeLunar({lunar_date: date, time, gender, city, is_leap: false, query_year, query_month: 1, query_day: 1});
    }
    return {
      success: true,
      data: horoscopeData.age,
      message: '运势生成成功'
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error.message,
      message: '运势生成失败'
    };
  }
}

export async function getYearlyHoroscope(date, time, gender, city, is_lunar = false, query_year) {
  try {
    let horoscopeData;
    if (!is_lunar) {
      horoscopeData = await generateHoroscopeSolar({solar_date: date, time, gender, city, is_leap: false, query_year, query_month: 1, query_day: 1});
    } else {
      horoscopeData = await generateHoroscopeLunar({lunar_date: date, time, gender, city, is_leap: false, query_year, query_month: 1, query_day: 1});
    }
    return {
      success: true,
      data: horoscopeData.yearly,
      message: '运势生成成功'
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error.message,
      message: '运势生成失败'
    };
  }
}

export async function getMonthlyHoroscope(date, time, gender, city, is_lunar = false, query_year, query_month) {
  try {
    let horoscopeData;
    if (!is_lunar) {
      horoscopeData = await generateHoroscopeSolar({solar_date: date, time, gender, city, is_leap: false, query_year, query_month, query_day: 1});
    } else {
      horoscopeData = await generateHoroscopeLunar({lunar_date: date, time, gender, city, is_leap: false, query_year, query_month, query_day: 1});
    }
    return {
      success: true,
      data: horoscopeData.monthly,
      message: '运势生成成功'
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error.message,
      message: '运势生成失败'
    };
  }
}

export async function getDailyHoroscope(date, time, gender, city, is_lunar = false, query_year, query_month, query_day) {
  try {
    let horoscopeData;
    if (!is_lunar) {
      horoscopeData = await generateHoroscopeSolar({solar_date: date, time, gender, city, is_leap: false, query_year, query_month, query_day});
    } else {
      horoscopeData = await generateHoroscopeLunar({lunar_date: date, time, gender, city, is_leap: false, query_year, query_month, query_day});
    }
    return {
      success: true,
      data: horoscopeData.daily,
      message: '运势生成成功'
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error.message,
      message: '运势生成失败'
    };
  }
}
