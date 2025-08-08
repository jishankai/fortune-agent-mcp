export async function analyzeStar({ star_name, palace }) {
  try {
    // 基于iztro文档的完整星曜分析
    const analysis = {
      star_name: star_name,
      type: getStarType(star_name),
      palace_location: palace || '未指定',
      meaning: getStarMeaning(star_name),
      influence: getStarInfluence(star_name, palace),
      personality_traits: getPersonalityTraits(star_name),
      career_influence: getCareerInfluence(star_name, palace),
      wealth_influence: getWealthInfluence(star_name, palace),
      relationship_influence: getRelationshipInfluence(star_name, palace),
      mutagen_effects: getMutagenEffects(star_name),
      brightness_effects: getBrightnessEffects(star_name),
      combination_effects: getCombinationEffects(star_name)
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: analysis,
            message: `${star_name}星曜分析完成`
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
            message: '星曜分析失败'
          }, null, 2)
        }
      ],
      isError: true
    };
  }
}

export async function getPalaceInfo({ astrolabe_data, palace_name }) {
  try {
    // 根据iztro真实数据结构解析
    if (!astrolabe_data) {
      throw new Error('无效的星盘数据');
    }

    // 支持多种数据格式
    let palace;
    if (astrolabe_data.palace_data) {
      palace = astrolabe_data.palace_data.find(p => p.name === palace_name);
    } else if (astrolabe_data.astrolabe && astrolabe_data.astrolabe.palaces) {
      palace = astrolabe_data.astrolabe.palaces.find(p => p.name === palace_name);
    } else if (astrolabe_data.palaces) {
      palace = astrolabe_data.palaces.find(p => p.name === palace_name);
    }
    
    if (!palace) {
      throw new Error(`未找到宫位: ${palace_name}`);
    }

    const analysis = {
      palace_name: palace.name,
      earthly_branch: palace.earthly_branch || palace.earthlyBranch,
      heavenly_stem: palace.heavenly_stem || palace.heavenlyStem,
      is_body_palace: palace.is_body_palace || palace.isBodyPalace || false,
      is_original_palace: palace.is_original_palace || palace.isOriginalPalace || false,
      
      // 星曜分类
      major_stars: extractStars(palace, 'major'),
      minor_stars: extractStars(palace, 'soft') || extractStars(palace, 'minor'),
      tough_stars: extractStars(palace, 'tough'),
      adjective_stars: extractStars(palace, 'adjective'),
      flower_stars: extractStars(palace, 'flower'),
      helper_stars: extractStars(palace, 'helper'),
      
      // 宫位含义和分析
      palace_meaning: getPalaceMeaning(palace_name),
      palace_strength: analyzePalaceStrength(palace),
      stars_influence: analyzeStarsInfluence(palace, palace_name),
      
      // 四化和其他特殊标记
      mutagens: extractMutagens(palace),
      brightness_analysis: analyzeBrightness(palace),
      
      // 大运流年信息（如果有）
      decadal_info: palace.decadal || null,
      ages: palace.ages || null
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: analysis,
            message: `${palace_name}宫位信息查询完成`
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
            message: '宫位信息查询失败'
          }, null, 2)
        }
      ],
      isError: true
    };
  }
}

export async function analyzeRelationships({ astrolabe_data, analysis_type }) {
  try {
    // 详细调试日志 - 检查原始输入
    console.log('=== analyzeRelationships 原始参数调试 ===');
    console.log('arguments对象类型:', typeof arguments[0]);
    console.log('arguments对象键:', Object.keys(arguments[0]));
    console.log('astrolabe_data 类型:', typeof astrolabe_data);
    console.log('astrolabe_data 值:', astrolabe_data);
    
    if (astrolabe_data && typeof astrolabe_data === 'object') {
      console.log('astrolabe_data 键:', Object.keys(astrolabe_data));
      if (astrolabe_data.basic_info) {
        console.log('basic_info:', astrolabe_data.basic_info);
      }
      if (astrolabe_data.palace_data) {
        console.log('palace_data 长度:', astrolabe_data.palace_data.length);
        console.log('第一个宫位:', astrolabe_data.palace_data[0]);
      }
      if (astrolabe_data.star_locations) {
        console.log('star_locations 键数量:', Object.keys(astrolabe_data.star_locations).length);
        console.log('前5个星曜:', Object.keys(astrolabe_data.star_locations).slice(0, 5));
      }
    }
    console.log('analysis_type:', analysis_type);
    console.log('=== 原始参数调试结束 ===');

    if (!astrolabe_data || !astrolabe_data.palace_data) {
      throw new Error('无效的星盘数据');
    }

    let analysis = {};

    switch (analysis_type) {
      case '基本格局':
        analysis = analyzeBasicPattern(astrolabe_data);
        break;
      case '财运分析':
        analysis = analyzeWealth(astrolabe_data);
        break;
      case '事业分析':
        analysis = analyzeCareer(astrolabe_data);
        break;
      case '感情分析':
        analysis = analyzeRelationship(astrolabe_data);
        break;
      case '健康分析':
        analysis = analyzeHealth(astrolabe_data);
        break;
      default:
        throw new Error(`不支持的分析类型: ${analysis_type}`);
    }
    console.log('分析结果:', analysis);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: analysis,
            message: `${analysis_type}分析完成`
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
            message: '关系分析失败'
          }, null, 2)
        }
      ],
      isError: true
    };
  }
}

function getStarType(starName) {
  const starTypes = {
    // 十四主星
    '紫微': '主星', '天机': '主星', '太阳': '主星', '武曲': '主星',
    '天同': '主星', '廉贞': '主星', '天府': '主星', '太阴': '主星',
    '贪狼': '主星', '巨门': '主星', '天相': '主星', '天梁': '主星',
    '七杀': '主星', '破军': '主星',
    
    // 左辅右弼
    '左辅': '吉辅', '右弼': '吉辅',
    
    // 文星
    '天魁': '吉辅', '天钺': '吉辅', '文昌': '吉辅', '文曲': '吉辅',
    
    // 禄存
    '禄存': '吉辅',
    
    // 六凶星
    '擎羊': '凶辅', '陀罗': '凶辅', '火星': '凶辅',
    '铃星': '凶辅', '地空': '凶辅', '地劫': '凶辅',
    
    // 其他重要辅星
    '天马': '辅星', '红鸾': '桃花星', '天喜': '桃花星',
    '天姚': '桃花星', '咸池': '桃花星',
    
    // 常见杂曜
    '三台': '杂曜', '八座': '杂曜', '台辅': '杂曜', '封诫': '杂曜',
    '天官': '杂曜', '天福': '杂曜', '天寿': '杂曜', '天刃': '杂曜',
    '天虚': '杂曜', '天哭': '杂曜', '龙池': '杂曜', '凤阁': '杂曜',
    '天德': '杂曜', '月德': '杂曜', '解神': '杂曜', '年解': '杂曜'
  };
  
  return starTypes[starName] || '杂曜';
}

function getStarMeaning(starName) {
  const meanings = {
    // 十四主星
    '紫微': '帝王星，代表尊贵、领导力和权威，主贵气、地位和声望',
    '天机': '智慧星，代表聪明、机敏和策略，主思维、变化和灵活',
    '太阳': '光明星，代表正直、热情和权力，主光明、正义和博爱',
    '武曲': '财星，代表刚毅、果断和财富，主物质、理财和决断',
    '天同': '福星，代表温和、享受和人缘，主幸福、悠闲和和谐',
    '廉贞': '正义星，代表廉洁、正直和原则，主红艰、美丽和正义',
    '天府': '库星，代表稳重、保守和积累，主财库、保守和稳定',
    '太阴': '母星，代表温柔、细腻和内敛，主阴柔、母性和细腻',
    '贪狼': '欲望星，代表多才、交际和变化，主欲望、才艺和桃花',
    '巨门': '口舌星，代表口才、是非和深度，主口才、是非和暗对',
    '天相': '印星，代表忠诚、正直和协调，主辅佐、服务和中介',
    '天梁': '寿星，代表慈祥、威望和帮扶，主长者、师父和解困',
    '七杀': '将星，代表勇敢、独立和冲动，主威武、杀伐和险难',
    '破军': '耗星，代表开创、变革和破立，主破坏、变化和重新开始',
    
    // 吉辅星
    '左辅': '贵人星，主帮助、贵人和男性朋友',
    '右弼': '贵人星，主帮助、贵人和女性朋友',
    '天魁': '科甲星，主贵人、考试和名声',
    '天钺': '科甲星，主贵人、考试和名声',
    '文昌': '文星，主文学、才华和考试',
    '文曲': '文星，主文学、才华和口才',
    '禄存': '禄星，主财富、稳定和保守',
    
    // 凶辅星
    '擎羊': '刀星，主冲动、反抗和意外',
    '陀罗': '网星，主缠绕、拖累和慢性病',
    '火星': '大凶星，主爆燥、冲动和烦躁',
    '铃星': '小凶星，主隐性损害和内在烦恼',
    '地空': '空亡星，主空虚、损失和幻想',
    '地劫': '入库星，主劫奪、损失和波折',
    
    // 桃花星
    '红鸾': '桃花星，主婚姻、喜庆和缘分',
    '天喜': '桃花星，主喜庆、婚姻和欢乐',
    '天姚': '桃花星，主美貌、风情和迷人',
    '咸池': '桃花星，主风情、欢乐和迷惑',
    
    // 其他重要星曜
    '天马': '动星，主出外、变化和车马',
    '三台': '贵人星，主地位、名声和荣誉',
    '八座': '贵人星，主地位、名声和荣誉',
    '天德': '德星，主德行、善缘和解厄',
    '月德': '德星，主德行、善缘和解厄'
  };
  
  return meanings[starName] || `${starName}的详细含义需要结合具体星盘分析`;
}

