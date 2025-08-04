import { astro } from 'iztro';

export async function getHoroscope({ astrolabe_data, year, month, day, query_type = 'yearly' }) {
  try {
    // 检查传入的星盘数据
    if (!astrolabe_data || !astrolabe_data.basic_info) {
      throw new Error('无效的星盘数据：缺少基本信息');
    }
    
    const { solar_date, gender, time } = astrolabe_data.basic_info;
    
    if (!solar_date || !gender || !time) {
      throw new Error('星盘数据缺少必要信息：solar_date, gender, time');
    }

    // 从传入的数据中提取时间信息
    let timeIndex;
    const timeStr = time;
    
    // 如果时间是中文时辰格式，转换为索引
    if (timeStr.includes('时')) {
      const timeMap = {
        '子时': 0, '丑时': 1, '寅时': 2, '卯时': 3,
        '辰时': 4, '巳时': 5, '午时': 6, '未时': 7,
        '申时': 8, '酉时': 9, '戌时': 10, '亥时': 11
      };
      timeIndex = timeMap[timeStr] ?? 0;
    } else {
      // 如果是HH:mm格式，计算时辰索引
      const [hour, minute] = timeStr.split(':').map(Number);
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
    }
    
    // 重新生成星盘对象（因为JSON序列化会丢失方法）
    const originalAstrolabe = astro.bySolar(solar_date, timeIndex, gender, false, 'zh-CN');
    
    // 根据查询类型确定查询日期
    let queryDate;
    if (query_type === 'daily' && day) {
      queryDate = new Date(year, month ? month - 1 : 0, day);
    } else if (month) {
      queryDate = new Date(year, month - 1, 1);
    } else {
      queryDate = new Date(year, 0, 1);
    }
    
    // 获取运势数据
    const horoscopeData = originalAstrolabe.horoscope(queryDate);
    
    if (!horoscopeData) {
      throw new Error('无法获取运势数据，请检查年份是否正确');
    }
    
    
    let analysisData = {};
    
    // 根据查询类型构建分析数据
    if (query_type === 'daily') {
      // 流日运势
      analysisData = {
        type: '流日运势',
        target_year: year,
        target_month: month || null,
        target_day: day || null,
        current_age: horoscopeData.age?.nominalAge || null,
        
        // 流日信息
        daily_info: {
          date: `${year}-${String(month || 1).padStart(2, '0')}-${String(day || 1).padStart(2, '0')}`,
          heavenly_stem: horoscopeData.daily?.heavenlyStem || '',
          earthly_branch: horoscopeData.daily?.earthlyBranch || '',
          mutagens: horoscopeData.daily?.mutagen || []
        },
        
        // 背景信息
        monthly_info: {
          name: horoscopeData.monthly?.name || '',
          heavenly_stem: horoscopeData.monthly?.heavenlyStem || '',
          earthly_branch: horoscopeData.monthly?.earthlyBranch || '',
          mutagens: horoscopeData.monthly?.mutagen || []
        },
        
        yearly_info: {
          name: horoscopeData.yearly?.name || '',
          heavenly_stem: horoscopeData.yearly?.heavenlyStem || '',
          earthly_branch: horoscopeData.yearly?.earthlyBranch || '',
          mutagens: horoscopeData.yearly?.mutagen || []
        },
        
        decadal_info: {
          name: horoscopeData.decadal?.name || '',
          heavenly_stem: horoscopeData.decadal?.heavenlyStem || '',
          earthly_branch: horoscopeData.decadal?.earthlyBranch || '',
          mutagens: horoscopeData.decadal?.mutagen || [],
          range: horoscopeData.decadal?.range || []
        }
      };
    } else if (query_type === 'decadal') {
      // 大限运势
      analysisData = {
        type: '大限运势',
        target_year: year,
        current_age: horoscopeData.age?.nominalAge || null,
        
        // 大限信息（主要分析对象）
        decadal_info: {
          name: horoscopeData.decadal?.name || '',
          heavenly_stem: horoscopeData.decadal?.heavenlyStem || '',
          earthly_branch: horoscopeData.decadal?.earthlyBranch || '',
          mutagens: horoscopeData.decadal?.mutagen || [],
          index: horoscopeData.decadal?.index || 0,
          range: horoscopeData.decadal?.range || [],
          // 大限期间整体特征
          palace_characteristics: analyzeDecadalPalace(horoscopeData.decadal, astrolabe_data)
        },
        
        // 当前流年作为参考
        yearly_info: {
          name: horoscopeData.yearly?.name || '',
          heavenly_stem: horoscopeData.yearly?.heavenlyStem || '',
          earthly_branch: horoscopeData.yearly?.earthlyBranch || '',
          mutagens: horoscopeData.yearly?.mutagen || []
        }
      };
    } else if (query_type === 'age_limit') {
      // 小限运势
      analysisData = {
        type: '小限运势',
        target_year: year,
        current_age: horoscopeData.age?.nominalAge || null,
        
        // 小限信息（主要分析对象）
        age_info: {
          name: horoscopeData.age?.name || '',
          nominal_age: horoscopeData.age?.nominalAge || null,
          heavenly_stem: horoscopeData.age?.heavenlyStem || '',
          earthly_branch: horoscopeData.age?.earthlyBranch || '',
          mutagens: horoscopeData.age?.mutagen || [],
          // 小限宫位特征
          palace_characteristics: analyzeAgeLimitPalace(horoscopeData.age, astrolabe_data)
        },
        
        // 背景信息
        decadal_info: {
          name: horoscopeData.decadal?.name || '',
          heavenly_stem: horoscopeData.decadal?.heavenlyStem || '',
          earthly_branch: horoscopeData.decadal?.earthlyBranch || '',
          mutagens: horoscopeData.decadal?.mutagen || [],
          range: horoscopeData.decadal?.range || []
        },
        
        yearly_info: {
          name: horoscopeData.yearly?.name || '',
          heavenly_stem: horoscopeData.yearly?.heavenlyStem || '',
          earthly_branch: horoscopeData.yearly?.earthlyBranch || '',
          mutagens: horoscopeData.yearly?.mutagen || []
        }
      };
    } else if (month) {
      // 流月运势
      analysisData = {
        type: '流月运势',
        target_year: year,
        target_month: month,
        current_age: horoscopeData.age?.nominalAge || null,
        
        // 流月信息
        monthly_info: {
          name: horoscopeData.monthly?.name || '',
          heavenly_stem: horoscopeData.monthly?.heavenlyStem || '',
          earthly_branch: horoscopeData.monthly?.earthlyBranch || '',
          mutagens: horoscopeData.monthly?.mutagen || []
        },
        
        // 大限信息（背景）
        decadal_info: {
          name: horoscopeData.decadal?.name || '',
          heavenly_stem: horoscopeData.decadal?.heavenlyStem || '',
          earthly_branch: horoscopeData.decadal?.earthlyBranch || '',
          mutagens: horoscopeData.decadal?.mutagen || [],
          range: horoscopeData.decadal?.range || []
        },
        
        // 流年信息（背景）
        yearly_info: {
          name: horoscopeData.yearly?.name || '',
          heavenly_stem: horoscopeData.yearly?.heavenlyStem || '',
          earthly_branch: horoscopeData.yearly?.earthlyBranch || '',
          mutagens: horoscopeData.yearly?.mutagen || []
        }
      };
    } else {
      // 流年运势
      analysisData = {
        type: '流年运势',
        target_year: year,
        current_age: horoscopeData.age?.nominalAge || null,
        
        // 大限信息
        decadal_info: {
          name: horoscopeData.decadal?.name || '',
          heavenly_stem: horoscopeData.decadal?.heavenlyStem || '',
          earthly_branch: horoscopeData.decadal?.earthlyBranch || '',
          mutagens: horoscopeData.decadal?.mutagen || [],
          index: horoscopeData.decadal?.index || 0,
          range: horoscopeData.decadal?.range || []
        },
        
        // 流年信息
        yearly_info: {
          name: horoscopeData.yearly?.name || '',
          heavenly_stem: horoscopeData.yearly?.heavenlyStem || '',
          earthly_branch: horoscopeData.yearly?.earthlyBranch || '',
          mutagens: horoscopeData.yearly?.mutagen || [],
          yearly_spirits: horoscopeData.yearly?.yearlyDecStar || []
        },
        
        // 小限信息
        age_info: {
          name: horoscopeData.age?.name || '',
          nominal_age: horoscopeData.age?.nominalAge || null,
          heavenly_stem: horoscopeData.age?.heavenlyStem || '',
          earthly_branch: horoscopeData.age?.earthlyBranch || '',
          mutagens: horoscopeData.age?.mutagen || []
        }
      };
    }
    
    // 添加四化飞星分析
    analysisData.mutagen_analysis = analyzeMutagenEffects(analysisData, originalAstrolabe);
    
    // 添加运势吉凶分析
    analysisData.fortune_analysis = analyzeFortuneLevel(analysisData);
    
    // 添加宫位飞星分析
    analysisData.palace_effects = analyzePalaceEffects(analysisData, astrolabe_data);
    
    // 添加具体事项预测
    analysisData.specific_predictions = generateSpecificPredictions(analysisData, astrolabe_data);
    
    // 添加宫位信息供参考
    analysisData.palace_summary = {
      life_palace: astrolabe_data.star_locations ? 
        Object.entries(astrolabe_data.star_locations)
          .filter(([_, star]) => star.palace === '命宫')
          .map(([name, star]) => ({ name, brightness: star.brightness, type: star.type })) : [],
      wealth_palace: astrolabe_data.star_locations ? 
        Object.entries(astrolabe_data.star_locations)
          .filter(([_, star]) => star.palace === '财帛')
          .map(([name, star]) => ({ name, brightness: star.brightness, type: star.type })) : [],
      career_palace: astrolabe_data.star_locations ? 
        Object.entries(astrolabe_data.star_locations)
          .filter(([_, star]) => star.palace === '官禄')
          .map(([name, star]) => ({ name, brightness: star.brightness, type: star.type })) : []
    };
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: {
              basic_info: astrolabe_data.basic_info,
              year: year,
              month: month || null,
              analysis: analysisData,
              interpretation: {
                summary: getSummaryText(query_type, year, month, day, analysisData),
                key_points: getKeyPoints(query_type, analysisData),
                advice: generateHoroscopeAdvice(analysisData)
              },
              note: '此数据为基础运势信息，详细解读需要结合传统紫微斗数理论和个人命盘特点'
            },
            message: getCompletionMessage(query_type, year, month, day)
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

// 分析四化飞星效应
function analyzeMutagenEffects(analysisData, astrolabe) {
  const analysis = {
    decadal_mutagens: [],
    yearly_mutagens: [],
    monthly_mutagens: [],
    mutagen_interactions: [],
    key_influences: []
  };
  
  try {
    // 大限四化分析
    if (analysisData.decadal_info && analysisData.decadal_info.mutagens) {
      analysisData.decadal_info.mutagens.forEach(star => {
        const effect = getMutagenDetailedEffect(star, '大限');
        if (effect) {
          analysis.decadal_mutagens.push(effect);
        }
      });
    }
    
    // 流年四化分析
    if (analysisData.yearly_info && analysisData.yearly_info.mutagens) {
      analysisData.yearly_info.mutagens.forEach(star => {
        const effect = getMutagenDetailedEffect(star, '流年');
        if (effect) {
          analysis.yearly_mutagens.push(effect);
        }
      });
    }
    
    // 流月四化分析（如果有）
    if (analysisData.monthly_info && analysisData.monthly_info.mutagens) {
      analysisData.monthly_info.mutagens.forEach(star => {
        const effect = getMutagenDetailedEffect(star, '流月');
        if (effect) {
          analysis.monthly_mutagens.push(effect);
        }
      });
    }
    
    // 分析四化之间的相互作用
    analysis.mutagen_interactions = analyzeMutagenInteractions(analysis);
    
    // 总结关键影响
    analysis.key_influences = summarizeKeyInfluences(analysis);
    
  } catch (error) {
    analysis.error = '四化分析过程中出现错误: ' + error.message;
  }
  
  return analysis;
}

// 获取四化详细效应
function getMutagenDetailedEffect(starName, timeRange) {
  const mutagenEffects = {
    '禄': {
      '紫微': `${timeRange}紫微化禄：地位提升，贵人助力，财运亨通`,
      '天机': `${timeRange}天机化禄：智慧变现，策划得利，学业有成`,
      '太阳': `${timeRange}太阳化禄：名声大显，正财运佳，男性贵人多`,
      '武曲': `${timeRange}武曲化禄：财运大旺，投资得利，事业发展`,
      '天同': `${timeRange}天同化禄：福气增加，生活愉快，人缘极佳`,
      '廉贞': `${timeRange}廉贞化禄：桃花运旺，感情得意，异性缘佳`,
      '天府': `${timeRange}天府化禄：财库充实，积累丰厚，稳定发展`,
      '太阴': `${timeRange}太阴化禄：女性贵人，财运稳健，家庭和谐`,
      '贪狼': `${timeRange}贪狼化禄：偏财运佳，娱乐得利，多才多艺`,
      '巨门': `${timeRange}巨门化禄：口才生财，传媒得利，是非化解`,
      '天相': `${timeRange}天相化禄：贵人相助，合作得利，印绶有成`,
      '天梁': `${timeRange}天梁化禄：长者提携，医药得利，威望提升`,
      '七杀': `${timeRange}七杀化禄：权威得财，竞争得胜，开拓有成`,
      '破军': `${timeRange}破军化禄：破旧立新，变革得利，开创成功`
    },
    '权': {
      '紫微': `${timeRange}紫微化权：权势巩固，领导有方，威权显赫`,
      '天机': `${timeRange}天机化权：决策英明，管理有术，智权并用`,
      '太阳': `${timeRange}太阳化权：权威显赫，管理有方，男性当权`,
      '武曲': `${timeRange}武曲化权：财权并重，决断有力，执行力强`,
      '天同': `${timeRange}天同化权：和谐管理，平衡有术，福权并具`,
      '廉贞': `${timeRange}廉贞化权：纪检有权，正义执行，美权并存`,
      '天府': `${timeRange}天府化权：财政大权，库藏丰富，管理稳健`,
      '太阴': `${timeRange}太阴化权：阴柔得权，女性当权，内政有权`,
      '贪狼': `${timeRange}贪狼化权：魅力当权，多元发展，才艺显权`,
      '巨门': `${timeRange}巨门化权：口才得权，传媒当权，是非有理`,
      '天相': `${timeRange}天相化权：辅助得权，协调有术，印权并重`,
      '天梁': `${timeRange}天梁化权：德高望重，长者当权，慈权并具`,
      '七杀': `${timeRange}七杀化权：武权显赫，竞争得胜，开拓有权`,
      '破军': `${timeRange}破军化权：变革有权，创新当权，破立并举`
    },
    '科': {
      '紫微': `${timeRange}紫微化科：名声显赫，学位有成，贵气文雅`,
      '天机': `${timeRange}天机化科：智慧闻名，学问精进，策划有名`,
      '太阳': `${timeRange}太阳化科：名气大显，文章有成，正名得利`,
      '武曲': `${timeRange}武曲化科：财技精明，理财有名，专业权威`,
      '天同': `${timeRange}天同化科：文雅有名，才艺显露，和谐文明`,
      '廉贞': `${timeRange}廉贞化科：美名远播，文艺有成，正义有声`,
      '天府': `${timeRange}天府化科：财政专家，管理有名，稳健闻名`,
      '太阴': `${timeRange}太阴化科：文柔有名，学问精深，阴德有报`,
      '贪狼': `${timeRange}贪狼化科：才艺闻名，多元发展，技能精进`,
      '巨门': `${timeRange}巨门化科：口才有名，学问深邃，研究精进`,
      '天相': `${timeRange}天相化科：协调有名，服务精神，印绶文明`,
      '天梁': `${timeRange}天梁化科：德高望重，医理精明，长者有名`,
      '七杀': `${timeRange}七杀化科：武艺精进，竞技有名，技能专精`,
      '破军': `${timeRange}破军化科：创新有名，变革精神，开拓专业`
    },
    '忌': {
      '紫微': `${timeRange}紫微化忌：地位不稳，权威受损，尊严受挫`,
      '天机': `${timeRange}天机化忌：思虑过度，决策错误，机关算尽`,
      '太阳': `${timeRange}太阳化忌：名声受损，男性不利，心血管注意`,
      '武曲': `${timeRange}武曲化忌：财运受阻，投资失利，呼吸系统注意`,
      '天同': `${timeRange}天同化忌：福气减少，享受受限，消化系统注意`,
      '廉贞': `${timeRange}廉贞化忌：感情波折，桃花劫难，心脏血液注意`,
      '天府': `${timeRange}天府化忌：财库受损，积蓄流失，脾胃系统注意`,
      '太阴': `${timeRange}太阴化忌：女性不利，家庭不和，肾脏妇科注意`,
      '贪狼': `${timeRange}贪狼化忌：欲望过度，桃花是非，肝胆系统注意`,
      '巨门': `${timeRange}巨门化忌：口舌是非，暗疾缠身，肺部呼吸注意`,
      '天相': `${timeRange}天相化忌：合作不利，印绶受损，皮肤过敏注意`,
      '天梁': `${timeRange}天梁化忌：长者不利，医药无效，骨骼关节注意`,
      '七杀': `${timeRange}七杀化忌：竞争失利，意外损伤，外伤意外注意`,
      '破军': `${timeRange}破军化忌：变革受阻，破坏无建，意外破财注意`
    }
  };
  
  // 尝试解析星曜名称和四化类型
  for (const [mutagen, stars] of Object.entries(mutagenEffects)) {
    if (stars[starName]) {
      return {
        star: starName,
        mutagen: mutagen,
        effect: stars[starName],
        level: getMutagenLevel(mutagen)
      };
    }
  }
  
  return {
    star: starName,
    mutagen: '未知',
    effect: `${timeRange}${starName}的具体四化效应需要进一步分析`,
    level: 'neutral'
  };
}

// 获取四化等级
function getMutagenLevel(mutagen) {
  const levels = {
    '禄': 'very_positive',
    '权': 'positive', 
    '科': 'positive',
    '忌': 'negative'
  };
  return levels[mutagen] || 'neutral';
}

// 分析四化相互作用
function analyzeMutagenInteractions(analysis) {
  const interactions = [];
  
  // 收集所有四化
  const allMutagens = [
    ...analysis.decadal_mutagens,
    ...analysis.yearly_mutagens,
    ...analysis.monthly_mutagens
  ];
  
  // 检查禄权科忌的配合
  const mutagenTypes = allMutagens.reduce((acc, m) => {
    acc[m.mutagen] = (acc[m.mutagen] || 0) + 1;
    return acc;
  }, {});
  
  if (mutagenTypes['禄'] && mutagenTypes['权']) {
    interactions.push({
      type: '禄权并见',
      effect: '财权并重，事业发展顺利，地位财富双收',
      level: 'very_positive'
    });
  }
  
  if (mutagenTypes['禄'] && mutagenTypes['科']) {
    interactions.push({
      type: '禄科并见', 
      effect: '名利双收，学问与财富并进，声誉卓著',
      level: 'very_positive'
    });
  }
  
  if (mutagenTypes['权'] && mutagenTypes['科']) {
    interactions.push({
      type: '权科并见',
      effect: '权威与声望并重，专业地位显著',
      level: 'positive'
    });
  }
  
  if (mutagenTypes['忌'] >= 2) {
    interactions.push({
      type: '双忌冲击',
      effect: '阻碍较多，需要特别谨慎，避免冲动决策',
      level: 'negative'
    });
  }
  
  return interactions;
}

// 总结关键影响
function summarizeKeyInfluences(analysis) {
  const influences = [];
  
  // 统计正面和负面影响
  const allEffects = [
    ...analysis.decadal_mutagens,
    ...analysis.yearly_mutagens, 
    ...analysis.monthly_mutagens
  ];
  
  const positiveCount = allEffects.filter(e => 
    e.level === 'positive' || e.level === 'very_positive'
  ).length;
  
  const negativeCount = allEffects.filter(e => 
    e.level === 'negative'
  ).length;
  
  if (positiveCount > negativeCount) {
    influences.push('整体运势偏向吉利，多有贵人助力');
  } else if (negativeCount > positiveCount) {
    influences.push('需要谨慎行事，注意防范不利因素');
  } else {
    influences.push('吉凶参半，需要把握时机，趋吉避凶');
  }
  
  // 特别提醒
  const hasLu = allEffects.some(e => e.mutagen === '禄');
  const hasJi = allEffects.some(e => e.mutagen === '忌');
  
  if (hasLu) {
    influences.push('有化禄星加持，财运或福气有所提升');
  }
  
  if (hasJi) {
    influences.push('有化忌星影响，需要特别注意相关事项');
  }
  
  return influences;
}

// 分析运势吉凶等级
function analyzeFortuneLevel(analysisData) {
  let score = 50; // 基础分数
  const analysis = {
    overall_score: 0,
    level: '',
    positive_factors: [],
    negative_factors: [],
    recommendations: []
  };
  
  try {
    // 大限影响（权重40%）
    if (analysisData.decadal_info && analysisData.decadal_info.mutagens) {
      analysisData.decadal_info.mutagens.forEach(star => {
        const effect = getMutagenScore(star);
        score += effect * 0.4;
        if (effect > 0) {
          analysis.positive_factors.push(`大限${star}化吉`);
        } else if (effect < 0) {
          analysis.negative_factors.push(`大限${star}化凶`);
        }
      });
    }
    
    // 流年影响（权重50%）
    if (analysisData.yearly_info && analysisData.yearly_info.mutagens) {
      analysisData.yearly_info.mutagens.forEach(star => {
        const effect = getMutagenScore(star);
        score += effect * 0.5;
        if (effect > 0) {
          analysis.positive_factors.push(`流年${star}化吉`);
        } else if (effect < 0) {
          analysis.negative_factors.push(`流年${star}化凶`);
        }
      });
    }
    
    // 流月影响（权重10%）
    if (analysisData.monthly_info && analysisData.monthly_info.mutagens) {
      analysisData.monthly_info.mutagens.forEach(star => {
        const effect = getMutagenScore(star);
        score += effect * 0.1;
      });
    }
    
    analysis.overall_score = Math.max(0, Math.min(100, Math.round(score)));
    
    // 确定等级
    if (analysis.overall_score >= 80) {
      analysis.level = '大吉';
      analysis.recommendations.push('运势极佳，可以大胆行动，把握机会');
    } else if (analysis.overall_score >= 70) {
      analysis.level = '中吉';
      analysis.recommendations.push('运势良好，适合推进重要计划');
    } else if (analysis.overall_score >= 60) {
      analysis.level = '小吉';
      analysis.recommendations.push('运势平稳偏好，可以稳步发展');
    } else if (analysis.overall_score >= 40) {
      analysis.level = '平常';
      analysis.recommendations.push('运势平平，宜守不宜攻，稳健为上');
    } else if (analysis.overall_score >= 30) {
      analysis.level = '小凶';
      analysis.recommendations.push('需要谨慎行事，避免重大决策');
    } else {
      analysis.level = '大凶';
      analysis.recommendations.push('运势较差，宜静不宜动，多行善积德');
    }
    
  } catch (error) {
    analysis.error = '运势分析出现错误: ' + error.message;
    analysis.level = '无法判断';
  }
  
  return analysis;
}

// 获取四化评分
function getMutagenScore(starName) {
  // 这里需要根据具体的四化星和其影响来评分
  // 简化处理：禄+20分，权+15分，科+10分，忌-15分
  if (starName.includes('禄')) return 20;
  if (starName.includes('权')) return 15;
  if (starName.includes('科')) return 10;
  if (starName.includes('忌')) return -15;
  return 0;
}

// 生成运势建议
function generateHoroscopeAdvice(analysisData) {
  const advice = [];
  
  try {
    // 基于四化分析给出建议
    if (analysisData.mutagen_analysis && analysisData.mutagen_analysis.key_influences) {
      advice.push(...analysisData.mutagen_analysis.key_influences);
    }
    
    // 基于运势等级给出建议
    if (analysisData.fortune_analysis && analysisData.fortune_analysis.recommendations) {
      advice.push(...analysisData.fortune_analysis.recommendations);
    }
    
    // 通用建议
    if (advice.length === 0) {
      advice.push('具体运势需要结合命盘星曜配置、宫位强弱和四化星的作用进行综合分析');
    }
    
  } catch (error) {
    advice.push('建议生成过程中出现错误，请结合具体分析结果参考');
  }
  
  return advice.join('；');
}

// 分析宫位飞星效应
function analyzePalaceEffects(analysisData, astrolabeData) {
  const effects = {
    major_effects: [],
    palace_impacts: {
      life: [],      // 命宫影响
      wealth: [],    // 财帛宫影响  
      career: [],    // 官禄宫影响
      marriage: [],  // 夫妻宫影响
      health: []     // 疾厄宫影响
    },
    recommendations: []
  };

  try {
    // 分析流年四化飞入哪些宫位
    if (analysisData.yearly_info && analysisData.yearly_info.mutagens) {
      analysisData.yearly_info.mutagens.forEach(starName => {
        const palaceEffect = analyzeMutagenToPalace(starName, astrolabeData);
        if (palaceEffect) {
          effects.major_effects.push(palaceEffect);
          
          // 根据影响宫位分类
          switch (palaceEffect.target_palace) {
            case '命宫':
              effects.palace_impacts.life.push(palaceEffect.effect);
              break;
            case '财帛':
              effects.palace_impacts.wealth.push(palaceEffect.effect);
              break;
            case '官禄':
              effects.palace_impacts.career.push(palaceEffect.effect);
              break;
            case '夫妻':
              effects.palace_impacts.marriage.push(palaceEffect.effect);
              break;
            case '疾厄':
              effects.palace_impacts.health.push(palaceEffect.effect);
              break;
          }
        }
      });
    }

    // 生成宫位效应建议
    if (effects.palace_impacts.life.length > 0) {
      effects.recommendations.push('命宫有流年四化影响，注意个人形象和健康');
    }
    if (effects.palace_impacts.wealth.length > 0) {
      effects.recommendations.push('财帛宫有流年四化影响，注意财务管理');
    }
    if (effects.palace_impacts.career.length > 0) {
      effects.recommendations.push('官禄宫有流年四化影响，关注事业发展');
    }
    if (effects.palace_impacts.marriage.length > 0) {
      effects.recommendations.push('夫妻宫有流年四化影响，注意感情关系');
    }
    if (effects.palace_impacts.health.length > 0) {
      effects.recommendations.push('疾厄宫有流年四化影响，注意身体健康');
    }

  } catch (error) {
    effects.error = '宫位效应分析出错: ' + error.message;
  }

  return effects;
}

// 分析四化星飞入宫位的效应
function analyzeMutagenToPalace(starName, astrolabeData) {
  // 查找星曜所在宫位
  if (!astrolabeData.star_locations || !astrolabeData.star_locations[starName]) {
    return null;
  }

  const starInfo = astrolabeData.star_locations[starName];
  const targetPalace = starInfo.palace;

  // 根据四化类型和目标宫位分析效应
  let mutagenType = '';
  let effect = '';

  if (starName.includes('禄')) {
    mutagenType = '化禄';
    effect = getPalaceMutagenEffect(targetPalace, '禄');
  } else if (starName.includes('权')) {
    mutagenType = '化权';
    effect = getPalaceMutagenEffect(targetPalace, '权');
  } else if (starName.includes('科')) {
    mutagenType = '化科';
    effect = getPalaceMutagenEffect(targetPalace, '科');
  } else if (starName.includes('忌')) {
    mutagenType = '化忌';
    effect = getPalaceMutagenEffect(targetPalace, '忌');
  }

  if (effect) {
    return {
      star: starName,
      mutagen_type: mutagenType,
      target_palace: targetPalace,
      effect: effect
    };
  }

  return null;
}

// 获取宫位四化效应
function getPalaceMutagenEffect(palace, mutagen) {
  const effects = {
    '命宫': {
      '禄': '个人魅力提升，贵人运强，身体健康',
      '权': '个人威权增强，领导力显现，主观意识强',
      '科': '名声提升，学习能力强，文雅有礼',
      '忌': '身体健康注意，个人形象受损，情绪波动'
    },
    '财帛': {
      '禄': '财运亨通，收入增加，投资得利',
      '权': '财务主导权强，理财能力突出，消费欲望大',
      '科': '理财有方，财技精明，名声带来财富',
      '忌': '财运受阻，投资谨慎，避免冲动消费'
    },
    '官禄': {
      '禄': '事业顺利，工作得心应手，升职加薪',
      '权': '工作权威性强，管理能力突出，事业心重',
      '科': '专业能力认可，学术成就，技能精进',
      '忌': '工作压力大，职场竞争激烈，避免冲突'
    },
    '夫妻': {
      '禄': '感情和谐，桃花运旺，配偶助力',
      '权': '感情中主导性强，配偶强势，需要平衡',
      '科': '感情文雅，夫妻恩爱，名正言顺',
      '忌': '感情波折，夫妻争执，需要包容'
    },
    '疾厄': {
      '禄': '身体健康，精神愉快，医疗得利',
      '权': '身体强壮，抵抗力强，注意过度劳累',
      '科': '养生有方，医学知识，保健意识强',
      '忌': '健康注意，慢性疾病，定期检查'
    }
  };

  return effects[palace] && effects[palace][mutagen] || `${palace}${mutagen === '忌' ? '不利' : '吉利'}影响`;
}

// 生成具体事项预测
function generateSpecificPredictions(analysisData, astrolabeData) {
  const predictions = {
    career: {
      outlook: '平稳',
      key_points: [],
      advice: []
    },
    wealth: {
      outlook: '平稳', 
      key_points: [],
      advice: []
    },
    relationship: {
      outlook: '平稳',
      key_points: [],
      advice: []
    },
    health: {
      outlook: '平稳',
      key_points: [],
      advice: []
    }
  };

  try {
    // 基于运势等级设定基础outlook
    if (analysisData.fortune_analysis) {
      const score = analysisData.fortune_analysis.overall_score || 50;
      let baseOutlook = '平稳';
      
      if (score >= 70) baseOutlook = '良好';
      else if (score >= 60) baseOutlook = '稳中有升';
      else if (score <= 40) baseOutlook = '需要谨慎';
      else if (score <= 30) baseOutlook = '较为困难';
      
      predictions.career.outlook = baseOutlook;
      predictions.wealth.outlook = baseOutlook;
      predictions.relationship.outlook = baseOutlook;
      predictions.health.outlook = baseOutlook;
    }

    // 基于四化分析调整具体预测
    if (analysisData.palace_effects && analysisData.palace_effects.palace_impacts) {
      const impacts = analysisData.palace_effects.palace_impacts;
      
      // 事业预测
      if (impacts.career.length > 0) {
        predictions.career.key_points = impacts.career;
        predictions.career.advice.push('关注工作变化，把握发展机会');
      }
      
      // 财运预测
      if (impacts.wealth.length > 0) {
        predictions.wealth.key_points = impacts.wealth;
        predictions.wealth.advice.push('理性投资，控制风险');
      }
      
      // 感情预测
      if (impacts.marriage.length > 0) {
        predictions.relationship.key_points = impacts.marriage;
        predictions.relationship.advice.push('加强沟通，维护感情');
      }
      
      // 健康预测
      if (impacts.health.length > 0) {
        predictions.health.key_points = impacts.health;
        predictions.health.advice.push('注意身体，定期检查');
      }
    }

    // 基于命盘主要星曜补充建议
    if (astrolabeData.star_locations) {
      // 找到命宫主星
      const lifeStars = Object.entries(astrolabeData.star_locations)
        .filter(([_, star]) => star.palace === '命宫' && star.type === 'major')
        .map(([name, _]) => name);
      
      if (lifeStars.includes('紫微')) {
        predictions.career.advice.push('发挥领导才能，承担重要职责');
      }
      if (lifeStars.includes('武曲')) {
        predictions.wealth.advice.push('善用理财能力，多元化投资');
      }
      if (lifeStars.includes('贪狼')) {
        predictions.relationship.advice.push('注意桃花运势，理性处理感情');
      }
    }

    // 添加通用建议
    if (predictions.career.advice.length === 0) {
      predictions.career.advice.push('保持积极心态，稳步发展');
    }
    if (predictions.wealth.advice.length === 0) {
      predictions.wealth.advice.push('量入为出，稳健理财');
    }
    if (predictions.relationship.advice.length === 0) {
      predictions.relationship.advice.push('真诚待人，维护人际关系');
    }
    if (predictions.health.advice.length === 0) {
      predictions.health.advice.push('规律作息，适度运动');
    }

  } catch (error) {
    predictions.error = '具体预测生成出错: ' + error.message;
  }

  return predictions;
}

// 分析大限宫位特征
function analyzeDecadalPalace(decadalInfo, astrolabeData) {
  const characteristics = {
    palace_nature: '',
    key_stars: [],
    overall_influence: '',
    decade_themes: [],
    opportunities: [],
    challenges: []
  };

  try {
    const palaceName = decadalInfo?.name || '';
    
    // 找到大限宫位的星曜配置
    if (astrolabeData.palace_data) {
      const palace = astrolabeData.palace_data.find(p => p.name === palaceName);
      if (palace && palace.stars) {
        characteristics.key_stars = palace.stars
          .filter(star => star.type === 'major')
          .map(star => ({
            name: star.name,
            brightness: star.brightness,
            mutagen: star.mutagen
          }));
      }
    }

    // 根据宫位性质分析大限特征
    const palaceCharacteristics = {
      '命宫': {
        nature: '自我表现，个人发展',
        themes: ['个人能力提升', '性格特质发挥', '自我实现'],
        opportunities: ['展现个人魅力', '建立个人品牌', '提升影响力'],
        challenges: ['过于自我', '忽视他人感受', '压力承受']
      },
      '财帛': {
        nature: '财富累积，价值创造',
        themes: ['财富增长', '投资理财', '价值实现'],
        opportunities: ['投资获利', '收入增加', '财务自由'],
        challenges: ['财务压力', '投资风险', '消费控制']
      },
      '官禄': {
        nature: '事业发展，社会地位',
        themes: ['事业晋升', '专业发展', '社会认可'],
        opportunities: ['职位提升', '专业突破', '权威建立'],
        challenges: ['工作压力', '竞争激烈', '责任重大']
      },
      '田宅': {
        nature: '家庭生活，不动产',
        themes: ['家庭和谐', '置业安家', '生活稳定'],
        opportunities: ['购置房产', '家庭美满', '生活改善'],
        challenges: ['家庭负担', '房贷压力', '家庭纠纷']
      },
      '子女': {
        nature: '创造力，子女关系',
        themes: ['创意发挥', '子女教育', '艺术天赋'],
        opportunities: ['创作成功', '子女有成', '艺术发展'],
        challenges: ['子女问题', '创作瓶颈', '投机风险']
      },
      '奴仆': {
        nature: '人际关系，下属朋友',
        themes: ['朋友助力', '团队合作', '社交拓展'],
        opportunities: ['贵人相助', '团队成功', '人脉拓展'],
        challenges: ['朋友拖累', '人际纠纷', '被人利用']
      },
      '夫妻': {
        nature: '婚姻感情，合作关系',
        themes: ['婚姻美满', '感情发展', '合作成功'],
        opportunities: ['婚姻幸福', '合作获利', '感情稳定'],
        challenges: ['感情波折', '合作纠纷', '婚姻问题']
      },
      '疾厄': {
        nature: '身体健康，意外灾厄',
        themes: ['健康管理', '疾病预防', '意外防范'],
        opportunities: ['身体强健', '医疗得利', '保健有成'],
        challenges: ['健康问题', '意外风险', '医疗支出']
      },
      '迁移': {
        nature: '外出发展，环境变化',
        themes: ['外地发展', '环境改变', '旅行机会'],
        opportunities: ['外地成功', '环境改善', '见识增长'],
        challenges: ['异地困难', '环境不适', '离乡背井']
      },
      '福德': {
        nature: '精神享受，福气修养',
        themes: ['精神富裕', '生活品质', '修身养性'],
        opportunities: ['精神满足', '生活享受', '修养提升'],
        challenges: ['精神空虚', '享乐过度', '缺乏目标']
      },
      '父母': {
        nature: '长辈关系，学习成长',
        themes: ['长辈助力', '学习进步', '智慧增长'],
        opportunities: ['长辈支持', '学业有成', '智慧提升'],
        challenges: ['长辈压力', '学习困难', '代沟问题']
      },
      '兄弟': {
        nature: '手足情谊，同辈关系',
        themes: ['兄弟和睦', '同辈互助', '平等合作'],
        opportunities: ['手足助力', '同辈支持', '合作共赢'],
        challenges: ['兄弟纠纷', '同辈竞争', '资源争夺']
      }
    };

    const palaceInfo = palaceCharacteristics[palaceName];
    if (palaceInfo) {
      characteristics.palace_nature = palaceInfo.nature;
      characteristics.decade_themes = palaceInfo.themes;
      characteristics.opportunities = palaceInfo.opportunities;
      characteristics.challenges = palaceInfo.challenges;
    }

    // 根据主星分析整体影响
    if (characteristics.key_stars.length > 0) {
      const majorStar = characteristics.key_stars[0];
      const starInfluences = {
        '紫微': '权威领导，高贵气质，适合担任重要职务',
        '天机': '智慧谋略，善于策划，适合动脑工作',
        '太阳': '光明正大，热情开朗，适合公众事务',
        '武曲': '刚毅果断，财务敏锐，适合财经工作',
        '天同': '温和福气，人缘佳，生活安逸',
        '廉贞': '正直美丽，有原则，注意感情问题',
        '天府': '稳重保守，善于积累，财运稳定',
        '太阴': '温柔细腻，适合服务业，女性贵人多',
        '贪狼': '多才多艺，善于交际，注意欲望控制',
        '巨门': '口才佳，适合传媒，注意口舌是非',
        '天相': '忠厚可靠，善于协调，贵人运佳',
        '天梁': '慈祥长者，医药有缘，威望高',
        '七杀': '勇猛果断，适合开拓，注意冲动',
        '破军': '破旧立新，变革创新，变化较大'
      };
      
      characteristics.overall_influence = starInfluences[majorStar.name] || 
        `${majorStar.name}星坐守，${majorStar.brightness === '庙' ? '发挥良好' : majorStar.brightness === '旺' ? '表现优秀' : '需要努力'}`;
    }

  } catch (error) {
    characteristics.error = '大限宫位分析出错: ' + error.message;
  }

  return characteristics;
}

// 分析小限宫位特征
function analyzeAgeLimitPalace(ageLimitInfo, astrolabeData) {
  const characteristics = {
    palace_nature: '',
    key_stars: [],
    yearly_influence: '',
    focus_areas: [],
    monthly_variations: [],
    action_advice: []
  };

  try {
    const palaceName = ageLimitInfo?.name || '';
    
    // 找到小限宫位的星曜配置
    if (astrolabeData.palace_data) {
      const palace = astrolabeData.palace_data.find(p => p.name === palaceName);
      if (palace && palace.stars) {
        characteristics.key_stars = palace.stars
          .filter(star => star.type === 'major')
          .map(star => ({
            name: star.name,
            brightness: star.brightness,
            mutagen: star.mutagen
          }));
      }
    }

    // 根据宫位性质分析小限特征（更注重当年的具体表现）
    const ageLimitCharacteristics = {
      '命宫': {
        nature: '个人状态，身体健康',
        focus: ['个人形象', '健康状态', '精神面貌', '自我表现'],
        advice: ['注重健康', '提升形象', '积极主动', '展现才能']
      },
      '财帛': {
        nature: '财务状况，收支管理',
        focus: ['收入变化', '支出控制', '投资机会', '理财规划'],
        advice: ['开源节流', '稳健投资', '财务规划', '避免浪费']
      },
      '官禄': {
        nature: '工作表现，事业发展',
        focus: ['工作效率', '职位变动', '专业提升', '事业机会'],
        advice: ['努力工作', '提升技能', '把握机会', '避免冲突']
      },
      '田宅': {
        nature: '居住环境，家庭生活',
        focus: ['居住变化', '家庭和谐', '不动产', '生活品质'],
        advice: ['改善居住', '关爱家人', '稳定生活', '置业计划']
      },
      '子女': {
        nature: '创造表现，子女关系',
        focus: ['创意发挥', '子女教育', '投机机会', '娱乐活动'],
        advice: ['发挥创意', '关注子女', '适度娱乐', '避免投机']
      },
      '奴仆': {
        nature: '人际交往，朋友关系',
        focus: ['朋友互动', '团队合作', '社交活动', '人脉建立'],
        advice: ['广交朋友', '团队协作', '互助互利', '慎选朋友']
      },
      '夫妻': {
        nature: '感情关系，合作事务',
        focus: ['感情发展', '夫妻关系', '合作项目', '伴侣互动'],
        advice: ['用心经营', '增进感情', '合作共赢', '相互包容']
      },
      '疾厄': {
        nature: '健康状况，意外防范',
        focus: ['身体健康', '疾病预防', '意外风险', '医疗保健'],
        advice: ['注意健康', '定期体检', '小心意外', '适度运动']
      },
      '迁移': {
        nature: '外出机会，环境变化',
        focus: ['出行计划', '搬迁可能', '外地机会', '环境适应'],
        advice: ['把握机会', '适应变化', '开阔视野', '注意安全']
      },
      '福德': {
        nature: '精神状态，享受品质',
        focus: ['精神愉悦', '生活享受', '修身养性', '心理健康'],
        advice: ['保持乐观', '适度享受', '修身养性', '心理平衡']
      },
      '父母': {
        nature: '长辈关系，学习机会',
        focus: ['父母健康', '长辈关系', '学习进步', '知识增长'],
        advice: ['孝顺父母', '尊敬长辈', '努力学习', '增长见识']
      },
      '兄弟': {
        nature: '兄弟关系，同辈交往',
        focus: ['手足关系', '同辈友谊', '合作机会', '资源共享'],
        advice: ['和睦相处', '互相帮助', '合作共赢', '避免纠纷']
      }
    };

    const palaceInfo = ageLimitCharacteristics[palaceName];
    if (palaceInfo) {
      characteristics.palace_nature = palaceInfo.nature;
      characteristics.focus_areas = palaceInfo.focus;
      characteristics.action_advice = palaceInfo.advice;
    }

    // 根据主星分析当年影响
    if (characteristics.key_stars.length > 0) {
      const majorStar = characteristics.key_stars[0];
      characteristics.yearly_influence = `${majorStar.name}星主导当年运势，${
        majorStar.brightness === '庙' ? '发挥出色，宜积极行动' :
        majorStar.brightness === '旺' ? '表现良好，可稳步发展' :
        majorStar.brightness === '得' ? '平稳发展，需要努力' :
        majorStar.brightness === '利' ? '有利发展，把握机会' :
        majorStar.brightness === '平' ? '平常表现，需要耐心' :
        '需要谨慎，宜守不宜攻'
      }`;
    }

  } catch (error) {
    characteristics.error = '小限宫位分析出错: ' + error.message;
  }

  return characteristics;
}

// 生成摘要文本
function getSummaryText(queryType, year, month, day, analysisData) {
  const age = analysisData.current_age;
  const decadalName = analysisData.decadal_info?.name || '';
  
  switch (queryType) {
    case 'daily':
      return `${year}年${month}月${day}日，您${age}岁，当日运势分析`;
    case 'decadal':
      const range = analysisData.decadal_info?.range || [];
      return `大限运势：您${age}岁，当前处于${decadalName}大限期间${range.length > 0 ? `（${range[0]}-${range[1]}岁）` : ''}`;
    case 'age_limit':
      return `小限运势：${year}年，您${age}岁，小限走${analysisData.age_info?.name || ''}宫`;
    case 'monthly':
      return `${year}年${month}月，您${age}岁，当前处于${decadalName}大限期间`;
    default: // yearly
      return `${year}年，您${age}岁，当前处于${decadalName}大限期间`;
  }
}

// 生成关键要点
function getKeyPoints(queryType, analysisData) {
  const points = [];
  
  switch (queryType) {
    case 'daily':
      points.push(`流日干支：${analysisData.daily_info?.heavenly_stem || ''}${analysisData.daily_info?.earthly_branch || ''}`);
      points.push(`流月宫位：${analysisData.monthly_info?.name || ''}`);
      points.push(`流年干支：${analysisData.yearly_info?.heavenly_stem || ''}${analysisData.yearly_info?.earthly_branch || ''}`);
      points.push(`大限宫位：${analysisData.decadal_info?.name || ''}`);
      break;
      
    case 'decadal':
      points.push(`大限宫位：${analysisData.decadal_info?.name || ''}（${analysisData.decadal_info?.heavenly_stem || ''}${analysisData.decadal_info?.earthly_branch || ''}）`);
      points.push(`大限范围：${analysisData.decadal_info?.range?.join('-') || ''}岁`);
      if (analysisData.decadal_info?.palace_characteristics?.overall_influence) {
        points.push(`主要影响：${analysisData.decadal_info.palace_characteristics.overall_influence}`);
      }
      points.push(`参考流年：${analysisData.yearly_info?.heavenly_stem || ''}${analysisData.yearly_info?.earthly_branch || ''}年`);
      break;
      
    case 'age_limit':
      points.push(`小限宫位：${analysisData.age_info?.name || ''}（${analysisData.age_info?.heavenly_stem || ''}${analysisData.age_info?.earthly_branch || ''}）`);
      if (analysisData.age_info?.palace_characteristics?.yearly_influence) {
        points.push(`当年影响：${analysisData.age_info.palace_characteristics.yearly_influence}`);
      }
      points.push(`大限背景：${analysisData.decadal_info?.name || ''}大限`);
      points.push(`流年干支：${analysisData.yearly_info?.heavenly_stem || ''}${analysisData.yearly_info?.earthly_branch || ''}`);
      break;
      
    case 'monthly':
      points.push(`流月宫位：${analysisData.monthly_info?.name || ''}`);
      points.push(`流月干支：${analysisData.monthly_info?.heavenly_stem || ''}${analysisData.monthly_info?.earthly_branch || ''}`);
      points.push(`流年干支：${analysisData.yearly_info?.heavenly_stem || ''}${analysisData.yearly_info?.earthly_branch || ''}`);
      points.push(`大限宫位：${analysisData.decadal_info?.name || ''}`);
      break;
      
    default: // yearly
      points.push(`大限宫位：${analysisData.decadal_info?.name || ''}（${analysisData.decadal_info?.heavenly_stem || ''}${analysisData.decadal_info?.earthly_branch || ''}）`);
      points.push(`流年干支：${analysisData.yearly_info?.heavenly_stem || ''}${analysisData.yearly_info?.earthly_branch || ''}`);
      points.push(`小限宫位：${analysisData.age_info?.name || ''}`);
      break;
  }
  
  // 添加四化星信息
  const mutagens = [];
  if (analysisData.decadal_info?.mutagens) mutagens.push(...analysisData.decadal_info.mutagens);
  if (analysisData.yearly_info?.mutagens) mutagens.push(...analysisData.yearly_info.mutagens);
  if (analysisData.monthly_info?.mutagens) mutagens.push(...analysisData.monthly_info.mutagens);
  if (analysisData.daily_info?.mutagens) mutagens.push(...analysisData.daily_info.mutagens);
  if (analysisData.age_info?.mutagens) mutagens.push(...analysisData.age_info.mutagens);
  
  const uniqueMutagens = [...new Set(mutagens)];
  if (uniqueMutagens.length > 0) {
    points.push(`四化星：${uniqueMutagens.join('、')}`);
  }
  
  return points;
}

// 生成完成消息
function getCompletionMessage(queryType, year, month, day) {
  switch (queryType) {
    case 'daily':
      return `${year}年${month}月${day}日流日运势查询完成`;
    case 'decadal':
      return `${year}年大限运势查询完成`;
    case 'age_limit':
      return `${year}年小限运势查询完成`;
    case 'monthly':
      return `${year}年${month}月流月运势查询完成`;
    default: // yearly
      return `${year}年流年运势查询完成`;
  }
}
