import { generateAstrolabe, getScopePalaces } from './astrolabe_helper.js';

// 本文件重写以提升可读性与结构化，但保持对外接口与功能不变：
// - 导出函数：synastryScore, interpretSynastryByPalace, renderSynastryText,
//              analyzeSynastryByUserInfo, analyzeSynastry
// - 输出结构、权重、阈值与文案均与原实现一致

// ==================
// 常量定义
// ==================

const PALACE_NAMES = ["疾厄", "财帛", "子女", "夫妻", "兄弟", "命宫", "父母", "福德", "田宅", "官禄", "仆役", "迁移"];

// 星曜集合
const MAJOR_14 = new Set(["紫微", "天机", "太阳", "武曲", "天同", "廉贞", "天府", "太阴", "贪狼", "巨门", "天相", "天梁", "七杀", "破军"]);
const SOFT = new Set(["左辅", "右弼", "天魁", "天钺", "文昌", "文曲"]);
const TOUGH = new Set(["擎羊", "陀罗", "火星", "铃星", "地空", "地劫"]);
const FLOWER = new Set(["红鸾", "天喜", "天姚", "咸池"]);
const HELPER = new Set(["解神", "年解", "月解"]);
const POS_ADJ = new Set(["天德", "月德", "天福", "三台", "八座", "恩光", "天贵", "天官", "台辅", "封诰", "龙池", "凤阁", "天才", "天厨"]);
const NEG_ADJ = new Set(["天空", "旬空", "空亡", "天刑", "阴煞", "天哭", "破碎", "小耗", "大耗", "伏兵", "官符", "病符"]);

// 星曜简义（用于NLG人话化）——与docs/ziwei_engine/config.py对齐
const STAR_BRIEF = {
  "紫微":"权柄统筹","天机":"机变策划","太阳":"光彩名誉","武曲":"财务执行","天同":"温和求稳","廉贞":"制度边界","天府":"守成聚财","太阴":"温润细腻","贪狼":"社交尝鲜","巨门":"口才是非","天相":"平衡协调","天梁":"庇护正直","七杀":"决断攻坚","破军":"变革重来",
  "左辅":"强势援助","右弼":"温柔后援","天魁":"领导贵气","天钺":"方案解题","文昌":"文书逻辑","文曲":"文艺表达",
  "擎羊":"刚猛冲突","陀罗":"顽固拖拽","火星":"急躁爆点","铃星":"惊扰敏感","地空":"理想落空","地劫":"破耗错失",
  "禄存":"俸禄保底","天马":"机动奔波",
  "红鸾":"端庄亲和","天喜":"活泼喜庆","天姚":"表现魅力","咸池":"风情吸引",
  "三台":"排场品位","八座":"荣耀享受","恩光":"礼遇情分","天贵":"小贵回馈","天官":"权位名器","台辅":"名声助力","封诰":"物质赏赐",
  "龙池":"技艺结构","凤阁":"审美设计","天才":"聪敏悟性","天厨":"美食品鉴",
  "解神":"化解援助","年解":"年度缓冲","月解":"月度缓冲","天德":"仁心稳重","月德":"温和包容","天福":"乐天随缘",
  "天空":"突发跳变","旬空":"潜能未发","空亡":"虚无迷茫","华盖":"哲思孤高",
  "天刑":"严肃边界","天哭":"悲情压力","天虚":"内耗纠结","阴煞":"忧郁退缩","破碎":"杂碎分散",
  "小耗":"小额消费","大耗":"大额破财","病符":"体弱病态","官符":"官非是非","伏兵":"多疑不安",
  "孤辰":"孤独清高","寡宿":"沉默内向",
  "长生":"好奇创新","沐浴":"心浮气躁","冠带":"血气方刚","临官":"独立自主","帝旺":"志得意满","衰":"老成理智","病":"思虑过多","死":"畏难情绪","墓":"低调节俭","绝":"消极冷淡","胎":"寻求变化","养":"希望好奇",
  "博士":"聪慧学识","力士":"执著勇猛","青龙":"执行反应","将军":"权力掌控","奏书":"文案理解","飞廉":"好奇表达","喜神":"喜庆拖延",
  "将星":"精神饱满","攀鞍":"短暂知名","岁驿":"变迁奔忙","息神":"意志消沉","劫煞":"精神压力","灾煞":"意外困扰","天煞":"长辈压力","指背":"背后议论","月煞":"女性压力","亡神":"丢三落四",
  "岁建":"年度开始","晦气":"情绪不稳","丧门":"悲观情绪","贯索":"束缚感重","龙德":"物质幸运","白虎":"冲动增强","吊客":"悲观加重",
  "天寿":"长寿养生","天伤":"离散伤感","天使":"生死循环","天月":"体弱阴湿","天巫":"第六直觉","蜚廉":"叛逆创意","截空":"阻隔考验","截路":"阻断绕行"
};

