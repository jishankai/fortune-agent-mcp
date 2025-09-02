import { saveUser, getUser, listUsers } from '../storage/userStorage.js';
import { generateAstrolabe } from '../utils/astrolabe_helper.js';

export async function saveUserAstrolabe(name, birthDate, birthTime, city, gender, isLunar = false, is_leap = false) {
  try {
    let astrolabeData;
    
    astrolabeData = await generateAstrolabe({
      birth_date: birthDate,
      time: birthTime,
      city,
      gender,
      is_lunar: isLunar,
      is_leap: is_leap
    });

    const userData = {
      name,
      birthDate,
      birthTime,
      city,
      gender,
      isLunar,
      astrolabeData
    };

    await saveUser(name, userData);
    
    return {
      success: true,
      message: `用户 ${name} 的星盘已保存`,
      data: userData,
      time: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      message: `保存失败: ${error.message}`,
      error: error.message,
      time: new Date().toISOString()
    };
  }
}

export async function getUserAstrolabe(name) {
  try {
    const userData = await getUser(name);
    
    if (!userData) {
      return {
        success: false,
        message: `未找到用户 ${name} 的星盘数据`,
        time: new Date().toISOString()
      };
    }

    return {
      success: true,
      message: `找到用户 ${name} 的星盘数据`,
      data: userData,
      time: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      message: `查询失败: ${error.message}`,
      error: error.message,
      time: new Date().toISOString()
    };
  }
}

export async function listSavedUsers() {
  try {
    const usersList = await listUsers();
    
    return {
      success: true,
      message: `找到 ${usersList.length} 个已保存的用户`,
      data: usersList,
      time: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      message: `查询失败: ${error.message}`,
      error: error.message,
      time: new Date().toISOString()
    };
  }
}
