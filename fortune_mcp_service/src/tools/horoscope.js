import { generateAstrolabe, formatPalace, formatSurroundedPalaces, getAstrolabeBasicInfo } from '../utils/astrolabe_helper.js';
import { detectPatterns } from '../utils/patterns.js';

/**
 * 通用运势查询函数
 * @param {Object} params - 查询参数
 * @param {string} scope - 时间框架 ('yearly', 'monthly', 'daily', 'decadal')
 * @param {Date} query_date - 查询日期
 * @param {Object} astrolabe - 星盘对象
 * @param {string} palace_name - 宫位名称
 * @returns {Object} 格式化的运势数据
 */
function getHoroscopeData(scope, query_date, astrolabe, palace_name) {
  const horoscope = astrolabe.horoscope(query_date);

  const result = {};
  result["星盘基本信息"] = getAstrolabeBasicInfo(astrolabe);

  console.log(`查询${scope}盘，目标宫位：${palace_name}，查询日期：${query_date.toISOString().split('T')[0]}`);
  const scFormattedPalace = formatPalace(horoscope.palace(palace_name, scope), horoscope[scope], scope);
  const scSurroundedPalaces = horoscope.surroundPalaces(palace_name, scope);
  const scFormattedSurroundedPalaces = formatSurroundedPalaces(scSurroundedPalaces, horoscope[scope], scope);

  const scopeName = {
    'daily': '流日盘',
    'monthly': '流月盘',
    'yearly': '流年盘',
    'decadal': '大限盘'
  }[scope];

  const scopePatterns = detectPatterns(horoscope, scope);

  result[scopeName] = {
    "目标宫位": scFormattedPalace,
    "三方四正": scFormattedSurroundedPalaces,
    "运限格局": scopePatterns
  };

  // // 添加小限盘
  // if (scope === 'decadal') {
  //   const ageFormattedPalace = formatPalace(horoscope.agePalace(), horoscope[scope], scope);
  //   const ageSurroundedPalaces = horoscope.surroundPalaces(horoscope.agePalace().name, 'age');
  //   const ageFormattedSurroundedPalaces = formatSurroundedPalaces(ageSurroundedPalaces, horoscope[scope], scope);

  //   result["小限盘"] = {
  //     "目标宫位": ageFormattedPalace,
  //     "三方四正": ageFormattedSurroundedPalaces,
  //   };
  // }

  // if (scope === 'yearly') {
  //   const decadalScopePatterns = detectPatterns(horoscope, 'decadal');
  //   const decadalFormattedPalace = formatPalace(horoscope.palace(palace_name, 'decadal'), horoscope['decadal'], 'decadal');
  //   const decadalSurroundedPalaces = horoscope.surroundPalaces(palace_name, 'decadal');
  //   const decadalFormattedSurroundedPalaces = formatSurroundedPalaces(decadalSurroundedPalaces, horoscope['decadal'], 'decadal');

  //   result["大限盘"] = {
  //     "目标宫位": decadalFormattedPalace,
  //     "三方四正": decadalFormattedSurroundedPalaces,
  //     "运限格局": decadalScopePatterns
  //   };
  // }

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
    
    const query_date = new Date(query_year, 2, 1);
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

    const query_date = new Date(query_year, 2, 1);
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