// 星曜权重配置
const BASE_WEIGHTS = {
  // 主星权重
  "紫微": 2.5, "天相": 2.0, "天府": 2.0, "太阳": 1.8, "太阴": 1.6,
  "天同": 1.6, "武曲": 1.5, "天机": 1.4, "天梁": 1.4, "巨门": 0.8,
  "七杀": 0.8, "贪狼": 0.6, "廉贞": 0.6, "破军": 0.5,
  // 六吉星
  "左辅": 1.2, "右弼": 1.2, "天魁": 1.2, "天钺": 1.2, "文昌": 1.2, "文曲": 1.2,
  // 六煞星（负权重）
  "擎羊": -1.5, "陀罗": -1.5, "火星": -1.5, "铃星": -1.5, "地空": -1.5, "地劫": -1.5,
  // 其他重要星曜
  "禄存": 1.4, "天马": 0.8
};

// 四化权重
const MUTAGEN_WEIGHTS = {
  "禄": 1.2, "权": 0.8, "科": 0.8, "忌": -1.6
};

// 动态权重
const FLOWER_WEIGHT = 0.8;
const HELPER_WEIGHT = 0.6;
const POS_ADJ_WEIGHT = 0.4;
const NEG_ADJ_WEIGHT = -0.6;

// 三方四正权重
const TRI_WEIGHTS = {
  "self": 0.7,   // 同宫
  "opp": 0.1,    // 对宫
  "tri1": 0.1,   // 三合之一
  "tri2": 0.1    // 三合之二
};

// 归一化参数
const NORM_PARAMS = {
  "center": 0.0,
  "spread": 8.0
};

// 亮度别名映射
const BRIGHTNESS_ALIASES = {
  "得地": "得", "利益": "利", "平和": "平", "不得地": "不", "不得": "不", "落陷": "陷", "庙旺": "庙"
};

// 亮度对正星的乘数
const BRIGHTNESS_POS_MULT = {
  "庙": 1.30, "旺": 1.20, "得": 1.08, "利": 1.03, "平": 1.00, "不": 0.60, "陷": -1.20
};

// 亮度对负星的乘数
const BRIGHTNESS_NEG_MULT = {
  "庙": 0.85, "旺": 0.90, "得": 0.95, "利": 0.98, "平": 1.00, "不": 1.10, "陷": 1.30
};

// 评分档位（闭开区间，最后一档上界取101以涵盖100）
const SYNASTRY_BINS = [
  ["相克", 0, 35], ["相冲", 35, 50], ["中性", 50, 60],
  ["相合", 60, 75], ["强合", 75, 85], ["共振", 85, 101]
];

// 档位建议文案
const BUCKET_TONE = {
  "相克": "冲突偏多，需规避关键决策。",
  "相冲": "摩擦与互补并存，建立互动规则更重要。", 
  "中性": "可做但别硬上，围绕具体主题再看组合。",
  "相合": "和谐互补，适合推进关键事项。",
  "强合": "高度匹配，建议升阶合作/关系。",
  "共振": "强同频，适合关键节点与共创。"
};