function getStarInfluence(starName, palace) {
  const influences = {
    '紫微': {
      '命宫': '具有领导才能，个性尊贵，有帝王之相',
      '财帛': '财运亨通，理财能力强，易获得地位带来的财富',
      '事业': '适合从事管理工作，容易获得权力地位',
      '夫妻': '配偶地位较高，婚姻关系稳定'
    },
    '天机': {
      '命宫': '智慧聪明，善于谋略，思维敏捷',
      '财帛': '理财有方，善于投资理财',
      '事业': '适合从事策划、咨询等智力工作',
      '夫妻': '夫妻感情变化较多，需要智慧经营'
    },
    '太阳': {
      '命宫': '性格光明磊落，具有领导魅力',
      '财帛': '正财运佳，适合阳光正大的赚钱方式',
      '事业': '适合公职或大型企业工作',
      '夫妻': '婚姻光明正大，配偶正直'
    }
  };

  return influences[starName]?.[palace] || `${starName}在${palace}的影响需要结合具体情况分析`;
}

function getPersonalityTraits(starName) {
  const traits = {
    '紫微': ['尊贵', '领导力强', '自尊心强', '责任感重'],
    '天机': ['聪明', '机敏', '善变', '思虑周密'],
    '太阳': ['光明', '正直', '热情', '大方'],
    '武曲': ['刚毅', '果断', '重义气', '理财能力强'],
    '天同': ['温和', '享受', '有福气', '人缘好'],
    '廉贞': ['廉洁', '正义', '有原则', '不易妥协'],
    '天府': ['稳重', '保守', '有福气', '善于积累'],
    '太阴': ['温柔', '细腻', '敏感', '内向'],
    '贪狼': ['多才多艺', '善交际', '欲望强', '变化多'],
    '巨门': ['口才好', '善辩', '疑心重', '是非多'],
    '天相': ['忠诚', '正直', '有责任感', '善于协调'],
    '天梁': ['慈祥', '长者风范', '喜欢帮助他人', '有威望'],
    '七杀': ['勇敢', '冲动', '独立性强', '不服输'],
    '破军': ['开创性强', '勇于变革', '不拘小节', '破而后立']
  };

  return traits[starName] || [`${starName}的特质需要结合具体星盘分析`];
}

// 获取亮度效应
function getBrightnessEffect(brightness) {
  const effects = {
    '庙': '最吉利，星曜力量得到最大发挥',
    '旺': '很吉利，星曜力量强盛',
    '得': '较吉利，星曜力量较好',
    '利': '小吉，星曜力量一般',
    '平': '中性，星曜力量正常',
    '不': '略不利，星曜力量较弱',
    '陷': '不利，星曜力量被抑制'
  };
  return effects[brightness] || '未知亮度';
}

// 获取四化效应
function getMutagenEffect(mutagen) {
  const effects = {
    '禄': '化禄：增加财运和福气，吉利',
    '权': '化权：增加权力和地位，动力强',
    '科': '化科：增加名声和学问，文贵',
    '忌': '化忌：增加阻碍和烦恼，不利',
    '': '无四化'
  };
  return effects[mutagen] || '未知四化';
}

// 分析星曜模式
function analyzeStarPattern(majorStars) {
  if (!majorStars || majorStars.length === 0) {
    return '无主星，需参考对宫主星';
  }
  
  const starNames = majorStars.map(s => s.name);
  
  // 识别特殊组合
  if (starNames.includes('紫微') && starNames.includes('天府')) {
    return '紫府同宫，帝王之象，最为吉利';
  }
  if (starNames.includes('紫微') && starNames.includes('天相')) {
    return '紫相同宫，忠贞之象，吉利';
  }
  if (starNames.includes('天机') && starNames.includes('天梁')) {
    return '机梁同宫，智慧与慈祥并具';
  }
  if (starNames.includes('太阳') && starNames.includes('太阴')) {
    return '日月同宫，光辉照耀，吉利';
  }
  
  // 杀破狼格局
  const killerStars = ['七杀', '破军', '贪狼'];
  const hasKillerStars = starNames.filter(name => killerStars.includes(name));
  if (hasKillerStars.length >= 2) {
    return '杀破狼格局，开创之力强，变化多';
  }
  
  // 单星分析
  if (starNames.length === 1) {
    const starName = starNames[0];
    return `${starName}独坐，${getStarMeaning(starName)}`;
  }
  
  return `${starNames.join('、')}同宫，需综合分析`;
}

// 生成性格总结
function generatePersonalitySummary(majorStars) {
  if (!majorStars || majorStars.length === 0) {
    return '需参考对宫主星来分析性格';
  }
  
  const traits = [];
  majorStars.forEach(star => {
    const starTraits = getPersonalityTraits(star.name);
    traits.push(...starTraits);
  });
  
  // 去重和简化
  const uniqueTraits = [...new Set(traits)];
  return uniqueTraits.slice(0, 6).join('、'); // 最多显示6个特质
}

// 识别特殊格局
function identifySpecialPatterns(astrolabeData) {
  const patterns = [];
  
  try {
    let palaces = [];
    if (astrolabeData.palace_data) {
      palaces = astrolabeData.palace_data;
    } else if (astrolabeData.astrolabe && astrolabeData.astrolabe.palaces) {
      palaces = astrolabeData.astrolabe.palaces;
    }
    
    // 寻找特殊格局
    palaces.forEach(palace => {
      const majorStars = extractStars(palace, 'major');
      const starNames = majorStars.map(s => s.name);
      
      // 紫府同宫
      if (starNames.includes('紫微') && starNames.includes('天府')) {
        patterns.push({
          name: '紫府同宫',
          palace: palace.name,
          description: '帝王之象，最为吉利的格局',
          level: '上上吉'
        });
      }
      
      // 机梁同宫  
      if (starNames.includes('天机') && starNames.includes('天梁')) {
        patterns.push({
          name: '机梁同宫',
          palace: palace.name,
          description: '智慧与慈祥并具，适合教育、咨询行业',
          level: '上吉'
        });
      }
      
      // 日月同宫
      if (starNames.includes('太阳') && starNames.includes('太阴')) {
        patterns.push({
          name: '日月同宫',
          palace: palace.name,
          description: '光辉照耀，主贵、名声显赫',
          level: '上吉'
        });
      }
    });
    
  } catch (error) {
    patterns.push({
      name: '分析错误',
      description: '格局分析出现错误: ' + error.message
    });
  }
  
  return patterns.length > 0 ? patterns : [{
    name: '无特殊格局',
    description: '未检测到明显的特殊格局'
  }];
}

// 三方四正分析
function analyzeTriangularRelationships(astrolabeData) {
  try {
    const palaces = getPalaceData(astrolabeData);
    if (!palaces || palaces.length === 0) {
      throw new Error('无效的宫位数据');
    }

    const analysis = {
      summary: '三方四正关系分析：通过分析相关宫位的星曜配置，了解各领域的综合运势',
      triangular_patterns: analyzeTriangularPatterns(palaces),
      square_relationships: analyzeSquareRelationships(palaces),
      power_distribution: analyzePowerDistribution(palaces),
      fortune_flow: analyzeFortuneFlow(palaces),
      comprehensive_score: calculateComprehensiveScore(palaces)
    };

    return analysis;
  } catch (error) {
    return {
      summary: '三方四正分析遇到错误',
      error: error.message,
      triangular_patterns: [],
      square_relationships: [],
      power_distribution: {},
      fortune_flow: {},
      comprehensive_score: 0
    };
  }
}

// 获取宫位数据的统一函数
function getPalaceData(astrolabeData) {
  if (astrolabeData.palace_data) {
    return astrolabeData.palace_data;
  } else if (astrolabeData.astrolabe && astrolabeData.astrolabe.palaces) {
    return astrolabeData.astrolabe.palaces;
  } else if (astrolabeData.palaces) {
    return astrolabeData.palaces;
  }
  return [];
}

// 分析三方关系模式
function analyzeTriangularPatterns(palaces) {
  const triangularSets = [
    {
      name: '命身三方',
      description: '决定个人基本运势和性格的核心三角',
      palaces: ['命宫', '财帛', '迁移'],
      focus: '个人发展、财运、外在表现'
    },
    {
      name: '事业三方', 
      description: '影响事业发展和财富积累的重要三角',
      palaces: ['官禄', '财帛', '田宅'],
      focus: '事业成就、收入来源、资产积累'
    },
    {
      name: '感情三方',
      description: '关系到婚姻感情和家庭和谐的情感三角', 
      palaces: ['夫妻', '子女', '父母'],
      focus: '夫妻关系、子女缘分、长辈关系'
    },
    {
      name: '健康三方',
      description: '身心健康和精神状态的三角关系',
      palaces: ['疾厄', '父母', '兄弟'],
      focus: '身体健康、精神状态、人际支持'
    }
  ];

  return triangularSets.map(set => {
    const palaceAnalysis = set.palaces.map(palaceName => {
      const palace = palaces.find(p => p.name === palaceName);
      if (!palace) {
        return {
          name: palaceName,
          stars: [],
          major_stars: [],
          minor_stars: [],
          tough_stars: [],
          analysis: '宫位不存在或数据缺失',
          score: 0
        };
      }
      return analyzeSinglePalace(palace, palaceName);
    }).filter(p => p !== null);

    const combinedScore = calculateTriangleScore(palaceAnalysis);
    const starInteraction = analyzeStarInteractions(palaceAnalysis);
    const strengthAnalysis = analyzeTriangleStrength(palaceAnalysis);

    return {
      ...set,
      palace_analysis: palaceAnalysis,
      combined_score: combinedScore,
      strength_level: strengthAnalysis.level,
      star_interactions: starInteraction,
      interpretation: generateTriangleInterpretation(set.name, combinedScore, starInteraction),
      recommendations: generateTriangleRecommendations(set.name, strengthAnalysis)
    };
  });
}

