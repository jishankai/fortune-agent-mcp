import { analyzeSynastryByUserInfo } from '../utils/synastry_analyzer.js';

/**
 * 通过输入信息进行合盘分析
 */
export async function analyzeSynastryByInfo({ 
  birth_date_a, birth_time_a, gender_a, city_a, name_a = "A",
  birth_date_b, birth_time_b, gender_b, city_b, name_b = "B",
  is_lunar_a = false, is_leap_a = false,
  is_lunar_b = false, is_leap_b = false,
}) {
  try {
    return await analyzeSynastryByUserInfo({ 
      birth_date_a, birth_time_a, gender_a, city_a, name_a,
      birth_date_b, birth_time_b, gender_b, city_b, name_b,
      is_lunar_a, is_leap_a, is_lunar_b, is_leap_b,
      scope: 'origin' // 目前仅支持本命盘合盘分析
    });
  } catch (error) {
    console.error('合盘分析失败:', error);
    return {
      success: false,
      error: error.message,
      message: '合盘分析失败',
      time: new Date().toISOString()
    };
  }
}

export async function analyzeDecadalSynastryByInfo({
  birth_date_a, birth_time_a, gender_a, city_a, name_a = "A",
  birth_date_b, birth_time_b, gender_b, city_b, name_b = "B",
  is_lunar_a = false, is_leap_a = false,
  is_lunar_b = false, is_leap_b = false,
  query_year
}) {
  try {
    const query_date = new Date(query_year, 2, 1);

    return await analyzeSynastryByUserInfo({
      birth_date_a, birth_time_a, gender_a, city_a, name_a,
      birth_date_b, birth_time_b, gender_b, city_b, name_b,
      is_lunar_a, is_leap_a, is_lunar_b, is_leap_b,
      scope: 'decadal', // 支持大限合盘分析
      query_date
    });
  } catch (error) {
    console.error('合盘分析失败:', error);
    return {
      success: false,
      error: error.message,
      message: '合盘分析失败',
      time: new Date().toISOString()
    };
  }
}

export async function analyzeYearlySynastryByInfo({
  birth_date_a, birth_time_a, gender_a, city_a, name_a = "A",
  birth_date_b, birth_time_b, gender_b, city_b, name_b = "B",
  is_lunar_a = false, is_leap_a = false,
  is_lunar_b = false, is_leap_b = false,
  query_year
}) {
  try {
    const query_date = new Date(query_year, 2, 1);

    return await analyzeSynastryByUserInfo({
      birth_date_a, birth_time_a, gender_a, city_a, name_a,
      birth_date_b, birth_time_b, gender_b, city_b, name_b,
      is_lunar_a, is_leap_a, is_lunar_b, is_leap_b,
      scope: 'yearly', // 支持流年合盘分析
      query_date
    });
  } catch (error) {
    console.error('合盘分析失败:', error);
    return {
      success: false,
      error: error.message,
      message: '合盘分析失败',
      time: new Date().toISOString()
    };
  }
}

export async function analyzeMonthlySynastryByInfo({
  birth_date_a, birth_time_a, gender_a, city_a, name_a = "A",
  birth_date_b, birth_time_b, gender_b, city_b, name_b = "B",
  is_lunar_a = false, is_leap_a = false,
  is_lunar_b = false, is_leap_b = false,
  query_year, query_month
}) {
  try {
    const query_date = new Date(query_year, query_month - 1, 1);

    return await analyzeSynastryByUserInfo({
      birth_date_a, birth_time_a, gender_a, city_a, name_a,
      birth_date_b, birth_time_b, gender_b, city_b, name_b,
      is_lunar_a, is_leap_a, is_lunar_b, is_leap_b,
      scope: 'monthly', // 支持流月合盘分析
      query_date
    });
  } catch (error) {
    console.error('合盘分析失败:', error);
    return {
      success: false,
      error: error.message,
      message: '合盘分析失败',
      time: new Date().toISOString()
    };
  }
}

export async function analyzeDailySynastryByInfo({
  birth_date_a, birth_time_a, gender_a, city_a, name_a = "A",
  birth_date_b, birth_time_b, gender_b, city_b, name_b = "B",
  is_lunar_a = false, is_leap_a = false,
  is_lunar_b = false, is_leap_b = false,
  query_year, query_month, query_day
}) {
  try {
    const query_date = new Date(query_year, query_month - 1, query_day);

    return await analyzeSynastryByUserInfo({
      birth_date_a, birth_time_a, gender_a, city_a, name_a,
      birth_date_b, birth_time_b, gender_b, city_b, name_b,
      is_lunar_a, is_leap_a, is_lunar_b, is_leap_b,
      scope: 'daily', // 支持流日合盘分析
      query_date
    });
  } catch (error) {
    console.error('合盘分析失败:', error);
    return {
      success: false,
      error: error.message,
      message: '合盘分析失败',
      time: new Date().toISOString()
    };
  }
}