// 宫位建议配置
const PALACE_ADVICE = {
  "夫妻": {
    "pos": ["提升沟通频率，规划共同时间与仪式感。"],
    "neg": ["建立冲突降噪规则：冷静期/复盘/沟通边界。"],
    "neu": ["从小议题协作，逐步验证相处节奏。"]
  },
  "官禄": {
    "pos": ["明确分工与节奏，设立周迭代和月度复盘。"],
    "neg": ["明确权限与决策门槛，避免职责拉扯。"],
    "neu": ["小范围试合作，逐步扩大责任。"]
  },
  "财帛": {
    "pos": ["共拟预算与分配规则，设收益复盘。"],
    "neg": ["设止损线与上限，避免冲动投入。"],
    "neu": ["从小额试点开始校验资金规则。"]
  },
  "田宅": {
    "pos": ["可共建家庭资产/居住规划，明确产权边界。"],
    "neg": ["保持财产独立，避免高杠杆与长期绑定。"],
    "neu": ["从短期居住/资产安排试运行。"]
  },
  "父母": {
    "pos": ["建立与权威的正向沟通与汇报机制。"],
    "neg": ["隔离外部权威压力，内部先达成一致。"],
    "neu": ["约定对外口径，降低外部干扰。"]
  },
  "子女": {
    "pos": ["推进项目/育成计划，明确里程碑与质控。"],
    "neg": ["明确职责归属与质量门槛，避免扯皮。"],
    "neu": ["小步快跑，短周期评审与纠偏。"]
  },
  "迁移": {
    "pos": ["安排旅行/差旅/岗位轮换，增强共同体验。"],
    "neg": ["减少大幅变动，必要时先做短期尝试。"],
    "neu": ["短期流动尝试，评估适配度。"]
  },
  "疾厄": {
    "pos": ["建立健康习惯与风险缓释清单。"],
    "neg": ["避免高风险安排，设置预警与兜底。"],
    "neu": ["制定基础作息与体检提醒。"]
  },
  "兄弟": {
    "pos": ["利用社交与协同网络，扩大协作半径。"],
    "neg": ["避免圈层冲突，划清人际边界。"],
    "neu": ["小群试协作，逐步扩圈。"]
  },
  "福德": {
    "pos": ["强化价值观同频：共享语言与仪式。"],
    "neg": ["避免价值观争论，聚焦具体议题。"],
    "neu": ["围绕共同兴趣开展低风险活动。"]
  },
  "命宫": {
    "pos": ["鼓励优势表达，彼此赋能。"],
    "neg": ["尊重个体空间与界限，降低消耗。"],
    "neu": ["观察互动边界，逐步加深了解。"]
  }
};

// ==================
// 基础工具函数
// ==================

/**
 * 宫位导航函数
 */
function left(i) { return (i - 1 + 12) % 12; }
function right(i) { return (i + 1) % 12; }
function opp(i) { return (i + 6) % 12; }
function triIndices(i) { return [i, opp(i), (i + 4) % 12, (i + 8) % 12]; }

// ==================
// iztro 星盘解析辅助
// ==================

/**
 * 构建星盘映射表（仅支持iztro对象）
 */
function buildMaps(chart) {
  const palStars = {};
  const palMutagen = {};
  const nameToIdx = {};
  const idxToBranch = {};
  const idxToStem = {};

  for (let i = 0; i < 12; i++) {
    const palace = chart[i];
    
    nameToIdx[palace.name] = palace.index;
    idxToBranch[palace.index] = palace.earthlyBranch;
    idxToStem[palace.index] = palace.heavenlyStem;

    const stars = new Set();
    const muts = new Set();

    // 收集各类星曜
    for (const s of palace.majorStars || []) {
      stars.add(s.name);
      if (s.mutagen) muts.add(s.mutagen);
    }
    
    for (const s of palace.minorStars || []) {
      stars.add(s.name);
      if (s.mutagen) muts.add(s.mutagen);
    }
    
    for (const s of palace.adjectiveStars || []) {
      stars.add(s.name);
      if (s.mutagen) muts.add(s.mutagen);
    }

    palStars[palace.index] = stars;
    palMutagen[palace.index] = muts;
  }

  return { palStars, palMutagen, nameToIdx, idxToBranch, idxToStem };
}

/**
 * 构建亮度映射表（仅支持iztro对象）
 */
function buildBrightnessMap(chart) {
  const palBright = {};
  
  for (let i = 0; i < 12; i++) {
    const palace = chart[i];
    const mp = {};
    
    // 收集各类星曜的亮度
    const allStars = [
      ...(palace.majorStars || []),
      ...(palace.minorStars || []),
      ...(palace.adjectiveStars || [])
    ];
    
    for (const s of allStars) {
      if (s.name && s.brightness) {
        mp[s.name] = s.brightness;
      }
    }
    
    palBright[palace.index] = mp;
  }
  
  return palBright;
}

/**
 * 构建完整权重字典
 */