// 分析四正关系
function analyzeSquareRelationships(palaces) {
  const squareAnalysis = [];
  
  // 十二宫位的对宫关系
  const oppositeMap = {
    '命宫': '迁移', '迁移': '命宫',
    '兄弟': '奴仆', '奴仆': '兄弟', 
    '夫妻': '官禄', '官禄': '夫妻',
    '子女': '田宅', '田宅': '子女',
    '财帛': '福德', '福德': '财帛',
    '疾厄': '父母', '父母': '疾厄'
  };

  // 分析每个宫位的四正关系
  palaces.forEach(palace => {
    const oppositePalaceName = oppositeMap[palace.name];
    const oppositePalace = palaces.find(p => p.name === oppositePalaceName);
    
    const mainAnalysis = analyzeSinglePalace(palace, palace.name);
    let oppositeAnalysis;
    
    if (oppositePalace) {
      oppositeAnalysis = analyzeSinglePalace(oppositePalace, oppositePalaceName);
    } else {
      oppositeAnalysis = {
        name: oppositePalaceName,
        stars: [],
        major_stars: [],
        minor_stars: [],
        tough_stars: [],
        analysis: '对宫数据缺失，无法进行完整分析',
        score: 0
      };
    }
    
    const relationship = {
      main_palace: {
        name: palace.name,
        analysis: mainAnalysis
      },
      opposite_palace: {
        name: oppositePalaceName,
        analysis: oppositeAnalysis
      },
      interaction_score: calculateOppositeInteraction(mainAnalysis, oppositeAnalysis),
      balance_analysis: analyzeOppositeBalance(mainAnalysis, oppositeAnalysis),
      conflict_resolution: generateConflictResolution(palace.name, oppositePalaceName, mainAnalysis, oppositeAnalysis)
    };
    
    squareAnalysis.push(relationship);
  });

  return squareAnalysis;
}

// 分析单个宫位
function analyzeSinglePalace(palace, palaceName) {
  const majorStars = extractStars(palace, 'major');
  const minorStars = extractStars(palace, 'soft');
  const toughStars = extractStars(palace, 'tough');
  
  return {
    palace_name: palaceName,
    major_stars: majorStars,
    minor_stars: minorStars,
    tough_stars: toughStars,
    strength: analyzePalaceStrength(palace),
    star_quality: calculateStarQuality(majorStars, minorStars, toughStars),
    mutagen_effects: extractMutagens(palace),
    dominant_element: getDominantElement(majorStars)
  };
}

// 计算三方分数
function calculateTriangleScore(palaceAnalysis) {
  let totalScore = 0;
  let validPalaces = 0;

  palaceAnalysis.forEach(palace => {
    if (palace && palace.strength && typeof palace.strength.score === 'number') {
      totalScore += palace.strength.score;
      validPalaces++;
    }
  });

  return validPalaces > 0 ? Math.round(totalScore / validPalaces * 10) / 10 : 0;
}

// 分析星曜相互作用
function analyzeStarInteractions(palaceAnalysis) {
  const allMajorStars = [];
  const interactions = [];

  palaceAnalysis.forEach(palace => {
    if (palace && palace.major_stars) {
      palace.major_stars.forEach(star => {
        allMajorStars.push({
          star: star.name,
          palace: palace.palace_name,
          brightness: star.brightness,
          mutagen: star.mutagen || ''
        });
      });
    }
  });

  // 寻找特殊星曜组合
  const starCombinations = findStarCombinations(allMajorStars);
  const mutagenInteractions = analyzeMutagenInteractions(allMajorStars);
  const brightnessHarmony = analyzeBrightnessHarmony(allMajorStars);

  return {
    total_major_stars: allMajorStars.length,
    special_combinations: starCombinations,
    mutagen_interactions: mutagenInteractions,
    brightness_harmony: brightnessHarmony,
    overall_harmony: calculateOverallHarmony(starCombinations, mutagenInteractions, brightnessHarmony)
  };
}

// 寻找特殊星曜组合
function findStarCombinations(stars) {
  const combinations = [];
  
  // 君臣庆会格
  const emperorStars = stars.filter(s => ['紫微', '天府', '太阳', '太阴'].includes(s.star));
  const ministerStars = stars.filter(s => ['天机', '天梁', '天相', '巨门'].includes(s.star));
  
  if (emperorStars.length >= 2 && ministerStars.length >= 1) {
    combinations.push({
      name: '君臣庆会格',
      description: '帝王星与重臣星聚会，主贵气十足',
      level: '上格',
      involved_stars: [...emperorStars.map(s => s.star), ...ministerStars.map(s => s.star)]
    });
  }

  // 杀破狼格局
  const killerStars = stars.filter(s => ['七杀', '破军', '贪狼'].includes(s.star));
  if (killerStars.length >= 2) {
    combinations.push({
      name: '杀破狼格局',
      description: '开创变化之格，主变动和机遇',
      level: '变格',
      involved_stars: killerStars.map(s => s.star)
    });
  }

  // 机月同梁格
  const wisdomStars = stars.filter(s => ['天机', '太阴', '天同', '天梁'].includes(s.star));
  if (wisdomStars.length >= 3) {
    combinations.push({
      name: '机月同梁格',
      description: '智慧慈祥之格，主文贵和福气',
      level: '福格',
      involved_stars: wisdomStars.map(s => s.star)
    });
  }

  return combinations;
}

// 分析四化相互作用
function analyzeMutagenInteractions(stars) {
  const mutagenStars = stars.filter(s => s.mutagen && s.mutagen !== '');
  const mutagenCount = {
    '禄': mutagenStars.filter(s => s.mutagen === '禄').length,
    '权': mutagenStars.filter(s => s.mutagen === '权').length,
    '科': mutagenStars.filter(s => s.mutagen === '科').length,
    '忌': mutagenStars.filter(s => s.mutagen === '忌').length
  };

  const interactions = [];

  // 三奇嘉会
  if (mutagenCount['禄'] >= 1 && mutagenCount['权'] >= 1 && mutagenCount['科'] >= 1) {
    interactions.push({
      name: '三奇嘉会',
      description: '禄权科三化齐聚，主富贵双全',
      type: '大吉',
      effect: '增强整体运势，名利双收'
    });
  }

  // 权忌相冲
  if (mutagenCount['权'] >= 1 && mutagenCount['忌'] >= 1) {
    interactions.push({
      name: '权忌相冲',
      description: '化权与化忌同现，主冲突与变化',
      type: '冲突',
      effect: '易有权力斗争，但也有突破机会'
    });
  }

  return {
    mutagen_distribution: mutagenCount,
    special_interactions: interactions,
    harmony_level: calculateMutagenHarmony(mutagenCount)
  };
}

// 计算四化和谐度
function calculateMutagenHarmony(mutagenCount) {
  const total = Object.values(mutagenCount).reduce((sum, count) => sum + count, 0);
  if (total === 0) return 'neutral';
  
  const ratio = {
    positive: (mutagenCount['禄'] + mutagenCount['权'] + mutagenCount['科']) / total,
    negative: mutagenCount['忌'] / total
  };
  
  if (ratio.positive >= 0.8) return 'very_positive';
  if (ratio.positive >= 0.6) return 'positive';  
  if (ratio.negative >= 0.6) return 'challenging';
  return 'balanced';
}

// 分析亮度和谐
function analyzeBrightnessHarmony(stars) {
  const brightnessMap = {
    '庙': 5, '旺': 4, '得': 3, '利': 2, '平': 1, '不': -1, '陷': -2
  };
  
  let totalScore = 0;
  let count = 0;
  
  stars.forEach(star => {
    if (star.brightness && brightnessMap[star.brightness] !== undefined) {
      totalScore += brightnessMap[star.brightness];
      count++;
    }
  });
  
  const averageScore = count > 0 ? totalScore / count : 0;
  
  let harmonyLevel;
  if (averageScore >= 3.5) harmonyLevel = 'excellent';
  else if (averageScore >= 2) harmonyLevel = 'good';
  else if (averageScore >= 0) harmonyLevel = 'fair';
  else harmonyLevel = 'challenging';
  
  return {
    average_brightness: averageScore,
    harmony_level: harmonyLevel,
    total_stars: count,
    distribution: calculateBrightnessDistribution(stars)
  };
}

// 计算亮度分布
function calculateBrightnessDistribution(stars) {
  const distribution = { '庙': 0, '旺': 0, '得': 0, '利': 0, '平': 0, '不': 0, '陷': 0 };
  
  stars.forEach(star => {
    if (star.brightness && distribution.hasOwnProperty(star.brightness)) {
      distribution[star.brightness]++;
    }
  });
  
  return distribution;
}

// 计算整体和谐度
function calculateOverallHarmony(combinations, mutagenInteractions, brightnessHarmony) {
  let score = 0;
  
  // 特殊组合加分
  combinations.forEach(combo => {
    if (combo.level === '上格') score += 3;
    else if (combo.level === '福格') score += 2;
    else if (combo.level === '变格') score += 1;
  });
  
  // 四化和谐度
  switch (mutagenInteractions.harmony_level) {
    case 'very_positive': score += 3; break;
    case 'positive': score += 2; break;
    case 'balanced': score += 1; break;
    case 'challenging': score -= 1; break;
  }
  
  // 亮度和谐度
  switch (brightnessHarmony.harmony_level) {
    case 'excellent': score += 2; break;
    case 'good': score += 1; break;
    case 'challenging': score -= 1; break;
  }
  
  if (score >= 6) return 'excellent';
  if (score >= 4) return 'very_good';
  if (score >= 2) return 'good';
  if (score >= 0) return 'fair';
  return 'challenging';
}

