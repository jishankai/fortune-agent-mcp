import { astro } from 'iztro';

export async function getHoroscope({ astrolabe_data, year, month }) {
  try {
    // 总是重新生成星盘，因为JSON序列化会丢失方法
    const { astro } = await import('iztro');
    
    if (!astrolabe_data || !astrolabe_data.basic_info) {
      throw new Error('无效的星盘数据');
    }
    
    const { solar_date, gender, time } = astrolabe_data.basic_info;
    
    if (!solar_date || !gender || !time) {
      throw new Error('星盘数据缺少必要信息');
    }

    // 计算时辰索引
    const [hour, minute] = time.split(':').map(Number);
    let timeIndex;
    if (hour >= 23 || hour < 1) timeIndex = 0;
    else if (hour >= 1 && hour < 3) timeIndex = 1;
    else if (hour >= 3 && hour < 5) timeIndex = 2;
    else if (hour >= 5 && hour < 7) timeIndex = 3;
    else if (hour >= 7 && hour < 9) timeIndex = 4;
    else if (hour >= 9 && hour < 11) timeIndex = 5;
    else if (hour >= 11 && hour < 13) timeIndex = 6;
    else if (hour >= 13 && hour < 15) timeIndex = 7;
    else if (hour >= 15 && hour < 17) timeIndex = 8;
    else if (hour >= 17 && hour < 19) timeIndex = 9;
    else if (hour >= 19 && hour < 21) timeIndex = 10;
    else if (hour >= 21 && hour < 23) timeIndex = 11;
    
    const originalAstrolabe = astro.bySolar(solar_date, timeIndex, gender, false, 'zh-CN');
    
    let horoscopeData = {
      year: year,
      month: month || null,
      analysis: {}
    };

    if (month) {
      horoscopeData.analysis = getMonthlyHoroscope(originalAstrolabe, year, month);
    } else {
      horoscopeData.analysis = getYearlyHoroscope(originalAstrolabe, year);
    }

    const decadalLuck = getDecadalLuck(originalAstrolabe, year);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: {
              ...horoscopeData,
              decadal_luck: decadalLuck,
              predictions: getPredictions(originalAstrolabe, year, month),
              advice: getAdvice(originalAstrolabe, year, month)
            },
            message: month ? `${year}年${month}月运势查询完成` : `${year}年运势查询完成`
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
            message: '运势查询失败'
          }, null, 2)
        }
      ],
      isError: true
    };
  }
}

function getYearlyHoroscope(astrolabe, year) {
  const birthYear = parseInt(astrolabe.solarDate.split('-')[0]);
  const age = year - birthYear;
  
  // 获取流年运势数据
  let horoscopeData;
  try {
    horoscopeData = astrolabe.horoscope(new Date(year, 0, 1));
  } catch (error) {
    throw new Error(`获取${year}年运势数据失败: ${error.message}`);
  }
  
  return {
    type: '流年运势',
    target_year: year,
    current_age: age,
    
    // 基于真实数据的大限信息
    decadal_info: {
      name: horoscopeData.decadal.name,
      heavenly_stem: horoscopeData.decadal.heavenlyStem,
      earthly_branch: horoscopeData.decadal.earthlyBranch,
      mutagens: horoscopeData.decadal.mutagen
    },
    
    // 流年信息
    yearly_info: {
      name: horoscopeData.yearly.name,
      heavenly_stem: horoscopeData.yearly.heavenlyStem,
      earthly_branch: horoscopeData.yearly.earthlyBranch,
      mutagens: horoscopeData.yearly.mutagen
    },
    
    // 小限信息
    age_info: {
      name: horoscopeData.age.name,
      nominal_age: horoscopeData.age.nominalAge,
      heavenly_stem: horoscopeData.age.heavenlyStem,
      earthly_branch: horoscopeData.age.earthlyBranch,
      mutagens: horoscopeData.age.mutagen
    },
    
    // 流月信息
    monthly_info: {
      name: horoscopeData.monthly.name,
      heavenly_stem: horoscopeData.monthly.heavenlyStem,
      earthly_branch: horoscopeData.monthly.earthlyBranch,
      mutagens: horoscopeData.monthly.mutagen
    },
    
    // 基本运势分析（基于四化分析）
    fortune_analysis: analyzeFortuneByMutagens(horoscopeData),
    
    // 年度重要星曜
    yearly_stars: analyzeYearlyStars(horoscopeData.yearly.stars),
    
    // 流年吉凶神煞
    yearly_spirits: horoscopeData.yearly.yearlyDecStar
  };
}