function buildWeightMap() {
  const weights = { ...BASE_WEIGHTS };
  
  // 添加动态权重
  for (const s of FLOWER) weights[s] = FLOWER_WEIGHT;
  for (const s of HELPER) weights[s] = HELPER_WEIGHT;
  for (const s of POS_ADJ) weights[s] = POS_ADJ_WEIGHT;
  for (const s of NEG_ADJ) weights[s] = NEG_ADJ_WEIGHT;
  
  return weights;
}

/**
 * 按地支同位叠加B的星曜到A的宫位
 */
function overlaySameBranch(AIdxToBranch, BIdxToBranch, BPalStars, BPalMut) {
  const overlayStars = {};
  const overlayMut = {};
  const bMap = {};
  
  // 构建B的地支→索引映射
  for (const [i, br] of Object.entries(BIdxToBranch)) {
    bMap[br] = parseInt(i);
  }
  
  // 按A的地支找B的对应宫位
  for (const [ai, abr] of Object.entries(AIdxToBranch)) {
    const bi = bMap[abr];
    const aiNum = parseInt(ai);
    
    if (bi === undefined) {
      overlayStars[aiNum] = new Set();
      overlayMut[aiNum] = new Set();
    } else {
      overlayStars[aiNum] = new Set(BPalStars[bi] || []);
      overlayMut[aiNum] = new Set(BPalMut[bi] || []);
    }
  }
  
  return { overlayStars, overlayMut };
}

/**
 * 归一化亮度标签
 */
function normalizeBrightnessLabel(br) {
  if (!br) return null;
  return BRIGHTNESS_ALIASES[br] || br;
}

/**
 * 应用亮度调整
 */
function applyBrightnessAdjust(w, br) {
  if (br === null || br === undefined) return w;
  
  const normalizedBr = normalizeBrightnessLabel(br);
  if (!normalizedBr) return w;
  
  if (w >= 0) {
    const mul = BRIGHTNESS_POS_MULT[normalizedBr] || 1.0;
    return w * mul;
  } else {
    const mul = BRIGHTNESS_NEG_MULT[normalizedBr] || 1.0;
    return w * mul;
  }
}

/**
 * 将B盘的亮度映射到与A盘同地支的宫位上
 */
function mapBrightnessByBranch(AIdxToBranch, BIdxToBranch, BBright) {
  const branchToBIdx = {};
  for (const [i, br] of Object.entries(BIdxToBranch)) {
    branchToBIdx[br] = parseInt(i);
  }
  const ABright = {};
  for (const [ai, abr] of Object.entries(AIdxToBranch)) {
    const bi = branchToBIdx[abr];
    const aiNum = parseInt(ai);
    ABright[aiNum] = (bi !== undefined && BBright[bi]) ? BBright[bi] : {};
  }
  return ABright;
}

/**
 * 计算单个宫位得分
 */
function scorePalace(i, BOnAStars, BOnAMut, weight = 1.0, nameByIdx = null, brightMap = null) {
  const tri = triIndices(i);
  const wMap = {
    [i]: TRI_WEIGHTS.self,
    [opp(i)]: TRI_WEIGHTS.opp,
    [(i + 4) % 12]: TRI_WEIGHTS.tri1,
    [(i + 8) % 12]: TRI_WEIGHTS.tri2
  };
  
  let pts = 0.0;
  const reasons = [];
  const baseW = buildWeightMap();
  
  for (const j of tri) {
    const jw = wMap[j] || 0.0;
    
    // 星曜分
    for (const s of BOnAStars[j] || []) {
      let br = null;
      if (brightMap && brightMap[j]) {
        br = brightMap[j][s];
      }
      
      const base = baseW[s] || 0.0;
      const adj = applyBrightnessAdjust(base, br);
      const inc = adj * jw * weight;
      
      if (Math.abs(inc) > 1e-9) {
        pts += inc;
        const ti = nameByIdx ? nameByIdx[i] : PALACE_NAMES[i];
        const tj = nameByIdx ? nameByIdx[j] : PALACE_NAMES[j];
        const brn = normalizeBrightnessLabel(br);
        
        if (br) {
          reasons.push(`${ti}←${tj}: B星[${s}|${brn}] *${jw.toFixed(1)} => ${inc.toFixed(2)}`);
        } else {
          reasons.push(`${ti}←${tj}: B星[${s}] *${jw.toFixed(1)} => ${inc.toFixed(2)}`);
        }
      }
    }
    
    // 四化分
    for (const m of BOnAMut[j] || []) {
      const inc = (MUTAGEN_WEIGHTS[m] || 0.0) * jw * weight;
      
      if (Math.abs(inc) > 1e-9) {
        pts += inc;
        const ti = nameByIdx ? nameByIdx[i] : PALACE_NAMES[i];
        const tj = nameByIdx ? nameByIdx[j] : PALACE_NAMES[j];
        reasons.push(`${ti}←${tj}: B化[${m}] *${jw.toFixed(1)} => ${inc.toFixed(2)}`);
      }
    }
  }
  
  return { pts, reasons };
}