// 分析三方强度
function analyzeTriangleStrength(palaceAnalysis) {
  let totalStrength = 0;
  let validPalaces = 0;
  
  palaceAnalysis.forEach(palace => {
    if (palace && palace.strength && typeof palace.strength.score === 'number') {
      totalStrength += palace.strength.score;
      validPalaces++;
    }
  });
  
  const averageStrength = validPalaces > 0 ? totalStrength / validPalaces : 0;
  
  let level, description;
  if (averageStrength >= 4) {
    level = '极强';
    description = '三方星曜配置极佳，各方面都有很好的发展潜力';
  } else if (averageStrength >= 2) {
    level = '较强';
    description = '三方星曜配置良好，有不错的发展机会';
  } else if (averageStrength >= 0) {
    level = '中等';
    description = '三方星曜配置平平，需要通过努力来改善';
  } else if (averageStrength >= -2) {
    level = '较弱';
    description = '三方星曜配置较弱，需要特别注意相关方面的发展';
  } else {
    level = '极弱';
    description = '三方星曜配置不佳，该方面发展困难较大';
  }
  
  return {
    level: level,
    score: averageStrength,
    description: description,
    valid_palaces: validPalaces
  };
}

// 生成三方解释
function generateTriangleInterpretation(triangleName, score, interactions) {
  const baseInterpretations = {
    '命身三方': {
      high: '个人运势强劲，具备良好的发展基础和外在机遇，财运亨通',
      medium: '个人发展机会适中，需要积极把握外在环境带来的机会',
      low: '个人发展面临一些挑战，需要加强自身能力建设并谨慎理财'
    },
    '事业三方': {
      high: '事业运势极佳，官禄地位稳固，财源广进，适合投资置业',
      medium: '事业发展平稳，收入稳定，可适度投资但需谨慎',
      low: '事业发展阻力较大，收入不稳，宜保守理财避免大额投资'
    },
    '感情三方': {
      high: '感情生活和谐美满，家庭关系融洽，子女孝顺，长辈慈爱',
      medium: '感情关系总体稳定，偶有波折但可以化解',
      low: '感情方面需要更多经营，家庭关系需要用心维护'
    },
    '健康三方': {
      high: '身心健康状况良好，精神饱满，人际支持充足',
      medium: '健康状况一般，需要注意保养和人际关系的维护', 
      low: '健康方面需要特别关注，加强身心调理和寻求支持'
    }
  };
  
  let scoreLevel;
  if (score >= 3) scoreLevel = 'high';
  else if (score >= 0) scoreLevel = 'medium';
  else scoreLevel = 'low';
  
  const baseInterpretation = baseInterpretations[triangleName]?.[scoreLevel] || '需要综合分析具体情况';
  
  // 根据星曜互动调整解释
  let modifiedInterpretation = baseInterpretation;
  if (interactions.overall_harmony === 'excellent') {
    modifiedInterpretation += '，星曜配合极佳，发展潜力巨大';
  } else if (interactions.overall_harmony === 'challenging') {
    modifiedInterpretation += '，但需要注意星曜冲突带来的挑战';
  }
  
  return modifiedInterpretation;
}

// 生成三方建议
function generateTriangleRecommendations(triangleName, strengthAnalysis) {
  const recommendations = [];
  
  const baseRecommendations = {
    '命身三方': {
      high: ['充分发挥个人优势', '积极拓展人脉关系', '可考虑更高目标的追求'],
      medium: ['稳健发展个人事业', '适度拓展社交圈', '保持财务稳健'],
      low: ['专注提升自身能力', '谨慎处理人际关系', '保守理财避免风险']
    },
    '事业三方': {
      high: ['可考虑创业或投资机会', '积极争取晋升机会', '适时购置不动产'],
      medium: ['稳步推进事业发展', '适度投资理财', '维护工作关系'],
      low: ['专注本职工作', '避免高风险投资', '节约开支积累资本']
    },
    '感情三方': {
      high: ['珍惜现有的感情关系', '可考虑扩大家庭', '多关心长辈健康'],
      medium: ['用心经营感情关系', '平衡家庭和事业', '保持家庭和谐'],
      low: ['需要更多感情投入', '改善家庭沟通', '寻求专业帮助化解矛盾']
    },
    '健康三方': {
      high: ['保持良好的生活习惯', '适度运动增强体质', '多参与社交活动'],
      medium: ['定期体检预防疾病', '注意劳逸结合', '维护人际关系网'],
      low: ['及时就医处理健康问题', '减少压力调整心态', '寻求朋友支持']
    }
  };
  
  let strengthLevel;
  if (strengthAnalysis.score >= 2) strengthLevel = 'high';
  else if (strengthAnalysis.score >= 0) strengthLevel = 'medium'; 
  else strengthLevel = 'low';
  
  const applicableRecommendations = baseRecommendations[triangleName]?.[strengthLevel] || ['需要具体分析制定建议'];
  recommendations.push(...applicableRecommendations);
  
  return recommendations;
}

// 计算对宫相互作用分数
function calculateOppositeInteraction(mainAnalysis, oppositeAnalysis) {
  let interactionScore = 0;
  
  // 计算星曜强度差异
  const strengthDiff = Math.abs(
    (mainAnalysis.strength?.score || 0) - (oppositeAnalysis.strength?.score || 0)
  );
  
  // 强度差异越小，相互作用越和谐
  if (strengthDiff <= 1) interactionScore += 2;
  else if (strengthDiff <= 2) interactionScore += 1;
  else if (strengthDiff >= 4) interactionScore -= 1;
  
  // 检查四化相互影响
  const mainMutagens = mainAnalysis.mutagen_effects || [];
  const oppositeMutagens = oppositeAnalysis.mutagen_effects || [];
  
  mainMutagens.forEach(mutagen => {
    if (mutagen.mutagen === '禄' || mutagen.mutagen === '权' || mutagen.mutagen === '科') {
      interactionScore += 1;
    } else if (mutagen.mutagen === '忌') {
      interactionScore -= 1;
    }
  });
  
  oppositeMutagens.forEach(mutagen => {
    if (mutagen.mutagen === '禄' || mutagen.mutagen === '权' || mutagen.mutagen === '科') {
      interactionScore += 1;
    } else if (mutagen.mutagen === '忌') {
      interactionScore -= 1;
    }
  });
  
  return Math.max(-5, Math.min(5, interactionScore));
}

// 分析对宫平衡
function analyzeOppositeBalance(mainAnalysis, oppositeAnalysis) {
  const mainStrength = mainAnalysis.strength?.score || 0;
  const oppositeStrength = oppositeAnalysis.strength?.score || 0;
  
  const difference = mainStrength - oppositeStrength;
  
  let balanceType, description;
  
  if (Math.abs(difference) <= 1) {
    balanceType = '平衡';
    description = '两宫位力量均衡，相互支持，发展和谐';
  } else if (difference > 1) {
    balanceType = '主强';
    description = `${mainAnalysis.palace_name}较强，${oppositeAnalysis.palace_name}需要加强`;
  } else {
    balanceType = '对强';
    description = `${oppositeAnalysis.palace_name}较强，${mainAnalysis.palace_name}需要加强`;
  }
  
  return {
    type: balanceType,
    difference: difference,
    description: description,
    harmony_score: Math.max(0, 5 - Math.abs(difference))
  };
}

// 生成冲突化解建议
function generateConflictResolution(mainPalace, oppositePalace, mainAnalysis, oppositeAnalysis) {
  const resolutionMap = {
    '命宫-迁移': {
      conflict: '个人发展与外在环境的平衡',
      resolution: [
        '平衡内在修养与外在拓展',
        '根据运势选择进退时机',
        '内外兼修，稳中求进'
      ]
    },
    '财帛-福德': {
      conflict: '物质追求与精神享受的平衡',
      resolution: [
        '在追求财富的同时注重精神生活',
        '适度消费，享受生活品质',
        '财富与快乐并重，避免极端'
      ]
    },
    '夫妻-官禄': {
      conflict: '家庭生活与事业发展的平衡',
      resolution: [
        '合理安排工作与家庭时间',
        '寻求配偶对事业的支持和理解',
        '事业成功的同时维护婚姻关系'
      ]
    },
    '子女-田宅': {
      conflict: '子女教育与财产管理的平衡',
      resolution: [
        '在子女教育上适度投资',
        '平衡家庭支出与资产积累',
        '为子女创造良好的成长环境'
      ]
    },
    '兄弟-奴仆': {
      conflict: '兄弟朋友与下属关系的协调',
      resolution: [
        '公私分明，合理处理各种关系',
        '维护友谊的同时保持工作原则',
        '在人际交往中把握分寸'
      ]
    },
    '疾厄-父母': {
      conflict: '健康状况与长辈关系的影响',
      resolution: [
        '关注自身健康的同时孝顺长辈',
        '从长辈处获得健康养生智慧',
        '营造和谐的家庭健康环境'
      ]
    }
  };
  
  const key = `${mainPalace}-${oppositePalace}`;
  const reverseKey = `${oppositePalace}-${mainPalace}`;
  
  const resolution = resolutionMap[key] || resolutionMap[reverseKey] || {
    conflict: `${mainPalace}与${oppositePalace}的协调发展`,
    resolution: ['需要综合分析制定具体化解方案']
  };
  
  return resolution;
}