function getMonthlyHoroscope(astrolabe, year, month) {
  return {
    type: '流月运势',
    target_year: year,
    target_month: month,
    monthly_theme: getMonthlyTheme(astrolabe, year, month),
    lucky_days: getLuckyDays(astrolabe, year, month),
    caution_days: getCautionDays(astrolabe, year, month),
    career_focus: getCareerFocus(astrolabe, year, month),
    wealth_opportunity: getWealthOpportunity(astrolabe, year, month),
    relationship_focus: getRelationshipFocus(astrolabe, year, month),
    health_attention: getHealthAttention(astrolabe, year, month)
  };
}

function getDecadalLuck(astrolabe, year) {
  const birthYear = parseInt(astrolabe.solarDate.split('-')[0]);
  const age = year - birthYear;
  
  // 获取大运信息
  let horoscopeData;
  try {
    horoscopeData = astrolabe.horoscope(new Date(year, 0, 1));
  } catch (error) {
    throw new Error(`获取大运数据失败: ${error.message}`);
  }
  
  return {
    decadal_name: horoscopeData.decadal.name,
    heavenly_stem: horoscopeData.decadal.heavenlyStem,
    earthly_branch: horoscopeData.decadal.earthlyBranch,
    index: horoscopeData.decadal.index,
    mutagens: horoscopeData.decadal.mutagen,
    current_age: age
  };
}

// 基于四化分析运势
function analyzeFortuneByMutagens(horoscopeData) {
  const yearlyMutagens = horoscopeData.yearly.mutagen;
  const decadalMutagens = horoscopeData.decadal.mutagen;
  
  return {
    yearly_mutagens: {
      stars: yearlyMutagens,
      analysis: `流年四化：${yearlyMutagens.join('、')}`
    },
    decadal_mutagens: {
      stars: decadalMutagens,
      analysis: `大限四化：${decadalMutagens.join('、')}`
    },
    summary: '运势分析需结合具体宫位和星曜情况'
  };
}

// 分析流年星曜
function analyzeYearlyStars(yearlyStars) {
  const analysis = [];
  
  yearlyStars.forEach((palaceStars, index) => {
    if (palaceStars && palaceStars.length > 0) {
      const starNames = palaceStars.map(star => star.name).filter(name => name);
      if (starNames.length > 0) {
        analysis.push({
          palace_index: index,
          stars: starNames,
          count: starNames.length
        });
      }
    }
  });
  
  return analysis;
}

function getOverallFortune(astrolabe, yearlyAstrolabe, year) {
  // 基于流年星盘分析整体运势
  const score = analyzeOverallScore(astrolabe, yearlyAstrolabe);
  
  return {
    score: score,
    description: getOverallDescription(yearlyAstrolabe),
    key_strengths: getKeyStrengths(yearlyAstrolabe),
    potential_challenges: getPotentialChallenges(yearlyAstrolabe)
  };
}

function getCareerFortune(astrolabe, yearlyAstrolabe, year) {
  // 分析官禄宫的流年星曜
  const careerPalace = yearlyAstrolabe.palaces.find(p => p.name === '官禄');
  
  return {
    score: analyzeCareerScore(careerPalace),
    trend: analyzeCareerTrend(careerPalace),
    opportunities: getCareerOpportunities(careerPalace),
    challenges: getCareerChallenges(careerPalace),
    best_timing: getCareerTiming(careerPalace)
  };
}

function getWealthFortune(astrolabe, yearlyAstrolabe, year) {
  // 分析财帛宫的流年星曜
  const wealthPalace = yearlyAstrolabe.palaces.find(p => p.name === '财帛');
  
  return {
    score: analyzeWealthScore(wealthPalace),
    main_source: analyzeWealthSource(wealthPalace),
    investment_luck: analyzeInvestmentLuck(wealthPalace),
    spending_advice: getSpendingAdvice(wealthPalace),
    wealth_timing: getWealthTiming(wealthPalace)
  };
}

function getRelationshipFortune(astrolabe, yearlyAstrolabe, year) {
  // 分析夫妻宫的流年星曜
  const marriagePalace = yearlyAstrolabe.palaces.find(p => p.name === '夫妻');
  
  return {
    score: analyzeRelationshipScore(marriagePalace),
    single_luck: analyzeSingleLuck(marriagePalace),
    married_luck: analyzeMarriedLuck(marriagePalace),
    family_harmony: analyzeFamilyHarmony(marriagePalace),
    social_relationships: analyzeSocialRelationships(marriagePalace)
  };
}

