export async function generateAstrolabeSolar({ solar_date, time, gender, is_leap = false }) {
  try {
    const { astro } = await import('iztro');
    const [hour, minute] = time.split(':').map(Number);
    
    // 计算时辰索引 (0-11对应子-亥时)
    let timeIndex;
    if (hour >= 23 || hour < 1) timeIndex = 0;      // 子时
    else if (hour >= 1 && hour < 3) timeIndex = 1;  // 丑时
    else if (hour >= 3 && hour < 5) timeIndex = 2;  // 寅时
    else if (hour >= 5 && hour < 7) timeIndex = 3;  // 卯时
    else if (hour >= 7 && hour < 9) timeIndex = 4;  // 辰时
    else if (hour >= 9 && hour < 11) timeIndex = 5; // 巳时
    else if (hour >= 11 && hour < 13) timeIndex = 6; // 午时
    else if (hour >= 13 && hour < 15) timeIndex = 7; // 未时
    else if (hour >= 15 && hour < 17) timeIndex = 8; // 申时
    else if (hour >= 17 && hour < 19) timeIndex = 9; // 酉时
    else if (hour >= 19 && hour < 21) timeIndex = 10; // 戌时
    else if (hour >= 21 && hour < 23) timeIndex = 11; // 亥时
    
    // 使用正确的iztro API调用格式
    const astrolabe = astro.bySolar(solar_date, timeIndex, gender, is_leap, 'zh-CN');
    
    // 构建宫位数据
    const palace_data = astrolabe.palaces.map(palace => {
      const allStars = [
        ...palace.majorStars,
        ...palace.minorStars,
        ...palace.adjectiveStars
      ];
      
      return {
        name: palace.name,
        stars: allStars.map(star => ({
          name: star.name,
          type: star.type,
          scope: star.scope,
          brightness: star.brightness,
          mutagen: star.mutagen || ''
        })),
        earthly_branch: palace.earthlyBranch,
        heavenly_stem: palace.heavenlyStem,
        is_body_palace: palace.isBodyPalace,
        is_original_palace: palace.isOriginalPalace
      };
    });
    
    // 构建星曜位置数据
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
          brightness: star.brightness,
          type: star.type,
          mutagen: star.mutagen || ''
        };
      });
    });
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: {
              basic_info: {
                solar_date: astrolabe.solarDate,
                lunar_date: astrolabe.lunarDate,
                time: astrolabe.time,
                gender: gender,
                zodiac: astrolabe.zodiac,
                five_elements: astrolabe.fiveElementsClass
              },
              palace_data: palace_data,
              star_locations: star_locations,
              astrolabe: astrolabe // 保留完整的星盘对象供其他功能使用
            },
            message: '阳历星盘生成成功'
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error.message,
            message: '阳历星盘生成失败'
          }, null, 2)
        }
      ],
      isError: true
    };
  }
}

export async function generateAstrolabeLunar({ lunar_date, time, gender, is_leap = false }) {
  try {
    const { astro } = await import('iztro');
    const [hour, minute] = time.split(':').map(Number);
    
    // 计算时辰索引 (0-11对应子-亥时)
    let timeIndex;
    if (hour >= 23 || hour < 1) timeIndex = 0;      // 子时
    else if (hour >= 1 && hour < 3) timeIndex = 1;  // 丑时
    else if (hour >= 3 && hour < 5) timeIndex = 2;  // 寅时
    else if (hour >= 5 && hour < 7) timeIndex = 3;  // 卯时
    else if (hour >= 7 && hour < 9) timeIndex = 4;  // 辰时
    else if (hour >= 9 && hour < 11) timeIndex = 5; // 巳时
    else if (hour >= 11 && hour < 13) timeIndex = 6; // 午时
    else if (hour >= 13 && hour < 15) timeIndex = 7; // 未时
    else if (hour >= 15 && hour < 17) timeIndex = 8; // 申时
    else if (hour >= 17 && hour < 19) timeIndex = 9; // 酉时
    else if (hour >= 19 && hour < 21) timeIndex = 10; // 戌时
    else if (hour >= 21 && hour < 23) timeIndex = 11; // 亥时
    
    // 使用正确的iztro API调用格式
    const astrolabe = astro.byLunar(lunar_date, timeIndex, gender, is_leap, true, 'zh-CN');
    
    // 构建宫位数据
    const palace_data = astrolabe.palaces.map(palace => {
      const allStars = [
        ...palace.majorStars,
        ...palace.minorStars,
        ...palace.adjectiveStars
      ];
      
      return {
        name: palace.name,
        stars: allStars.map(star => ({
          name: star.name,
          type: star.type,
          scope: star.scope,
          brightness: star.brightness,
          mutagen: star.mutagen || ''
        })),
        earthly_branch: palace.earthlyBranch,
        heavenly_stem: palace.heavenlyStem,
        is_body_palace: palace.isBodyPalace,
        is_original_palace: palace.isOriginalPalace
      };
    });
    
    // 构建星曜位置数据
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
          brightness: star.brightness,
          type: star.type,
          mutagen: star.mutagen || ''
        };
      });
    });
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: {
              basic_info: {
                solar_date: astrolabe.solarDate,
                lunar_date: astrolabe.lunarDate,
                time: astrolabe.time,
                gender: gender,
                zodiac: astrolabe.zodiac,
                five_elements: astrolabe.fiveElementsClass
              },
              palace_data: palace_data,
              star_locations: star_locations,
              astrolabe: astrolabe // 保留完整的星盘对象供其他功能使用
            },
            message: '阴历星盘生成成功'
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error.message,
            message: '阴历星盘生成失败'
          }, null, 2)
        }
      ],
      isError: true
    };
  }
}