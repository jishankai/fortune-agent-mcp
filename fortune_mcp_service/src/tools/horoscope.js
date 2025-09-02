import { generateAstrolabe, formatPalace, formatSurroundedPalaces, getAstrolabeBasicInfo } from '../utils/astrolabe_helper.js';
import { detectPatterns } from '../utils/patterns.js';

/**
 * 通用运势查询函数
 * @param {Object} params - 查询参数
 * @param {string} scope - 时间框架 ('yearly', 'monthly', 'daily', 'decadal')
 * @param {Date} query_date - 查询日期
 * @param {Object} astrolabe - 星盘对象
 * @param {string} palace_name - 宫位名称
 * @param {boolean} isLite - 是否为轻量版本
 * @returns {Object} 格式化的运势数据
 */
function getHoroscopeData(scope, query_date, astrolabe, palace_name, isLite = false) {
  const horoscope = astrolabe.horoscope(query_date);
  
  const result = {};
  
  if (!isLite) {
    const formattedPalace = formatPalace(astrolabe.palace(palace_name));
    const surroundedPalaces = astrolabe.surroundedPalaces(palace_name);
    const formattedSurroundedPalaces = formatSurroundedPalaces(surroundedPalaces);
    
    // Detect patterns in the base chart
    const basePatterns = detectPatterns(astrolabe);
    
    result["星盘基本信息"] = getAstrolabeBasicInfo(astrolabe);
    result["本命盘"] = {
      "目标宫位": formattedPalace,
      "三方四正": formattedSurroundedPalaces,
    };
    result["本命格局"] = basePatterns;
  }
  
  // 根据时间框架添加对应的运势数据
  const scopes = ['daily', 'monthly', 'yearly', 'decadal'];
  
  for (const sc of scopes) {
    const shouldInclude = 
      (scope === 'daily' && ['daily', 'monthly', 'yearly', 'decadal'].includes(sc)) ||
      (scope === 'monthly' && ['monthly', 'yearly', 'decadal'].includes(sc)) ||
      (scope === 'yearly' && ['yearly', 'decadal'].includes(sc)) ||
      (scope === 'decadal' && sc === 'decadal');
      
    if (shouldInclude) {
      const scFormattedPalace = formatPalace(horoscope.palace(palace_name, sc));
      const scSurroundedPalaces = astrolabe.surroundedPalaces(palace_name);
      const scFormattedSurroundedPalaces = formatSurroundedPalaces(scSurroundedPalaces);
      
      const scopeName = {
        'daily': '流日盘',
        'monthly': '流月盘', 
        'yearly': '流年盘',
        'decadal': '大限盘'
      }[sc];
      
      // Detect patterns for this temporal scope using active chart
      // Note: For temporal pattern detection (like 禄衰马困), we pass the horoscope data as activeChart
      const temporalPatterns = detectPatterns(astrolabe, horoscope);
      
      result[scopeName] = {
        "目标宫位": scFormattedPalace,
        "三方四正": scFormattedSurroundedPalaces,
        "运限格局": temporalPatterns
      };
    }
  }
  
  // 添加小限盘
  if (!isLite || scope === 'daily' || scope === 'monthly' || scope === 'yearly') {
    const ageFormattedPalace = formatPalace(horoscope.agePalace());
    const ageSurroundedPalaces = astrolabe.surroundedPalaces(horoscope.agePalace().name);
    const ageFormattedSurroundedPalaces = formatSurroundedPalaces(ageSurroundedPalaces);
    
    result["小限盘"] = {
      "目标宫位": ageFormattedPalace,
      "三方四正": ageFormattedSurroundedPalaces,
    };
  }
  
  return result;
}

export async function getHoroscope({ birth_date, birth_time, gender, city, is_lunar = false, is_leap = false, palace_name, query_year }) {
  try {
    const astrolabe = await generateAstrolabe({
      birth_date,
      time: birth_time,
      gender,
      city,
      is_lunar,
      is_leap
    });
    
    const query_date = new Date(query_year, 0, 1);
    const data = getHoroscopeData('decadal', query_date, astrolabe, palace_name);
    
    return {
      success: true,
      data,
      message: `${palace_name}大限信息查询成功`,
      time: new Date().toISOString()
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error.message,
      message: '运势生成失败',
      time: new Date().toISOString()
    };
  }
}