// 分析权力分布
function analyzePowerDistribution(palaces) {
  const powerAnalysis = {};
  
  // 分析各宫位的星曜权重
  palaces.forEach(palace => {
    const majorStars = extractStars(palace, 'major');
    const strength = analyzePalaceStrength(palace);
    
    powerAnalysis[palace.name] = {
      star_count: majorStars.length,
      strength_score: strength.score || 0,
      strength_level: strength.level || '未知',
      dominant_stars: majorStars.slice(0, 2).map(s => s.name)
    };
  });
  
  // 找出最强的宫位
  let maxStrength = -Infinity;
  let strongestPalace = '';
  
  Object.entries(powerAnalysis).forEach(([palaceName, analysis]) => {
    if (analysis.strength_score > maxStrength) {
      maxStrength = analysis.strength_score;
      strongestPalace = palaceName;
    }
  });
  
  return {
    palace_strengths: powerAnalysis,
    strongest_palace: strongestPalace,
    max_strength: maxStrength,
    power_balance_analysis: analyzePowerBalance(powerAnalysis)
  };
}

// 分析权力平衡
function analyzePowerBalance(powerAnalysis) {
  const strengths = Object.values(powerAnalysis).map(p => p.strength_score);
  const average = strengths.reduce((sum, score) => sum + score, 0) / strengths.length;
  const variance = strengths.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) / strengths.length;
  
  let balanceLevel;
  if (variance <= 1) balanceLevel = '非常平衡';
  else if (variance <= 4) balanceLevel = '较为平衡';
  else if (variance <= 9) balanceLevel = '略有偏重';
  else balanceLevel = '严重失衡';
  
  return {
    balance_level: balanceLevel,
    average_strength: Math.round(average * 10) / 10,
    variance: Math.round(variance * 10) / 10,
    interpretation: generateBalanceInterpretation(balanceLevel, variance)
  };
}

// 生成平衡解释
function generateBalanceInterpretation(balanceLevel, variance) {
  const interpretations = {
    '非常平衡': '各宫位发展均衡，人生各个方面都有稳定的基础',
    '较为平衡': '整体发展协调，偶有强弱差异但不影响大局',
    '略有偏重': '某些方面较为突出，需要注意平衡发展',
    '严重失衡': '发展严重不均，需要重点加强薄弱环节'
  };
  
  return interpretations[balanceLevel] || '需要具体分析平衡状况';
}

// 分析运势流向
function analyzeFortuneFlow(palaces) {
  const flowAnalysis = {
    positive_flow: [],
    negative_flow: [],
    neutral_flow: [],
    flow_patterns: []
  };
  
  // 分析各宫位的运势倾向
  palaces.forEach(palace => {
    const strength = analyzePalaceStrength(palace);
    const mutagens = extractMutagens(palace);
    
    let flowType = 'neutral';
    let flowStrength = 0;
    
    // 根据宫位强度判断
    if (strength.score > 2) {
      flowType = 'positive';
      flowStrength = strength.score;
    } else if (strength.score < -1) {
      flowType = 'negative';
      flowStrength = Math.abs(strength.score);
    }
    
    // 四化影响调整
    mutagens.forEach(mutagen => {
      switch (mutagen.mutagen) {
        case '禄':
          flowType = 'positive';
          flowStrength += 1;
          break;
        case '权':
          if (flowType === 'neutral') flowType = 'positive';
          flowStrength += 0.5;
          break;
        case '科':
          if (flowType === 'neutral') flowType = 'positive';
          flowStrength += 0.5;
          break;
        case '忌':
          flowType = 'negative';
          flowStrength += 1;
          break;
      }
    });
    
    const flowInfo = {
      palace: palace.name,
      type: flowType,
      strength: flowStrength,
      description: generateFlowDescription(palace.name, flowType, flowStrength)
    };
    
    flowAnalysis[`${flowType}_flow`].push(flowInfo);
  });
  
  // 识别流向模式
  flowAnalysis.flow_patterns = identifyFlowPatterns(flowAnalysis);
  
  return flowAnalysis;
}

// 生成流向描述
function generateFlowDescription(palaceName, flowType, strength) {
  const descriptions = {
    positive: {
      high: `${palaceName}运势极佳，是当前发展的重点优势领域`,
      medium: `${palaceName}运势良好，有不错的发展机会`,
      low: `${palaceName}运势平稳向好，适合稳步发展`
    },
    negative: {
      high: `${palaceName}运势较差，需要特别关注和改善`,
      medium: `${palaceName}运势略有阻碍，需要谨慎应对`,
      low: `${palaceName}运势稍有波折，保持警觉即可`
    },
    neutral: {
      default: `${palaceName}运势平稳，维持现状即可`
    }
  };
  
  if (flowType === 'neutral') {
    return descriptions.neutral.default;
  }
  
  let strengthLevel;
  if (strength >= 3) strengthLevel = 'high';
  else if (strength >= 1.5) strengthLevel = 'medium';
  else strengthLevel = 'low';
  
  return descriptions[flowType][strengthLevel] || `${palaceName}需要具体分析`;
}

// 识别流向模式
function identifyFlowPatterns(flowAnalysis) {
  const patterns = [];
  
  // 全面向好模式
  if (flowAnalysis.positive_flow.length >= 8 && flowAnalysis.negative_flow.length <= 2) {
    patterns.push({
      name: '全面向好',
      description: '整体运势强劲，各方面都有良好发展',
      recommendation: '充分把握机会，全面发展'
    });
  }
  
  // 重点突破模式
  else if (flowAnalysis.positive_flow.length >= 3 && flowAnalysis.positive_flow.length <= 6) {
    patterns.push({
      name: '重点突破',
      description: '部分领域运势突出，适合重点发展',
      recommendation: '集中优势资源，在强项上取得突破'
    });
  }
  
  // 守成维稳模式
  else if (flowAnalysis.neutral_flow.length >= 6) {
    patterns.push({
      name: '守成维稳',
      description: '运势平稳，适合守成和稳步发展',
      recommendation: '保持现状，稳中求进，避免冒险'
    });
  }
  
  // 化解困难模式
  else if (flowAnalysis.negative_flow.length >= 4) {
    patterns.push({
      name: '化解困难',
      description: '多个领域面临挑战，需要积极应对',
      recommendation: '优先解决问题，寻求外部支持'
    });
  }
  
  return patterns.length > 0 ? patterns : [{
    name: '混合发展',
    description: '运势有好有坏，需要具体分析',
    recommendation: '因地制宜，扬长避短'
  }];
}

// 计算综合分数
function calculateComprehensiveScore(palaces) {
  let totalScore = 0;
  let validPalaces = 0;
  
  palaces.forEach(palace => {
    const strength = analyzePalaceStrength(palace);
    if (strength && typeof strength.score === 'number') {
      totalScore += strength.score;
      validPalaces++;
    }
  });
  
  const baseScore = validPalaces > 0 ? totalScore / validPalaces : 0;
  
  // 根据特殊格局调整分数
  let adjustmentScore = 0;
  const specialPatterns = identifySpecialPatterns({ palace_data: palaces });
  
  specialPatterns.forEach(pattern => {
    if (pattern.level === '上上吉') adjustmentScore += 2;
    else if (pattern.level === '上吉') adjustmentScore += 1.5;
    else if (pattern.level === '上格') adjustmentScore += 1;
    else if (pattern.level === '福格') adjustmentScore += 0.5;
  });
  
  const finalScore = Math.max(0, Math.min(10, (baseScore + adjustmentScore + 5) * 10 / 10));
  
  return {
    base_score: Math.round(baseScore * 10) / 10,
    adjustment_score: adjustmentScore,
    final_score: Math.round(finalScore * 10) / 10,
    grade: getScoreGrade(finalScore),
    interpretation: getScoreInterpretation(finalScore)
  };
}

// 获取分数等级
function getScoreGrade(score) {
  if (score >= 8.5) return 'A+';
  if (score >= 7.5) return 'A';
  if (score >= 6.5) return 'B+';
  if (score >= 5.5) return 'B';
  if (score >= 4.5) return 'C+';
  if (score >= 3.5) return 'C';
  if (score >= 2.5) return 'D+';
  if (score >= 1.5) return 'D';
  return 'F';
}

// 获取分数解释
function getScoreInterpretation(score) {
  if (score >= 8.5) return '整体运势极佳，各方面发展都很理想';
  if (score >= 7.5) return '整体运势很好，大部分方面发展顺利';
  if (score >= 6.5) return '整体运势良好，多数方面有不错表现';
  if (score >= 5.5) return '整体运势中上，发展机会较多';
  if (score >= 4.5) return '整体运势中等，需要努力把握机会';
  if (score >= 3.5) return '整体运势偏下，需要更多努力';
  if (score >= 2.5) return '整体运势较差，面临一些挑战';
  if (score >= 1.5) return '整体运势不佳，需要谨慎应对';
  return '整体运势困难，需要特别关注和改善';
}

// 计算星曜质量
function calculateStarQuality(majorStars, minorStars, toughStars) {
  let qualityScore = 0;
  
  // 主星质量评估
  majorStars.forEach(star => {
    const brightness = star.brightness;
    switch (brightness) {
      case '庙': qualityScore += 5; break;
      case '旺': qualityScore += 4; break;
      case '得': qualityScore += 3; break;
      case '利': qualityScore += 2; break;
      case '平': qualityScore += 1; break;
      case '不': qualityScore -= 1; break;
      case '陷': qualityScore -= 2; break;
    }
    
    // 四化加成
    const mutagen = star.mutagen;
    switch (mutagen) {
      case '禄': qualityScore += 2; break;
      case '权': qualityScore += 1.5; break;
      case '科': qualityScore += 1; break;
      case '忌': qualityScore -= 1.5; break;
    }
  });
  
  // 吉星加分
  const luckyMinorStars = ['左辅', '右弼', '天魁', '天钺', '文昌', '文曲', '禄存'];
  minorStars.forEach(star => {
    if (luckyMinorStars.includes(star.name)) {
      qualityScore += 0.5;
    }
  });
  
  // 凶星减分
  const unluckyToughStars = ['擎羊', '陀罗', '火星', '铃星', '地空', '地劫'];
  toughStars.forEach(star => {
    if (unluckyToughStars.includes(star.name)) {
      qualityScore -= 0.5;
    }
  });
  
  return {
    score: Math.round(qualityScore * 10) / 10,
    level: getQualityLevel(qualityScore)
  };
}

