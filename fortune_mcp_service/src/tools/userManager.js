import { saveUser, getUser, listUsers } from '../storage/userStorage.js';
import { generateAstrolabeSolar, generateAstrolabeLunar } from './astrolabe.js';

export async function saveUserAstrolabe(name, birthDate, birthTime, city, gender, isLunar = false) {
  try {
    let astrolabeData;
    
    if (isLunar) {
      astrolabeData = await generateAstrolabeLunar({
        lunar_date: birthDate,
        time: birthTime,
        city,
        gender
      });
    } else {
      astrolabeData = await generateAstrolabeSolar({
        solar_date: birthDate,
        time: birthTime,
        city,
        gender
      });
    }

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
      data: userData
    };
  } catch (error) {
    return {
      success: false,
      message: `保存失败: ${error.message}`,
      error: error.message
    };
  }
}

export async function getUserAstrolabe(name) {
  try {
    const userData = await getUser(name);
    
    if (!userData) {
      return {
        success: false,
        message: `未找到用户 ${name} 的星盘数据`
      };
    }

    return {
      success: true,
      message: `找到用户 ${name} 的星盘数据`,
      data: userData
    };
  } catch (error) {
    return {
      success: false,
      message: `查询失败: ${error.message}`,
      error: error.message
    };
  }
}

export async function listSavedUsers() {
  try {
    const usersList = await listUsers();
    
    return {
      success: true,
      message: `找到 ${usersList.length} 个已保存的用户`,
      data: usersList
    };
  } catch (error) {
    return {
      success: false,
      message: `查询失败: ${error.message}`,
      error: error.message
    };
  }
}