/**
 * 归一化分数到0-100
 */
function normScore(x, center = null, spread = null) {
  if (center === null) center = NORM_PARAMS.center;
  if (spread === null) spread = NORM_PARAMS.spread;
  
  const z = (x - center) / (spread > 0 ? spread : 1.0);
  const sig = 1.0 / (1.0 + Math.exp(-z));
  return sig * 100.0;
}

/**
 * 根据分数判断档位
 */
function getBucket(x) {
  for (const [name, lo, hi] of SYNASTRY_BINS) {
    if (lo <= x && x < hi) {
      return name;
    }
  }
  return "中性";
}

// ==================
// 主要分析函数
// ==================

/**
 * 紫微斗数合盘评分
 * @param {Object} chartA - A方本命盘数据
 * @param {Object} chartB - B方本命盘数据
 * @returns {Object} 包含各宫位评分和详细分析的字典
 */
export function synastryScore(chartA, chartB) {
  // 解析星盘（A/B）
  const { palStars: AStars, palMutagen: AMut, nameToIdx: AN2I, idxToBranch: AI2B } = buildMaps(chartA);
  const { palStars: BStars, palMutagen: BMut, idxToBranch: BI2B } = buildMaps(chartB);

  // 按地支叠加：B→A
  const { overlayStars: BOnAStars, overlayMut: BOnAMut } = overlaySameBranch(AI2B, BI2B, BStars, BMut);

  // 索引→宫名映射
  const AI2N = Object.fromEntries(Object.entries(AN2I).map(([k, v]) => [v, k]));

  // B亮度按地支对齐到A
  const ABright = mapBrightnessByBranch(AI2B, BI2B, buildBrightnessMap(chartB));

  // 计算各宫位得分
  const palaceScores = {};
  const palaceReasons = {};
  for (const [pName, idx] of Object.entries(AN2I)) {
    const { pts, reasons } = scorePalace(idx, BOnAStars, BOnAMut, 1.0, AI2N, ABright);
    palaceScores[pName] = pts;
    palaceReasons[pName] = reasons;
  }

  const result = {
    palaces: palaceScores,
    explanations: { palaces: palaceReasons }
  };

  return result;
}

/**
 * 基于宫位的合盘解释
 */
export function interpretSynastryByPalace(result, minAbsEffect = 0.3, maxItemsPerPolarity = null) {
  const palRaw = result.palaces || {};
  const palExps = result.explanations?.palaces || {};
  
  const out = { palaces: {} };
  
  function parseInc(line) {
    if (!line.includes('=>')) return null;
    try {
      const incTxt = line.split('=>').pop().trim();
      return parseFloat(incTxt);
    } catch (e) {
      return null;
    }
  }
  
  function adviceFor(pal, bucket) {
    const posKeys = new Set(["相合", "强合", "共振"]);
    const negKeys = new Set(["相克", "相冲"]);
    
    let key = 'neu';
    if (posKeys.has(bucket)) key = 'pos';
    else if (negKeys.has(bucket)) key = 'neg';
    
    return PALACE_ADVICE[pal]?.[key] || [];
  }
  
  for (const [pal, raw] of Object.entries(palRaw)) {
    const lines = palExps[pal] || [];
    const posLinesWithV = [];
    const negLinesWithV = [];
    
    for (const ln of lines) {
      const v = parseInc(ln);
      if (v === null) continue;
      if (Math.abs(v) < minAbsEffect) continue;
      
      if (v > 0) {
        posLinesWithV.push([Math.abs(v), ln]);
      } else if (v < 0) {
        negLinesWithV.push([Math.abs(v), ln]);
      }
    }
    
    // 按影响力排序（从大到小）
    posLinesWithV.sort((a, b) => b[0] - a[0]);
    negLinesWithV.sort((a, b) => b[0] - a[0]);
    
    // 提取文本
    let posLines = posLinesWithV.map(x => x[1]);
    let negLines = negLinesWithV.map(x => x[1]);
    
    if (maxItemsPerPolarity !== null) {
      posLines = posLines.slice(0, maxItemsPerPolarity);
      negLines = negLines.slice(0, maxItemsPerPolarity);
    }
    
    const score = normScore(raw);
    const bucket = getBucket(score);
    
    out.palaces[pal] = {
      raw: raw,
      score: score,
      bucket: bucket,
      highlights: posLines,
      risks: negLines,
      advice: adviceFor(pal, bucket)
    };
  }
  
  return out;
}