export async function getYearlyHoroscope({ birth_date, birth_time, gender, city, is_lunar = false, is_leap = false, palace_name, query_year }) {
  try {
    const astrolabe = await generateAstrolabe({
      birth_date,
      time: birth_time,
      gender,
      city,
      is_lunar,
      is_leap
    });

    const query_date = new Date(query_year, 0, 1);
    const data = getHoroscopeData('yearly', query_date, astrolabe, palace_name);

    return {
      success: true,
      data,
      message: `${palace_name}流年信息查询成功（${query_year}年）`,
      time: new Date().toISOString()
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error.message,
      message: '流年运势生成失败',
      time: new Date().toISOString()
    };
  }
}

export async function getMonthlyHoroscope({ birth_date, birth_time, gender, city, is_lunar = false, is_leap = false, palace_name, query_year, query_month }) {
  try {
    const astrolabe = await generateAstrolabe({
      birth_date,
      time: birth_time,
      gender,
      city,
      is_lunar,
      is_leap
    });

    const query_date = new Date(query_year, query_month - 1, 1);
    const data = getHoroscopeData('monthly', query_date, astrolabe, palace_name);

    return {
      success: true,
      data,
      message: `${palace_name}流月信息查询成功（${query_year}年${query_month}月）`,
      time: new Date().toISOString()
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error.message,
      message: '流月运势生成失败',
      time: new Date().toISOString()
    };
  }
}

export async function getDailyHoroscope({ birth_date, birth_time, gender, city, is_lunar = false, is_leap = false, palace_name, query_year, query_month, query_day }) {
  try {
    const astrolabe = await generateAstrolabe({
      birth_date,
      time: birth_time,
      gender,
      city,
      is_lunar,
      is_leap
    });

    const query_date = new Date(query_year, query_month - 1, query_day);
    const data = getHoroscopeData('daily', query_date, astrolabe, palace_name);

    return {
      success: true,
      data,
      message: `${palace_name}流日信息查询成功（${query_year}年${query_month}月${query_day}日）`,
      time: new Date().toISOString()
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error.message,
      message: '流日运势生成失败',
      time: new Date().toISOString()
    };
  }
}

export async function getYearlyHoroscopeLite({ birth_date, birth_time, gender, city, is_lunar = false, is_leap = false, palace_name, query_year }) {
  try {
    const astrolabe = await generateAstrolabe({
      birth_date,
      time: birth_time,
      gender,
      city,
      is_lunar,
      is_leap
    });

    const query_date = new Date(query_year, 0, 1);
    const data = getHoroscopeData('yearly', query_date, astrolabe, palace_name, true);

    return {
      success: true,
      data,
      message: `${palace_name}择时流年查询成功（${query_year}年）`,
      time: new Date().toISOString()
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error.message,
      message: '择时流年查询失败',
      time: new Date().toISOString()
    };
  }
}

export async function getMonthlyHoroscopeLite({ birth_date, birth_time, gender, city, is_lunar = false, is_leap = false, palace_name, query_year, query_month }) {
  try {
    const astrolabe = await generateAstrolabe({
      birth_date,
      time: birth_time,
      gender,
      city,
      is_lunar,
      is_leap
    });

    const query_date = new Date(query_year, query_month - 1, 1);
    const data = getHoroscopeData('monthly', query_date, astrolabe, palace_name, true);

    return {
      success: true,
      data,
      message: `${palace_name}择时流月查询成功（${query_year}年${query_month}月）`,
      time: new Date().toISOString()
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error.message,
      message: '择时流月查询失败',
      time: new Date().toISOString()
    };
  }
}

export async function getDailyHoroscopeLite({ birth_date, birth_time, gender, city, is_lunar = false, is_leap = false, palace_name, query_year, query_month, query_day }) {
  try {
    const astrolabe = await generateAstrolabe({
      birth_date,
      time: birth_time,
      gender,
      city,
      is_lunar,
      is_leap
    });

    const query_date = new Date(query_year, query_month - 1, query_day);
    const data = getHoroscopeData('daily', query_date, astrolabe, palace_name, true);

    return {
      success: true,
      data,
      message: `${palace_name}择时流日查询成功（${query_year}年${query_month}月${query_day}日）`,
      time: new Date().toISOString()
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error.message,
      message: '择时流日查询失败',
      time: new Date().toISOString()
    };
  }
}
