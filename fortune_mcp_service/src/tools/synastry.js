import { analyzeSynastryByUserInfo } from '../utils/synastry_analyzer.js';
import { getUserAstrolabe } from './user.js';

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

/**
 * 通过已保存用户进行合盘分析
 */
export async function analyzeSynastryBySavedUsers({ 
  user_name_a, 
  user_name_b,
}) {
  try {
    console.log(`合盘分析：${user_name_a} × ${user_name_b}`);
    
    // 获取保存的用户数据
    const userAResult = await getUserAstrolabe(user_name_a);
    if (!userAResult.success) {
      return {
        success: false,
        error: `获取用户${user_name_a}数据失败: ${userAResult.message}`,
        message: '合盘分析失败',
        time: new Date().toISOString()
      };
    }
    
    const userBResult = await getUserAstrolabe(user_name_b);
    if (!userBResult.success) {
      return {
        success: false,
        error: `获取用户${user_name_b}数据失败: ${userBResult.message}`,
        message: '合盘分析失败',
        time: new Date().toISOString()
      };
    }
    
    const userA = userAResult.data;
    const userB = userBResult.data;
    
    // 使用保存的数据进行合盘分析
    return await analyzeSynastryByUserInfo({ 
      birth_date_a: userA.birthDate,
      birth_time_a: userA.birthTime,
      gender_a: userA.gender,
      city_a: userA.city,
      name_a: userA.name,
      is_lunar_a: userA.isLunar || false,
      is_leap_a: userA.is_leap || false,
      
      birth_date_b: userB.birthDate,
      birth_time_b: userB.birthTime,
      gender_b: userB.gender,
      city_b: userB.city,
      name_b: userB.name,
      is_lunar_b: userB.isLunar || false,
      is_leap_b: userB.is_leap || false,
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