/**
 * 生成自然语言合盘分析
 * @param {string} aName - A方姓名
 * @param {string} bName - B方姓名
 * @param {Object} synResult - synastryScore()的结果
 * @param {Object} interpResult - interpretSynastryByPalace()的结果
 * @returns {Object} 自然语言分析结果
 */
export function renderSynastryText(aName, bName, synResult, interpResult) {
  const palOut = [];
  const pals = interpResult.palaces || {};

  const NAME2IDX = Object.fromEntries(PALACE_NAMES.map((n, i) => [n, i]));
  function triNeighbors(i) { return [(i + 4) % 12, (i + 8) % 12]; }
  function relPos(sourcePal, targetPal) {
    if (!(sourcePal in NAME2IDX) || !(targetPal in NAME2IDX)) return '会照';
    const si = NAME2IDX[sourcePal], ti = NAME2IDX[targetPal];
    if (si === ti) return '同宫';
    if (si === opp(ti)) return '对宫照入';
    if (triNeighbors(ti).includes(si)) return '三方会照';
    return '他宫会照';
  }
  function parseEvidenceLine(line) {
    try {
      const idx = line.indexOf(':');
      if (idx === -1) return null;
      const left = line.slice(0, idx);
      const restRaw = line.slice(idx + 1);
      const parts = left.split('←');
      if (parts.length !== 2) return null;
      const target = parts[0].trim();
      const source = parts[1].trim();
      const rest = restRaw.trim();
      if (rest.startsWith('B星[')) {
        const token = rest.split('B星[')[1].split(']')[0];
        let name = token;
        let bright = null;
        if (token.includes('|')) {
          const parts = token.split('|');
          name = parts[0];
          bright = parts[1];
        }
        return { target, source, kind: 'star', name, bright };
      }
      if (rest.startsWith('B化[')) {
        const name = rest.split('B化[')[1].split(']')[0];
        return { target, source, kind: 'mut', name, bright: null };
      }
    } catch (e) {
      /* noop */
    }
    return null;
  }
  function humanizeReason(target, source, kind, name, polarity, bright) {
    const rel = relPos(source, target);
    if (kind === 'star') {
      const brief = STAR_BRIEF[name] || '';
      let tone;
      if (polarity === 'pos') {
        tone = (brief && brief.includes('援助')) ? '生助' : '增益';
      } else {
        tone = (name === '擎羊' || name === '陀罗') ? '相克' : '冲克';
      }
      const brn = normalizeBrightnessLabel(bright);
      const parts = [`${bName}的「${name}」`];
      if (brief) parts.push(`（${brief}）`);
      if (brn) parts.push(`（亮度：${brn}）`);
      const core = parts.join('');
      return `${core}${rel}到${aName}的「${target}」，${tone}。`;
    } else {
      const toneMap = { '禄': '生助', '权': '增强', '科': '调和', '忌': '冲克' };
      const meaning = { '禄': '财缘增益', '权': '权力推动', '科': '名望调和', '忌': '压力阻滞' }[name] || '';
      const tone = toneMap[name] || '影响';
      return `${bName}的化${name}${rel}到${aName}的「${target}」，${tone}（${meaning}）。`;
    }
  }
  function compactReasons(lines, polarity, limit = Number.MAX_SAFE_INTEGER) {
    const out = [];
    for (const line of lines.slice(0, limit)) {
      const parsed = parseEvidenceLine(line);
      if (!parsed) {
        const prefix = line.includes('=>') ? line.split('=>')[0].trim() : line;
        out.push(`${bName}对${aName}：${prefix}。`);
        continue;
      }
      const { target, source, kind, name, bright } = parsed;
      out.push(humanizeReason(target, source, kind, name, polarity, bright));
    }
    return out;
  }

  for (const [pal, info] of Object.entries(pals)) {
    const bucket = info.bucket || '中性';
    const tone = BUCKET_TONE[bucket] || '';
    const oneLiner = tone.endsWith('。') ? tone : `${tone}。`;
    const posHuman = compactReasons(info.highlights || [], 'pos');
    const negHuman = compactReasons(info.risks || [], 'neg');

    palOut.push({
      palace: pal,
      bucket: bucket,
      one_liner: oneLiner,
      positives: posHuman,
      risks: negHuman,
      advice: info.advice || []
    });
  }

  return { headline: `${aName} × ${bName}`, palaces: palOut };
}