// 获取质量等级
function getQualityLevel(score) {
  if (score >= 8) return '极优';
  if (score >= 5) return '优秀';
  if (score >= 2) return '良好';
  if (score >= 0) return '一般';
  if (score >= -2) return '偏差';
  return '较差';
}

// 获取主导元素
function getDominantElement(majorStars) {
  const elementMap = {
    '紫微': '土', '天机': '木', '太阳': '火', '武曲': '金',
    '天同': '水', '廉贞': '火', '天府': '土', '太阴': '水',
    '贪狼': '木', '巨门': '水', '天相': '水', '天梁': '土',
    '七杀': '金', '破军': '水'
  };
  
  const elementCount = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 };
  
  majorStars.forEach(star => {
    const element = elementMap[star.name];
    if (element) {
      elementCount[element]++;
    }
  });
  
  let dominantElement = '平衡';
  let maxCount = 0;
  
  Object.entries(elementCount).forEach(([element, count]) => {
    if (count > maxCount) {
      maxCount = count;
      dominantElement = element;
    }
  });
  
  return {
    element: dominantElement,
    count: maxCount,
    distribution: elementCount,
    interpretation: getElementInterpretation(dominantElement)
  };
}

// 获取元素解释
function getElementInterpretation(element) {
  const interpretations = {
    '金': '性格刚毅果断，有领导力，但可能过于严厉',
    '木': '性格温和柔韧，富有创造力，善于成长',
    '水': '性格灵活智慧，适应力强，但可能缺乏稳定性',
    '火': '性格热情积极，行动力强，但可能过于急躁',
    '土': '性格稳重务实，有包容力，但可能过于保守',
    '平衡': '五行平衡，性格较为全面，各方面发展均衡'
  };
  
  return interpretations[element] || '需要具体分析元素特质';
}

// 分析健康倾向
function analyzeHealthTendencies(healthPalace) {
  const tendencies = [];
  const allStars = getAllStars(healthPalace);
  
  allStars.forEach(star => {
    switch (star.name) {
      case '天机':
        tendencies.push('易有神经系统、肝胆方面问题');
        break;
      case '太阳':
        tendencies.push('注意心血管、眼部健康');
        break;
      case '太阴':
        tendencies.push('注意肾脏、妇科方面健康');
        break;
      case '武曲':
        tendencies.push('注意呼吸系统、骨骼健康');
        break;
      case '天同':
        tendencies.push('体质较好，但易有消化问题');
        break;
      case '擎羊':
        tendencies.push('易有外伤、手术、意外');
        break;
      case '陀罗':
        tendencies.push('易有慢性病、拖累性疾病');
        break;
      case '火星':
        tendencies.push('易有烧伤、发烧、烦躁');
        break;
      case '铃星':
        tendencies.push('易有暗病、隐性损害');
        break;
    }
  });
  
  return tendencies.length > 0 ? tendencies : ['健康状况较好，无明显不利因素'];
}

// 生成健康建议
function generateHealthAdvice(healthPalace) {
  const advice = [];
  const allStars = getAllStars(healthPalace);
  
  allStars.forEach(star => {
    switch (star.name) {
      case '天机':
        advice.push('保持作息规律，避免过度用脑');
        break;
      case '太阳':
        advice.push('注意防晒，定期检查心血管');
        break;
      case '擎羊':
      case '火星':
        advice.push('小心意外伤害，避免危险活动');
        break;
      case '陀罗':
        advice.push('耐心调理，定期体检');
        break;
    }
  });
  
  // 通用建议
  advice.push('均衡饮食，适度运动，保持心情愉悦');
  
  return advice;
}

function getCareerInfluence(starName, palace) {
  if (palace !== '官禄') return null;
  
  const careerInfluences = {
    '紫微': '适合管理、领导类工作，政府部门、大企业高管',
    '天机': '适合策划、咨询、IT、教育等智力密集型工作',
    '太阳': '适合公职、媒体、表演等需要曝光度的工作',
    '武曲': '适合金融、财务、军警等需要果断力的工作',
    '天同': '适合服务业、娱乐业等轻松愉快的工作',
    '廉贞': '适合司法、监察、纪检等需要公正性的工作'
  };

  return careerInfluences[starName] || '事业发展需要结合整体星盘分析';
}

function getWealthInfluence(starName, palace) {
  if (palace !== '财帛') return null;
  
  const wealthInfluences = {
    '紫微': '财运亨通，多为正财，地位带来财富',
    '武曲': '理财能力强，适合投资，偏财运佳',
    '天府': '积财能力强，财库丰厚，保守理财',
    '太阴': '财运平稳，善于储蓄，女性理财',
    '贪狼': '偏财运佳，投机性强，但需谨慎'
  };

  return wealthInfluences[starName] || '财运需要结合整体星盘分析';
}

function getRelationshipInfluence(starName, palace) {
  if (palace !== '夫妻') return null;
  
  const relationshipInfluences = {
    '紫微': '配偶地位高，婚姻稳定，夫妻关系和谐',
    '天机': '夫妻关系变化多，需要智慧经营',
    '太阳': '配偶正直光明，婚姻公开透明',
    '太阴': '配偶温柔体贴，感情细腻',
    '天同': '夫妻感情和睦，婚姻生活愉快',
    '廉贞': '感情专一，但易有波折'
  };

  return relationshipInfluences[starName] || '感情运势需要结合整体星盘分析';
}

function getPalaceMeaning(palaceName) {
  const meanings = {
    '命宫': '代表个人的性格、气质、能力和一生的基本运势',
    '兄弟': '代表兄弟姐妹关系、同事朋友关系',
    '夫妻': '代表婚姻感情、配偶情况',
    '子女': '代表子女状况、创造力、投资运',
    '财帛': '代表财运、理财能力、金钱观念',
    '疾厄': '代表健康状况、疾病灾厄',
    '迁移': '代表外出运势、人际关系、社交能力',
    '奴仆': '代表下属、朋友、合作伙伴关系',
    '官禄': '代表事业运势、工作状况、社会地位',
    '田宅': '代表家庭状况、房产、居住环境',
    '福德': '代表精神享受、福气、嗜好',
    '父母': '代表父母关系、长辈关系、学业'
  };

  return meanings[palaceName] || '该宫位含义需要进一步了解';
}

// ===== 财运分析相关函数 =====

function analyzeWealthPotential(majorStars) {
  if (!majorStars || majorStars.length === 0) {
    return '无主星，需参考对宫主星分析财运';
  }
  
  const wealthLevels = {
    '紫微': '上等财运，地位带来财富',
    '天府': '上等财运，天生财库，善于积累',
    '武曲': '上等财运，理财能力强，偏财运佳',
    '太阴': '中上财运，稳健理财，女性理财',
    '贪狼': '中等财运，偏财机会多，需谨慎',
    '天相': '中等财运，稳定收入',
    '天梁': '中等财运，长者之财',
    '七杀': '中下财运，波动较大',
    '破军': '中下财运，破财后重聚',
    '巨门': '下等财运，需靠口才赚钱',
    '廉贞': '下等财运，正财为主',
    '天机': '下等财运，智慧型收入',
    '天同': '下等财运，不愁吃穿但难大富',
    '太阳': '下等财运，阳性收入'
  };
  
  const potentials = majorStars.map(star => ({
    star: star.name,
    level: wealthLevels[star.name] || '需结合具体情况分析'
  }));
  
  return potentials;
}

function analyzeIncomeSource(majorStars) {
  const sources = [];
  
  majorStars.forEach(star => {
    switch (star.name) {
      case '紫微':
        sources.push('高级管理、政府职位、企业高管');
        break;
      case '武曲':
        sources.push('金融投资、理财顾问、实业经营');
        break;
      case '天府':
        sources.push('不动产、稳定投资、储蓄理财');
        break;
      case '太阳':
        sources.push('公职人员、媒体表演、阳光正大的行业');
        break;
      case '贪狼':
        sources.push('投机生意、娱乐行业、多元化经营');
        break;
      case '天机':
        sources.push('策划咨询、IT技术、智力服务');
        break;
      case '太阴':
        sources.push('女性相关行业、夜间经济、服务业');
        break;
      default:
        sources.push(`与${star.name}相关的行业收入`);
    }
  });
  
  return sources.length > 0 ? sources : ['需结合整体星盘分析收入来源'];
}

function generateFinancialAdvice(majorStars) {
  const advice = [];
  
  majorStars.forEach(star => {
    switch (star.name) {
      case '武曲':
        advice.push('善于理财投资，可考虑多元化投资组合');
        break;
      case '天府':
        advice.push('保守理财为佳，重视储蓄和不动产');
        break;
      case '贪狼':
        advice.push('投机心重，需控制风险，避免过度投机');
        break;
      case '七杀':
      case '破军':
        advice.push('财运波动大，需预留应急资金');
        break;
      case '太阴':
        advice.push('理财保守稳健，适合长期储蓄');
        break;
      case '天机':
        advice.push('适合智慧型投资，关注新兴行业');
        break;
    }
  });
  
  advice.push('建议制定理财计划，分散投资风险');
  return advice;
}

// ===== 事业分析相关函数 =====

