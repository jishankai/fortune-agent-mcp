import { generateAstrolabe, formatPalace, formatSurroundedPalaces, getAstrolabeBasicInfo } from '../utils/astrolabe_helper.js';
import { detectPatterns } from '../utils/patterns.js';

/**
 * 获取宫位基本信息
 * input：个人基本信息，要查询的宫位​
 * output：宫位的三方四正，以及四化的所有基本盘信息
 */
export async function getPalace({ birth_date, birth_time, gender, city, palace_name, is_lunar = false, is_leap = false }) {
  try {
    const astrolabe = await generateAstrolabe({
      birth_date,
      time: birth_time,
      gender,
      city,
      is_lunar,
      is_leap
    });
    
    const formattedPalace = formatPalace(astrolabe.palace(palace_name));
    const surroundedPalaces = astrolabe.surroundedPalaces(palace_name);
    const formattedSurroundedPalaces = formatSurroundedPalaces(surroundedPalaces);
    
    // Detect patterns in the base chart
    const patterns = detectPatterns(astrolabe);
    
    return {
      success: true,
      data: {
        "基本信息": getAstrolabeBasicInfo(astrolabe),
        "本命盘": {
          "目标宫位": formattedPalace,
          "三方四正": formattedSurroundedPalaces,
        },
        "紫微格局": patterns
      },
      message: `${palace_name}基本盘信息查询成功`,
      time: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('宫位基本信息查询失败:', error);
    return {
      success: false,
      error: error.message,
      message: '宫位基本信息查询失败',
      time: new Date().toISOString()
    };
  }
}
