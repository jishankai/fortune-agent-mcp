export function validateDate(dateString) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }
  
  const [year, month, day] = dateString.split('-').map(Number);
  
  if (year < 1900 || year > 2100) {
    return false;
  }
  
  if (month < 1 || month > 12) {
    return false;
  }
  
  if (day < 1 || day > 31) {
    return false;
  }
  
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && 
         date.getMonth() === month - 1 && 
         date.getDate() === day;
}

export function validateTime(timeString) {
  const timeRegex = /^\d{1,2}:\d{2}$/;
  if (!timeRegex.test(timeString)) {
    return false;
  }
  
  const [hour, minute] = timeString.split(':').map(Number);
  
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

export function validateGender(gender) {
  return gender === '男' || gender === '女';
}

export function formatAstrolabeData(astrolabe) {
  return {
    basic_info: {
      solar_date: astrolabe.solarDate,
      lunar_date: astrolabe.lunarDate,
      time: astrolabe.time,
      gender: astrolabe.gender,
      animal: astrolabe.animal,
      zodiac: astrolabe.zodiac,
      five_elements: astrolabe.fiveElementsClass
    },
    palace_data: astrolabe.palaces.map(palace => ({
      name: palace.name,
      stars: palace.stars.map(star => ({
        name: star.name,
        type: star.type,
        scope: star.scope,
        brightness: star.brightness
      })),
      earthly_branch: palace.earthlyBranch,
      decadal_palace: palace.decadal?.name || null,
      yearly_palace: palace.yearly?.name || null
    })),
    star_locations: Object.fromEntries(
      Object.entries(astrolabe.stars).map(([key, star]) => [
        key, 
        {
          name: star.name,
          palace: star.palace,
          brightness: star.brightness,
          type: star.type
        }
      ])
    )
  };
}

export function createSuccessResponse(data, message) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          success: true,
          data: data,
          message: message
        }, null, 2)
      }
    ]
  };
}

export function createErrorResponse(error, message) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          success: false,
          error: error,
          message: message
        }, null, 2)
      }
    ],
    isError: true
  };
}

export function getChineseZodiac(year) {
  const animals = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
  return animals[(year - 1900) % 12];
}

export function getFiveElements(year) {
  const elements = ['金', '水', '木', '火', '土'];
  const elementIndex = Math.floor(((year - 1900) % 10) / 2);
  return elements[elementIndex];
}

export function getEarthlyBranch(hour) {
  const branches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  let timeIndex;
  
  if (hour >= 23 || hour < 1) timeIndex = 0; // 子时 23-1点
  else if (hour >= 1 && hour < 3) timeIndex = 1; // 丑时 1-3点
  else if (hour >= 3 && hour < 5) timeIndex = 2; // 寅时 3-5点
  else if (hour >= 5 && hour < 7) timeIndex = 3; // 卯时 5-7点
  else if (hour >= 7 && hour < 9) timeIndex = 4; // 辰时 7-9点
  else if (hour >= 9 && hour < 11) timeIndex = 5; // 巳时 9-11点
  else if (hour >= 11 && hour < 13) timeIndex = 6; // 午时 11-13点
  else if (hour >= 13 && hour < 15) timeIndex = 7; // 未时 13-15点
  else if (hour >= 15 && hour < 17) timeIndex = 8; // 申时 15-17点
  else if (hour >= 17 && hour < 19) timeIndex = 9; // 酉时 17-19点
  else if (hour >= 19 && hour < 21) timeIndex = 10; // 戌时 19-21点
  else timeIndex = 11; // 亥时 21-23点
  
  return branches[timeIndex];
}

export function validatePalaceName(palaceName) {
  const validPalaces = [
    '命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄',
    '迁移', '奴仆', '官禄', '田宅', '福德', '父母'
  ];
  return validPalaces.includes(palaceName);
}

export function validateStarName(starName) {
  const mainStars = [
    '紫微', '天机', '太阳', '武曲', '天同', '廉贞',
    '天府', '太阴', '贪狼', '巨门', '天相', '天梁',
    '七杀', '破军'
  ];
  
  const luckyStars = [
    '文昌', '文曲', '左辅', '右弼', '天魁', '天钺',
    '禄存', '天马', '化禄', '化权', '化科', '化忌'
  ];
  
  const unluckyStars = [
    '羊刃', '陀罗', '火星', '铃星', '天空', '地劫',
    '天刑', '天姚', '解神', '阴煞', '天哭', '天虚'
  ];
  
  return mainStars.includes(starName) || 
         luckyStars.includes(starName) || 
         unluckyStars.includes(starName);
}

export function formatDate(dateString) {
  const [year, month, day] = dateString.split('-');
  return `${year}年${parseInt(month)}月${parseInt(day)}日`;
}

export function formatTime(timeString) {
  const [hour, minute] = timeString.split(':');
  return `${parseInt(hour)}时${parseInt(minute)}分`;
}

export function getAge(birthDate, targetYear) {
  const [birthYear] = birthDate.split('-').map(Number);
  return targetYear - birthYear;
}

export function getDecadalAge(age) {
  return Math.floor(age / 10) * 10;
}

export function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

export function getDaysInMonth(year, month) {
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month === 2 && isLeapYear(year)) {
    return 29;
  }
  return daysInMonth[month - 1];
}