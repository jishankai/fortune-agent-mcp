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