function getHealthFortune(astrolabe, yearlyAstrolabe, year) {
  // 分析疾厄宫的流年星曜
  const healthPalace = yearlyAstrolabe.palaces.find(p => p.name === '疾厄');
  
  return {
    score: analyzeHealthScore(healthPalace),
    overall_condition: analyzeHealthCondition(healthPalace),
    attention_areas: getHealthAttentionAreas(healthPalace),
    exercise_advice: getExerciseAdvice(healthPalace),
    seasonal_care: getSeasonalCare(healthPalace)
  };
}

function getKeyEvents(astrolabe, year) {
  // 基于紫微斗数传统，提供参考性事件预测
  return [
    { month: 3, event: '工作或学业上有重要决定', impact: '正面' },
    { month: 6, event: '人际关系方面有新发展', impact: '正面' },
    { month: 9, event: '财务方面需要谨慎规划', impact: '中性' },
    { month: 11, event: '家庭或感情生活有变化', impact: '正面' }
  ];
}

function getFavorableMonths(astrolabe, year) {
  // 参考性的有利月份
  return [2, 5, 8, 10];
}

function getCautionMonths(astrolabe, year) {
  // 参考性的谨慎月份
  return [4, 7, 12];
}

function getMonthlyTheme(astrolabe, year, month) {
  const themes = {
    1: '新年新气象，制定计划',
    2: '人际交往活跃期',
    3: '事业发展关键期',
    4: '财务管理重要期',
    5: '学习成长黄金期',
    6: '感情生活丰富期',
    7: '健康养生关注期',
    8: '创意灵感涌现期',
    9: '收获成果验收期',
    10: '社交活动频繁期',
    11: '家庭团聚温馨期',
    12: '总结反思规划期'
  };
  
  return themes[month] || '平稳发展期';
}

function getLuckyDays(astrolabe, year, month) {
  return [3, 8, 13, 18, 23, 28];
}

function getCautionDays(astrolabe, year, month) {
  return [6, 11, 16, 21, 26];
}

function getCareerFocus(astrolabe, year, month) {
  return '本月适合推进既定项目，避免冒进，与同事保持良好沟通';
}

function getWealthOpportunity(astrolabe, year, month) {
  return '正财收入稳定，偏财需谨慎，适合小额理财';
}

function getRelationshipFocus(astrolabe, year, month) {
  return '感情运势平稳，单身者可多参加社交活动，已婚者注重家庭和谐';
}

function getHealthAttention(astrolabe, year, month) {
  return '注意作息规律，适度运动，保持心情愉悦';
}

function getDecadalPalace(astrolabe, age) {
  const decadalIndex = Math.floor(age / 10);
  const palaces = ['命宫', '父母', '福德', '田宅', '官禄', '奴仆', '迁移', '疾厄', '财帛', '子女', '夫妻', '兄弟'];
  return palaces[decadalIndex % 12];
}

function getDecadalInfluence(decadalLuck) {
  const palaceName = decadalLuck.palace?.name;
  
  const influences = {
    '命宫': '自我发展期，适合提升个人能力',
    '父母': '学习成长期，长辈助力明显',
    '福德': '精神丰富期，注重内在修养',
    '田宅': '家庭稳定期，适合置业安家',
    '官禄': '事业发展期，工作运势上升',
    '奴仆': '人际活跃期，朋友助力较多',
    '迁移': '变动发展期，适合外出发展',
    '疾厄': '健康关注期，需要养生保健',
    '财帛': '财运亨通期，理财投资有利',
    '子女': '创造活跃期，适合生育或创业',
    '夫妻': '感情重要期，婚姻感情为重',
    '兄弟': '合作发展期，团队协作有利'
  };
  
  return influences[palaceName] || '平稳发展期';
}

function getPredictions(astrolabe, year, month) {
  // 基于紫微斗数理论的一般性预测
  const predictions = [
    '运势变化需观察流年四化',
    '注意大限与流年的相互影响',
    '关注命宫及相关宫位的星曜变化'
  ];
  
  if (month) {
    predictions.push(`${month}月需要结合流月运势分析`);
  }
  
  return predictions;
}