/**
 * 通过用户信息进行合盘分析
 * @param {Object} params - 分析参数
 * @returns {Object} 合盘分析结果
 */
export async function analyzeSynastryByUserInfo({ 
  birth_date_a, birth_time_a, gender_a, city_a, name_a = "A",
  birth_date_b, birth_time_b, gender_b, city_b, name_b = "B",
  is_lunar_a = false, is_leap_a = false,
  is_lunar_b = false, is_leap_b = false,
  scope,
  query_date = null,
  min_abs_effect = 0.3,
  max_items_per_polarity = null,
  include_raw_data = false
}) {
  try {
    console.log(`合盘分析：${name_a} × ${name_b}`);
    const astroA = await generateAstrolabe({
      birth_date: birth_date_a,
      time: birth_time_a,
      gender: gender_a,
      city: city_a,
      is_lunar: is_lunar_a,
      is_leap: is_leap_a
    });

    const astroB = await generateAstrolabe({
      birth_date: birth_date_b,
      time: birth_time_b,
      gender: gender_b,
      city: city_b,
      is_lunar: is_lunar_b,
      is_leap: is_leap_b
    });

    let chartA, chartB;
    
    // 生成双方星盘
    if (scope === 'origin') {
      chartA = astroA.palaces;
      chartB = astroB.palaces;
    } else {
      const horoscopeA = astroA.horoscope(query_date);
      const horoscopeB = astroB.horoscope(query_date);
      chartA = getScopePalaces(horoscopeA, scope);
      chartB = getScopePalaces(horoscopeB, scope);
    }

    // 执行合盘分析
    const result = analyzeSynastry(chartA, chartB, name_a, name_b, {
      minAbsEffect: min_abs_effect,
      maxItemsPerPolarity: max_items_per_polarity,
      includeRawData: include_raw_data
    });
    
    return {
      success: true,
      data: result.data,
      message: `${name_a}与${name_b}的合盘分析完成`,
      time: new Date().toISOString()
    };
    
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
 * 完整的合盘分析接口
 * @param {Object} chartA - A方星盘数据
 * @param {Object} chartB - B方星盘数据
 * @param {string} nameA - A方姓名
 * @param {string} nameB - B方姓名
 * @param {Object} options - 可选参数
 * @returns {Object} 完整的合盘分析结果
 */
export function analyzeSynastry(chartA, chartB, nameA = "A", nameB = "B", options = {}) {
  const {
    minAbsEffect = 0.3,
    maxItemsPerPolarity = null,
    includeRawData = false
  } = options;
  
  try {
    // 1. 计算合盘评分
    const synResult = synastryScore(chartA, chartB);
    
    // 2. 解释分析
    const interpResult = interpretSynastryByPalace(synResult, minAbsEffect, maxItemsPerPolarity);
    
    // 3. 生成自然语言
    const textResult = renderSynastryText(nameA, nameB, synResult, interpResult);
    
    // 4. 构建完整结果
    const result = {
      summary: {
        headline: textResult.headline,
        total_palaces: Object.keys(interpResult.palaces).length
      },
      palaces: textResult.palaces,
      metadata: {
        analysis_time: new Date().toISOString(),
        min_effect_threshold: minAbsEffect
      }
    };
    
    // 可选包含原始数据
    if (includeRawData) {
      result.raw_data = {
        synastry_scores: synResult,
        interpretation: interpResult
      };
    }
    
    return {
      success: true,
      data: result
    };
    
  } catch (error) {
    return {
      success: false,
      error: `合盘分析失败: ${error.message}`
    };
  }
}