function analyzeCareerDirection(majorStars) {
  const directions = [];
  
  majorStars.forEach(star => {
    switch (star.name) {
      case '紫微':
        directions.push('管理领导、政府机关、大企业高管');
        break;
      case '天机':
        directions.push('策划咨询、教育培训、IT科技');
        break;
      case '太阳':
        directions.push('公务员、媒体传播、表演艺术');
        break;
      case '武曲':
        directions.push('金融财务、军警司法、制造业');
        break;
      case '天同':
        directions.push('服务行业、娱乐休闲、社会福利');
        break;
      case '廉贞':
        directions.push('司法监察、纪检审计、医疗卫生');
        break;
      case '天府':
        directions.push('行政管理、财务会计、传统行业');
        break;
      case '太阴':
        directions.push('女性行业、服务业、艺术文化');
        break;
      case '贪狼':
        directions.push('销售营销、娱乐行业、多元发展');
        break;
      case '巨门':
        directions.push('传媒广告、法律顾问、研究分析');
        break;
      case '天相':
        directions.push('行政秘书、中介服务、协调管理');
        break;
      case '天梁':
        directions.push('教育培训、医疗卫生、社会服务');
        break;
      case '七杀':
        directions.push('军警武职、开拓创业、竞争性行业');
        break;
      case '破军':
        directions.push('创新行业、变革管理、开拓性工作');
        break;
    }
  });
  
  return directions.length > 0 ? directions : ['需结合整体星盘分析事业方向'];
}

function analyzeLeadershipPotential(majorStars) {
  let potential = 0;
  const analysis = [];
  
  majorStars.forEach(star => {
    switch (star.name) {
      case '紫微':
        potential += 5;
        analysis.push('天生的领导者，威严尊贵');
        break;
      case '太阳':
        potential += 4;
        analysis.push('光明正大的领导风格');
        break;
      case '武曲':
        potential += 4;
        analysis.push('果断决策，执行力强');
        break;
      case '七杀':
        potential += 4;
        analysis.push('威武刚强，适合开拓');
        break;
      case '天府':
        potential += 3;
        analysis.push('稳重保守的管理风格');
        break;
      case '破军':
        potential += 3;
        analysis.push('变革创新的领导能力');
        break;
      case '天机':
        potential += 2;
        analysis.push('智谋型领导，善于策划');
        break;
      case '天梁':
        potential += 2;
        analysis.push('慈祥长者风范，德高望重');
        break;
      case '天相':
        potential += 2;
        analysis.push('协调能力强，适合中层管理');
        break;
      default:
        potential += 1;
        analysis.push(`${star.name}的领导特质需要培养`);
    }
  });
  
  let level;
  if (potential >= 8) level = '极强';
  else if (potential >= 6) level = '很强';
  else if (potential >= 4) level = '较强';
  else if (potential >= 2) level = '一般';
  else level = '较弱';
  
  return {
    level: level,
    score: potential,
    analysis: analysis
  };
}

function generateCareerAdvice(majorStars) {
  const advice = [];
  
  majorStars.forEach(star => {
    switch (star.name) {
      case '紫微':
        advice.push('适合走管理路线，培养领导气质');
        break;
      case '天机':
        advice.push('善用智慧策划，适合幕僚或咨询工作');
        break;
      case '太阳':
        advice.push('可走公职路线，或需要曝光度的工作');
        break;
      case '武曲':
        advice.push('适合金融财务，或需要果断力的职位');
        break;
      case '七杀':
        advice.push('适合开拓创业，但需注意团队合作');
        break;
      case '破军':
        advice.push('适合变革创新，但要有持久力');
        break;
    }
  });
  
  advice.push('建议根据命盘配置选择最适合的发展方向');
  return advice;
}

// ===== 感情分析相关函数 =====

function analyzeRelationshipPattern(majorStars) {
  const patterns = [];
  
  majorStars.forEach(star => {
    switch (star.name) {
      case '紫微':
        patterns.push('配偶地位较高，婚姻关系稳定尊贵');
        break;
      case '天机':
        patterns.push('感情变化多，需要智慧经营');
        break;
      case '太阳':
        patterns.push('配偶正直光明，婚姻公开透明');
        break;
      case '武曲':
        patterns.push('配偶性格刚强，感情直接');
        break;
      case '天同':
        patterns.push('夫妻感情和睦，婚姻生活愉快');
        break;
      case '廉贞':
        patterns.push('感情专一但易有波折');
        break;
      case '天府':
        patterns.push('配偶稳重保守，婚姻稳定');
        break;
      case '太阴':
        patterns.push('配偶温柔体贴，感情细腻');
        break;
      case '贪狼':
        patterns.push('桃花运旺，但需注意专一');
        break;
      case '巨门':
        patterns.push('夫妻易有口角，需要沟通');
        break;
      case '天相':
        patterns.push('夫妻相敬如宾，关系和谐');
        break;
      case '天梁':
        patterns.push('配偶年长或成熟稳重');
        break;
      case '七杀':
        patterns.push('感情激烈，但易有冲突');
        break;
      case '破军':
        patterns.push('感情波折多，但真心相爱');
        break;
    }
  });
  
  return patterns.length > 0 ? patterns : ['需结合整体星盘分析感情模式'];
}

function analyzeMarriageTiming(flowerStars) {
  const timing = [];
  
  flowerStars.forEach(star => {
    switch (star.name) {
      case '红鸾':
        timing.push('红鸾入宫，婚期将至，适合结婚');
        break;
      case '天喜':
        timing.push('天喜入宫，喜事连连，婚姻吉利');
        break;
      case '天姚':
        timing.push('天姚入宫，桃花旺盛，感情机会多');
        break;
      case '咸池':
        timing.push('咸池入宫，异性缘佳，但需谨慎选择');
        break;
    }
  });
  
  return timing.length > 0 ? timing : ['桃花星较少，需耐心等待良缘'];
}

function generateRelationshipAdvice(majorStars, flowerStars) {
  const advice = [];
  
  // 基于主星的建议
  majorStars.forEach(star => {
    switch (star.name) {
      case '贪狼':
        advice.push('桃花运旺但需专一，避免感情纠纷');
        break;
      case '巨门':
        advice.push('夫妻沟通很重要，避免口角争执');
        break;
      case '七杀':
        advice.push('感情需要包容理解，控制脾气');
        break;
      case '破军':
        advice.push('珍惜来之不易的感情，患难见真情');
        break;
      case '天机':
        advice.push('用智慧经营感情，理解对方变化');
        break;
    }
  });
  
  // 基于桃花星的建议
  if (flowerStars.length > 0) {
    advice.push('桃花运较旺，需慎重选择合适的对象');
  } else {
    advice.push('桃花运较弱，建议主动出击或通过朋友介绍');
  }
  
  advice.push('建议以诚待人，用心经营感情关系');
  return advice;
}

function analyzeBasicPattern(astrolabeData) {
  try {
    const analysis = {
      analysis_type: '基本格局',
      summary: '根据命宫主星和整体星盘分布分析基本人格特质和运势格局',
      details: {}
    };

    // 获取命宫信息
    let lifePalace = null;
    if (astrolabeData.palace_data) {
      lifePalace = astrolabeData.palace_data.find(p => p.name === '命宫');
    } else if (astrolabeData.astrolabe && astrolabeData.astrolabe.palaces) {
      lifePalace = astrolabeData.astrolabe.palaces.find(p => p.name === '命宫');
    }

    if (lifePalace) {
      const majorStars = extractStars(lifePalace, 'major');
      analysis.details.life_palace = {
        major_stars: majorStars,
        pattern_analysis: analyzeStarPattern(majorStars),
        personality_summary: generatePersonalitySummary(majorStars)
      };
    }

    // 识别特殊格局
    analysis.details.special_patterns = identifySpecialPatterns(astrolabeData);
    
    // 三方四正分析
    analysis.details.triangular_analysis = analyzeTriangularRelationships(astrolabeData);
    
    return analysis;
  } catch (error) {
    return {
      analysis_type: '基本格局',
      summary: '基本格局分析遇到错误',
      error: error.message
    };
  }
}

function analyzeWealth(astrolabeData) {
  try {
    const analysis = {
      analysis_type: '财运分析',
      summary: '基于财帛宫和相关星曜分析财运状况',
      details: {}
    };

    // 获取财帛宫
    let wealthPalace = null;
    if (astrolabeData.palace_data) {
      wealthPalace = astrolabeData.palace_data.find(p => p.name === '财帛');
    } else if (astrolabeData.astrolabe && astrolabeData.astrolabe.palaces) {
      wealthPalace = astrolabeData.astrolabe.palaces.find(p => p.name === '财帛');
    }

    if (wealthPalace) {
      const majorStars = extractStars(wealthPalace, 'major');
      analysis.details.wealth_palace = {
        major_stars: majorStars,
        wealth_potential: analyzeWealthPotential(majorStars),
        income_sources: analyzeIncomeSource(majorStars),
        financial_advice: generateFinancialAdvice(majorStars)
      };
    }

    return analysis;
  } catch (error) {
    return {
      analysis_type: '财运分析',
      summary: '财运分析遇到错误',
      error: error.message
    };
  }
}

function analyzeCareer(astrolabeData) {
  try {
    const analysis = {
      analysis_type: '事业分析',
      summary: '基于官禄宫分析事业发展趋势',
      details: {}
    };

    // 获取官禄宫
    let careerPalace = null;
    if (astrolabeData.palace_data) {
      careerPalace = astrolabeData.palace_data.find(p => p.name === '官禄');
    } else if (astrolabeData.astrolabe && astrolabeData.astrolabe.palaces) {
      careerPalace = astrolabeData.astrolabe.palaces.find(p => p.name === '官禄');
    }

    if (careerPalace) {
      const majorStars = extractStars(careerPalace, 'major');
      analysis.details.career_palace = {
        major_stars: majorStars,
        career_direction: analyzeCareerDirection(majorStars),
        leadership_potential: analyzeLeadershipPotential(majorStars),
        career_advice: generateCareerAdvice(majorStars)
      };
    }

    return analysis;
  } catch (error) {
    return {
      analysis_type: '事业分析',
      summary: '事业分析遇到错误',
      error: error.message
    };
  }
}