function getAdvice(astrolabe, year, month) {
  const advice = {
    general: '遵循紫微斗数规律，顺应自然',
    timing: '择吉而行，避凶趋吉',
    cultivation: '修身养性，积德行善',
    observation: '观察星曜变化，调整策略'
  };
  
  if (month) {
    advice.monthly = `${month}月需要参考流月星曜配置`;
  }
  
  return advice;
}

// 删除编造的评分函数，运势分析应基于真实的紫微斗数理论

function getOverallDescription(yearlyAstrolabe) {
  const fateStars = yearlyAstrolabe.palaces.find(p => p.name === '命宫')?.stars || [];
  const hasGoodStars = fateStars.some(s => s.brightness === '庙' || s.brightness === '旺');
  
  if (hasGoodStars) {
    return '整体运势较好，有上升机会';
  } else {
    return '整体运势平稳，需稳中求进';
  }
}

function getKeyStrengths(yearlyAstrolabe) {
  return ['人际关系良好', '学习能力强', '适应能力佳'];
}

function getPotentialChallenges(yearlyAstrolabe) {
  return ['需注意健康管理', '投资需谨慎', '避免冒进'];
}

function analyzeCareerScore(careerPalace) {
  if (!careerPalace) return 70;
  
  let score = 70;
  careerPalace.stars?.forEach(star => {
    if (star.brightness === '庙' || star.brightness === '旺') {
      score += 5;
    }
  });
  
  return Math.min(90, Math.max(50, score));
}

function analyzeCareerTrend(careerPalace) {
  const hasGoodStars = careerPalace?.stars?.some(s => s.brightness === '庙' || s.brightness === '旺');
  return hasGoodStars ? '上升' : '平稳';
}

function getCareerOpportunities(careerPalace) {
  return ['项目合作机会', '职位晋升可能', '新技能学习机会'];
}

function getCareerChallenges(careerPalace) {
  return ['工作压力增大', '同事关系需维护', '竞争激烈'];
}

function getCareerTiming(careerPalace) {
  return '上半年较佳';
}

function analyzeWealthScore(wealthPalace) {
  if (!wealthPalace) return 70;
  
  let score = 70;
  wealthPalace.stars?.forEach(star => {
    if (star.name.includes('财') || star.name.includes('禄')) {
      score += 8;
    }
  });
  
  return Math.min(90, Math.max(50, score));
}

function analyzeWealthSource(wealthPalace) {
  return '正财为主';
}

function analyzeInvestmentLuck(wealthPalace) {
  const hasLuckyStars = wealthPalace?.stars?.some(s => s.brightness === '庙');
  return hasLuckyStars ? '较好' : '中等';
}

function getSpendingAdvice(wealthPalace) {
  return '适度消费，避免大额投资';
}

function getWealthTiming(wealthPalace) {
  return '第二、三季度较佳';
}

function analyzeRelationshipScore(marriagePalace) {
  if (!marriagePalace) return 70;
  
  let score = 70;
  marriagePalace.stars?.forEach(star => {
    if (star.brightness === '庙' || star.brightness === '旺') {
      score += 5;
    }
  });
  
  return Math.min(90, Math.max(50, score));
}

function analyzeSingleLuck(marriagePalace) {
  return '桃花运一般，下半年有机会';
}

function analyzeMarriedLuck(marriagePalace) {
  return '夫妻关系和谐，需要多沟通';
}

function analyzeFamilyHarmony(marriagePalace) {
  return '家庭关系温馨';
}

function analyzeSocialRelationships(marriagePalace) {
  return '朋友圈扩大，贵人运佳';
}

function analyzeHealthScore(healthPalace) {
  if (!healthPalace) return 75;
  
  let score = 75;
  const hasBadStars = healthPalace.stars?.some(s => s.brightness === '陷' || s.brightness === '落');
  if (hasBadStars) {
    score -= 10;
  }
  
  return Math.min(90, Math.max(50, score));
}

function analyzeHealthCondition(healthPalace) {
  const hasBadStars = healthPalace?.stars?.some(s => s.brightness === '陷');
  return hasBadStars ? '需要注意保养' : '健康状况良好';
}

function getHealthAttentionAreas(healthPalace) {
  return ['消化系统', '睡眠质量', '心理健康'];
}

function getExerciseAdvice(healthPalace) {
  return '适度运动，注意劳逸结合';
}

function getSeasonalCare(healthPalace) {
  return '春季养肝，夏季防暑，秋季润燥，冬季温补';
}