function analyzeRelationship(astrolabeData) {
  try {
    const analysis = {
      analysis_type: '感情分析',
      summary: '基于夫妻宫分析感情运势',
      details: {}
    };

    // 获取夫妻宫
    let marriagePalace = null;
    if (astrolabeData.palace_data) {
      marriagePalace = astrolabeData.palace_data.find(p => p.name === '夫妻');
    } else if (astrolabeData.astrolabe && astrolabeData.astrolabe.palaces) {
      marriagePalace = astrolabeData.astrolabe.palaces.find(p => p.name === '夫妻');
    }

    if (marriagePalace) {
      const majorStars = extractStars(marriagePalace, 'major');
      const flowerStars = extractStars(marriagePalace, 'flower');
      
      analysis.details.marriage_palace = {
        major_stars: majorStars,
        flower_stars: flowerStars,
        relationship_pattern: analyzeRelationshipPattern(majorStars),
        marriage_timing: analyzeMarriageTiming(flowerStars),
        relationship_advice: generateRelationshipAdvice(majorStars, flowerStars)
      };
    }

    return analysis;
  } catch (error) {
    return {
      analysis_type: '感情分析',
      summary: '感情分析遇到错误',
      error: error.message
    };
  }
}

function analyzeHealth(astrolabeData) {
  try {
    const analysis = {
      analysis_type: '健康分析',
      summary: '基于疾厄宫分析健康状况',
      details: {}
    };

    // 获取疾厄宫
    let healthPalace = null;
    if (astrolabeData.palace_data) {
      healthPalace = astrolabeData.palace_data.find(p => p.name === '疾厄');
    } else if (astrolabeData.astrolabe && astrolabeData.astrolabe.palaces) {
      healthPalace = astrolabeData.astrolabe.palaces.find(p => p.name === '疾厄');
    }

    if (healthPalace) {
      analysis.details.health_palace = {
        stars: getAllStars(healthPalace),
        health_tendencies: analyzeHealthTendencies(healthPalace),
        prevention_advice: generateHealthAdvice(healthPalace)
      };
    }

    return analysis;
  } catch (error) {
    return {
      analysis_type: '健康分析',
      summary: '健康分析遇到错误',
      error: error.message
    };
  }
}

// ===== 新增的辅助函数 =====

// 提取星曜函数
function extractStars(palace, starType) {
  if (!palace) return [];
  
  // 支持多种数据格式
  let stars = [];
  
  if (palace.stars) {
    stars = palace.stars.filter(s => s.type === starType);
  } else {
    // iztro原生格式
    switch (starType) {
      case 'major':
        stars = palace.majorStars || [];
        break;
      case 'soft':
      case 'minor':
        stars = palace.minorStars || [];
        break;
      case 'tough':
        stars = palace.minorStars?.filter(s => 
          ['擎羊', '陀罗', '火星', '铃星', '地空', '地劫'].includes(s.name)
        ) || [];
        break;
      case 'adjective':
        stars = palace.adjectiveStars || [];
        break;
      case 'flower':
        stars = palace.minorStars?.filter(s => 
          ['红鸾', '天喜', '天姚', '咸池'].includes(s.name)
        ) || [];
        break;
      case 'helper':
        stars = palace.adjectiveStars?.filter(s => 
          ['解神', '年解', '天德', '月德'].includes(s.name)
        ) || [];
        break;
    }
  }
  
  return stars.map(s => ({
    name: s.name,
    brightness: s.brightness,
    mutagen: s.mutagen || ''
  }));
}

// 获取所有星曜
function getAllStars(palace) {
  if (!palace) return [];
  
  const allStars = [];
  const starTypes = ['major', 'soft', 'minor', 'tough', 'adjective', 'flower', 'helper'];
  
  starTypes.forEach(type => {
    const stars = extractStars(palace, type);
    allStars.push(...stars);
  });
  
  return allStars;
}

// 分析宫位强度
function analyzePalaceStrength(palace) {
  if (!palace) return '无法分析';
  
  const majorStars = extractStars(palace, 'major');
  const minorStars = extractStars(palace, 'soft');
  
  let strength = 0;
  let analysis = [];
  
  // 主星强度
  majorStars.forEach(star => {
    switch (star.brightness) {
      case '庙': strength += 5; analysis.push(`${star.name}庙旺，大吉`); break;
      case '旺': strength += 4; analysis.push(`${star.name}旺地，吉利`); break;
      case '得': strength += 3; analysis.push(`${star.name}得地，中吉`); break;
      case '利': strength += 2; analysis.push(`${star.name}利地，小吉`); break;
      case '平': strength += 1; analysis.push(`${star.name}平地，中性`); break;
      case '不': strength -= 1; analysis.push(`${star.name}不得地，略凶`); break;
      case '陷': strength -= 2; analysis.push(`${star.name}陷地，不利`); break;
    }
  });
  
  // 吉星加分
  const luckyStars = ['左辅', '右弼', '天魁', '天钺', '文昌', '文曲', '禄存'];
  minorStars.forEach(star => {
    if (luckyStars.includes(star.name)) {
      strength += 1;
      analysis.push(`${star.name}加会，增吉`);
    }
  });
  
  // 凶星减分
  const unluckyStars = ['擎羊', '陀罗', '火星', '铃星', '地空', '地劫'];
  minorStars.forEach(star => {
    if (unluckyStars.includes(star.name)) {
      strength -= 1;
      analysis.push(`${star.name}加会，增凶`);
    }
  });
  
  let strengthLevel;
  if (strength >= 5) strengthLevel = '极强';
  else if (strength >= 3) strengthLevel = '较强';
  else if (strength >= 1) strengthLevel = '中等';
  else if (strength >= -1) strengthLevel = '较弱';
  else strengthLevel = '极弱';
  
  return {
    level: strengthLevel,
    score: strength,
    analysis: analysis
  };
}

// 分析星曜影响
function analyzeStarsInfluence(palace, palaceName) {
  if (!palace) return [];
  
  const allStars = getAllStars(palace);
  return allStars.map(star => ({
    name: star.name,
    influence: getStarInfluence(star.name, palaceName),
    brightness_effect: getBrightnessEffect(star.brightness),
    mutagen_effect: getMutagenEffect(star.mutagen)
  }));
}

// 提取四化信息
function extractMutagens(palace) {
  if (!palace) return [];
  
  const allStars = getAllStars(palace);
  return allStars
    .filter(star => star.mutagen && star.mutagen !== '')
    .map(star => ({
      star: star.name,
      mutagen: star.mutagen,
      effect: getMutagenEffect(star.mutagen)
    }));
}

// 分析亮度
function analyzeBrightness(palace) {
  if (!palace) return [];
  
  const majorStars = extractStars(palace, 'major');
  return majorStars.map(star => ({
    star: star.name,
    brightness: star.brightness,
    effect: getBrightnessEffect(star.brightness)
  }));
}

// 获取四化效应
function getMutagenEffects(starName) {
  const effects = {
    '紫微': {
      '化禄': '增加地位声望，财运亨通',
      '化权': '领导力增强，权力欲强',
      '化科': '名声显赫，学问有成',
      '化忌': '地位不稳，易有是非'
    },
    '天机': {
      '化禄': '智慧变现为财富，善于策划',
      '化权': '决断力增强，计划能力突出',
      '化科': '才华显露，名气提升',
      '化忌': '多思多虑，易有焦虑'
    },
    '太阳': {
      '化禄': '正财运佳，地位提升',
      '化权': '领导欲强，权威显赫',
      '化科': '名声大器，受人尊敬',
      '化忌': '身体易有问题，心血管注意'
    }
    // ... 可以继续添加更多星曜
  };
  
  return effects[starName] || {
    '化禄': '增加财运',
    '化权': '增加权力',
    '化科': '增加名声',
    '化忌': '增加阻碍'
  };
}

// 获取亮度效应
function getBrightnessEffects(starName) {
  return {
    '庙': `${starName}在此宫位力量最强，大吉大利`,
    '旺': `${starName}在此宫位力量很强，吉利`,
    '得': `${starName}在此宫位力量较强，中吉`,
    '利': `${starName}在此宫位力量一般，小吉`,
    '平': `${starName}在此宫位力量中性，无特别影响`,
    '不': `${starName}在此宫位力量较弱，略有不利`,
    '陷': `${starName}在此宫位力量最弱，不利`
  };
}

// 获取组合效应
function getCombinationEffects(starName) {
  const combinations = {
    '紫微': {
      '天府': '紫府同宫，帝王之象，最为吉利',
      '天相': '紫相同宫，忠贞之象，吉利',
      '贪狼': '紫贪同宫，桃花皇帝，多才多艺',
      '破军': '紫破同宫，开创之力强，变化多',
      '七杀': '紫杀同宫，威权显赫，主武贵'
    },
    '天机': {
      '天梁': '机梁同宫，智慧与慈祥并具',
      '巨门': '机巨同宫，口才与智慧并重',
      '太阴': '机阴同宫，男命不吉，女命较好'
    },
    '太阳': {
      '太阴': '日月同宫，光辉照耀，吉利',
      '巨门': '日巨同宫，正直善辩，适合公职'
    }
    // 可以继续添加更多组合
  };
  
  return combinations[starName] || {};
}
