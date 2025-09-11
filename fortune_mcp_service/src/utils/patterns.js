/**
 * Zi Wei Dou Shu patterns rules for iztro astrolabe JSON.
 * Input: astrolabe dict = response["data"] from your MCP.
 * Output: list of detected patterns with strict/loose flags and reasons.
 * 
 * Reference of pattern definitions derived from:
 * - docs.iztro.com/learn/pattern （君臣庆会、紫府同宫、金舆扶驾、紫府夹命、极向离明 等）
 */

// -------------------------
// Constants and Data Sets
// -------------------------

const PALACE_NAMES = ["疾厄", "财帛", "子女", "夫妻", "兄弟", "命宫", "父母", "福德", "田宅", "官禄", "仆役", "迁移"];

const MAJOR_14 = new Set(["紫微", "天机", "太阳", "武曲", "天同", "廉贞", "天府", "太阴", "贪狼", "巨门", "天相", "天梁", "七杀", "破军"]);

const SHA_SET = new Set(["擎羊", "陀罗", "火星", "铃星", "地空", "地劫"]);

const KILL_OR_LOSS_SET = new Set(["天空", "地空", "旬空", "小耗", "大耗", "地劫"]); // 用于"禄衰"

const RESTRAINT_SET = new Set(["擎羊", "陀罗", "天刑", "阴煞"]); // 用于"马困"

// 暗合（古法"六合"镜像）：巳↔申、午↔未、卯↔戌、寅↔亥、丑↔子、辰↔酉
const DARK_PAIR = {
  "巳": "申", "申": "巳", "午": "未", "未": "午", "卯": "戌", "戌": "卯",
  "寅": "亥", "亥": "寅", "丑": "子", "子": "丑", "辰": "酉", "酉": "辰"
};

// -------------------------
// Utility Functions
// -------------------------

/**
 * Get palace index by name
 */
function _idxOfPal(nameToIdx, name) {
  return nameToIdx[name];
}

/**
 * Palace navigation helpers
 */
function _left(i) { return (i - 1 + 12) % 12; }
function _right(i) { return (i + 1) % 12; }
function _opp(i) { return (i + 6) % 12; }

/**
 * 构建星盘映射表（仅支持iztro对象）
 * @param {Object} chart - iztro chart(astrolabe, horoscope)对象
 * @returns {Object} - 宫位星曜、四化、名称和干支映射表
 */
function buildMaps(chart, scope) {
  const palStars = {};
  const palMutagen = {};
  const nameToIdx = {};
  const idxToName = {};
  const idxToBranch = {};
  const idxToStem = {};

  // 处理iztro astrolabe对象
  if (!scope) {
    for (let i = 0; i < 12; i++) {
      const palaceName = PALACE_NAMES[i];
      const palace = chart.palace(palaceName);

      nameToIdx[palace.name] = palace.index;
      idxToName[palace.index] = palace.name;
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
  } else {
    for (let i = 0; i < 12; i++) {
      const palaceName = PALACE_NAMES[i];
      const palace = chart.palace(palaceName, scope);

      nameToIdx[palaceName] = palace.index;
      idxToName[palace.index] = palaceName;
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
  }

  return { palStars, palMutagen, nameToIdx, idxToName, idxToBranch, idxToStem };
}

/**
 * Get tri-quartet palace indices (命宫三方四正：命、财、官、迁)
 */
function triQuartet(nameToIdx) {
  return [
    _idxOfPal(nameToIdx, "命宫"),
    _idxOfPal(nameToIdx, "财帛"),
    _idxOfPal(nameToIdx, "官禄"),
    _idxOfPal(nameToIdx, "迁移")
  ];
}

/**
 * Check if all stars in a set are present in a palace
 */
function starsIn(palStars, idx, stars) {
  const palaceStars = palStars[idx] || new Set();
  for (const star of stars) {
    if (!palaceStars.has(star)) {
      return false;
    }
  }
  return true;
}

/**
 * Check if any star from a set is present in a palace
 */
function anyStarIn(palStars, idx, stars) {
  const palaceStars = palStars[idx] || new Set();
  for (const star of stars) {
    if (palaceStars.has(star)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if palaces have no malefic stars or taboo transformations
 */
function noShaJi(palStars, palMutagen, idxs) {
  for (const i of idxs) {
    const stars = palStars[i] || new Set();
    const muts = palMutagen[i] || new Set();
    
    // Check for malefic stars
    for (const sha of SHA_SET) {
      if (stars.has(sha)) {
        return false;
      }
    }
    
    // Check for taboo transformation
    if (muts.has("忌")) {
      return false;
    }
  }
  return true;
}

/**
 * Find palace index by earthly branch
 */
function findPalByBranch(idxToBranch, targetBranch) {
  for (const [i, b] of Object.entries(idxToBranch)) {
    if (b === targetBranch) {
      return parseInt(i);
    }
  }
  return null;
}

/**
 * Get dark pair palace index
 */
function darkPairIndex(idxToBranch, idx) {
  const b = idxToBranch[idx];
  const peer = DARK_PAIR[b];
  if (!peer) return null;
  return findPalByBranch(idxToBranch, peer);
}

/**
 * Pattern copy mapping (group/title/blurb) aligned with Python config
 */
const PATTERN_COPY = {
  // 富贵格
  junchen_qinghui_A: {
    group: "富贵格",
    title: "君臣庆会A",
    blurb: "紫破同宫，左右辅弼分拱，主位与辅佐齐备，利权位与统筹。",
  },
  junchen_qinghui_B: {
    group: "富贵格",
    title: "君臣庆会B",
    blurb: "紫微天相坐命，命迁分见昌曲，科名与口碑相应，利名望与制度。",
  },
  junchen_qinghui_C: {
    group: "富贵格",
    title: "君臣庆会C",
    blurb: "天府坐命，左右会机梁与同阴，主从分明，资源稳健。",
  },
  zifu_tonggong: {
    group: "富贵格",
    title: "紫府同宫",
    blurb: "紫微天府同宫，统筹与守成并见，利大平台与稳态经营。",
  },
  jinyu_fujia: {
    group: "富贵格",
    title: "金舆扶驾",
    blurb: "天府守命，左右会日月，内外辅佐兼备，名器加身。",
  },
  zifu_jiaming: {
    group: "富贵格",
    title: "紫府夹命",
    blurb: "命坐机月，左右夹紫府，谋定而后动，得贵佐助。",
  },
  jixiang_liming: {
    group: "富贵格",
    title: "极向离明",
    blurb: "紫微在午会清局，权名昭著，忌三方煞忌冲破。",
  },
  // 五大格局（仅命/财/官三宫判断）
  big5_shapolang: {
    group: "五大格局",
    title: "杀破狼格",
    blurb: "动中求变、攻坚突破，宜开拓与竞技，忌情绪化对撞。",
  },
  big5_fuxiang: {
    group: "五大格局",
    title: "府相格",
    blurb: "稳重守成、执行见长，宜大组织内管控配合，稳中求进。",
  },
  big5_jiyue_tongliang: {
    group: "五大格局",
    title: "机月同梁格",
    blurb: "温和细致、专业匠心，按部就班，宜稳定岗位或自由才艺线。",
  },
  big5_ziwulian_fuxiang: {
    group: "五大格局",
    title: "紫武廉府相",
    blurb: "统筹驾驭与稳重并存，能主导亦能配合，宜高阶管理/政务统筹。",
  },
  big5_ziwulian_shapolang: {
    group: "五大格局",
    title: "紫武廉杀破狼",
    blurb: "能文能武、敢战能守，宜阶段化目标与护城河建设稳态推进。",
  },

  // 常见经典格局（节选）
  huotan: {
    group: "爆发格",
    title: "火贪",
    blurb: "贪狼会火，果敢激进，宜冲锋开拓，忌躁进损耗。",
  },
  lingtan: {
    group: "爆发格",
    title: "铃贪",
    blurb: "贪狼会铃，灵敏多变，宜创意试错，注意节奏与稳定。",
  },
  huo_or_ling_tan_weak: {
    group: "爆发格",
    title: "火/铃贪（弱）",
    blurb: "贪狼与火/铃三方会，动能较弱，适合阶段性试点。",
  },
  shapolang: {
    group: "事业格",
    title: "杀破狼",
    blurb: "变动开拓加速，适合攻坚重构，需制度化控险。",
  },
  yangliang_changlu: {
    group: "事业格",
    title: "阳梁昌禄",
    blurb: "名位俱隆，有制度与文书背书，利晋升与公开场域。",
  },
  sanqi_jiahui: {
    group: "财禄格",
    title: "三奇加会",
    blurb: "禄权科齐聚，资源/权责/名望共振，利关键节点。",
  },
  luma_jiaochi_weak: {
    group: "财禄格",
    title: "禄马交驰（弱）",
    blurb: "禄存与天马对拱/三方会，财动较弱，适合轻量外勤。",
  },
  luhe_yuanyang: {
    group: "财禄格",
    title: "禄合鸳鸯",
    blurb: "禄存同宫化禄，财源并合，利俸禄加成与回报兑现。",
  },
  luhe_yuanyang_weak: {
    group: "财禄格",
    title: "禄合鸳鸯（对拱）",
    blurb: "禄存对拱化禄，财缘相照，力度有限，循序推进。",
  },
  minglu_anlu: {
    group: "财禄格",
    title: "明禄暗禄",
    blurb: "命宫与暗合宫各见禄，明暗相辅，利隐性回报。",
  },
  luma_peiyin: {
    group: "财禄格",
    title: "禄马佩印",
    blurb: "禄存+天马+天相同宫，财动与名器并举，利差旅揽财。",
  },
  liangchong_huagai: {
    group: "财禄格",
    title: "两重华盖",
    blurb: "命宫禄存遇化禄并同宫空/劫，得而复失，宜谨慎理财。",
  },
  qisha_chaodou: {
    group: "事业格",
    title: "七杀朝斗",
    blurb: "七杀坐命（子午寅申），锋锐果断，宜攻坚突破与执法军警线。",
  },
  yingxing_rumiao: {
    group: "事业格",
    title: "英星入庙",
    blurb: "破军坐命（子/午），变革重来，宜重构升级，忌反复与冲毁。",
  },
  zhongshui_chaodong: {
    group: "事业格",
    title: "众水朝东",
    blurb: "破军会文曲（寅/卯），文武并举，利技术改造与内容重构。",
  },
  fubi_gongzhu: {
    group: "辅助格",
    title: "辅弼拱主",
    blurb: "左右拱紫，贵人助力强，利平台位与对外形象。",
  },
  fubi_gongzhu_weak: {
    group: "辅助格",
    title: "辅弼拱主（弱）",
    blurb: "紫微坐命，三方会左右辅弼，贵助较弱，重在协作体系。",
  },
  zuoyou_tonggong: {
    group: "辅助格",
    title: "左右同宫",
    blurb: "左辅右弼同宫，助力成双，利团队协作与执行落地。",
  },
  zuoyou_jiaming: {
    group: "辅助格",
    title: "左右夹命",
    blurb: "左右夹命，内外助力相随，宜发挥主位统筹。",
  },
  kuiyue_jiaming: {
    group: "辅助格",
    title: "魁钺夹命",
    blurb: "魁钺夹命，贵气与解题并见，利关键节点获提携。",
  },
  fuxiang_chaoyuan: {
    group: "辅助格",
    title: "府相朝垣",
    blurb: "命空而财官分坐天相/天府，配合得体，利大组织协作。",
  },
  keming_anlu: {
    group: "财禄格",
    title: "科明暗禄",
    blurb: "命见化科，暗合见禄，名财相辅，利口碑与回报。",
  },
  luma_jiaochi: {
    group: "财禄格",
    title: "禄马交驰",
    blurb: "俸禄与机动并举，利财务流转与外勤奔走。",
  },
  luma_jiaochi_hualu: {
    group: "四化格局",
    title: "禄马交驰（化禄）",
    blurb: "化禄遇天马，财动随行，异乡奔波中得财。",
  },
  luma_jiaochi_hualu_weak: {
    group: "四化格局",
    title: "禄马交驰（化禄，对拱）",
    blurb: "化禄与天马对拱，利外出求财，力度较弱。",
  },
  luma_jiaochi_hualu_tri: {
    group: "四化格局",
    title: "禄马交驰（化禄，三方）",
    blurb: "命三方会照化禄与天马，宜流动经营、远方拓财。",
  },
  liangma_piaodang: {
    group: "负面格",
    title: "梁马飘荡",
    blurb: "奔波不定、聚少散多，适合短期流动项目，避免长期绑定。",
  },

  // 基本盘/帝星相关
  ziwei_duzuo: {
    group: "基本盘",
    title: "紫微独坐",
    blurb: "帝星独座（子/午），自尊独立，午位更显庙势与统筹感。",
  },
  baiguan_chaogong: {
    group: "基本盘",
    title: "百官朝拱",
    blurb: "紫微坐命，三方成对吉星齐集（≥3对），贵气与援助俱足。",
  },
  zaiye_goujun: {
    group: "基本盘",
    title: "在野孤君",
    blurb: "紫微坐命，三方少吉亦无煞，清高独行，需自建体系。",
  },
  wudao_zhijun: {
    group: "基本盘",
    title: "无道之君",
    blurb: "紫微坐命，三方见煞/忌冲破，易骄矜误判，宜制衡控险。",
  },
  zipo_tonggong: {
    group: "基本盘",
    title: "紫破组合",
    blurb: "紫微+破军同宫（丑/未），先破后成，大器晚成，变革强。",
  },
  zitan_tonggong: {
    group: "基本盘",
    title: "紫贪组合",
    blurb: "紫微+贪狼同宫（卯/酉），欲望与权柄并行，需驾欲定边界。",
  },
  jiju_maoyou: {
    group: "基本盘",
    title: "极居卯酉",
    blurb: "紫贪同宫遇煞，贫贱之象加重，宜以三方吉化解。",
  },

  // 四化相关补充
  shuanglu_chaoyuan: {
    group: "四化格局",
    title: "双禄朝垣",
    blurb: "三方四正会照禄存与化禄，财运亨通，尤利财官两宫。",
  },
  shuanglu_chaoyuan_weak: {
    group: "四化格局",
    title: "双禄朝垣（宽）",
    blurb: "三方见双禄但有煞忌，财势受阻，宜保守运作。",
  },
  lu_feng_chongpo: {
    group: "四化格局",
    title: "禄逢冲破",
    blurb: "化禄遭空劫夹破或对宫化忌冲照，先得后失，虚发易破。",
  },
  lu_feng_chongpo_weak: {
    group: "四化格局",
    title: "禄逢冲破（宽）",
    blurb: "化禄同宫或单侧临空劫，财来财去，谨防破耗。",
  },
};

function getPatternCopy(pid) {
  return PATTERN_COPY[pid] || null;
}

/**
 * Create a pattern hit result, with optional copy fields
 */
function hit(pid, name, strict, reason, involved) {
  const item = {
    id: pid,
    // name: name,
    // strict: strict,
    reason: reason,
    // involved: involved,
  };
  const copy = getPatternCopy(pid);
  if (copy) {
    // item.group = copy.group;
    item.title = copy.title;
    item.blurb = copy.blurb;
  }
  return item;
}

// -------------------------
// Pattern Detectors
// -------------------------

/**
 * Main pattern detection function
 * @returns {Array} List of detected patterns
 */
export function detectPatterns(chart, scope = null) {
  const { palStars, palMutagen, nameToIdx, idxToName, idxToBranch, idxToStem } = buildMaps(chart, scope);
  
  const ret = [];
  
  const iMing = nameToIdx["命宫"];
  const iCai = nameToIdx["财帛"];
  const iGuan = nameToIdx["官禄"];
  const iQian = nameToIdx["迁移"];
  const iLeft = _left(iMing);
  const iRight = _right(iMing);
  const iOppMing = _opp(iMing);
  const tri = [iMing, iCai, iGuan, iQian];
  // “命盘五大格局”仅看命/财/官三宫主星组合（不含迁移）
  const tri3 = [iMing, iCai, iGuan];

  // ---------- 十二基本盘 / 帝星相关 ----------
  // A) 紫微独坐（子/午），限定同宫主星仅紫微
  const mingMajor = new Set([...(palStars[iMing] || new Set())].filter(s => MAJOR_14.has(s)));
  if (mingMajor.size === 1 && mingMajor.has("紫微") && ["子", "午"].includes(idxToBranch[iMing])) {
    ret.push(hit(
      "ziwei_duzuo", "紫微独坐", true,
      `紫微独坐于${idxToBranch[iMing]}支（同宫仅紫微）`,
      ["命宫"]
    ));
  }

  // B) 百官朝拱（紫微坐命，三方四正成对吉星 ≥3 对）
  if ((palStars[iMing] || new Set()).has("紫微")) {
    const triUnionTmp = new Set();
    for (const j of tri) for (const s of (palStars[j] || new Set())) triUnionTmp.add(s);
    const pairSets = [
      new Set(["天魁", "天钺"]), new Set(["文昌", "文曲"]), new Set(["左辅", "右弼"]),
      new Set(["三台", "八座"]), new Set(["恩光", "天贵"]), new Set(["台辅", "封诰"]), new Set(["天官", "天福"]) 
    ];
    let pairCount = 0;
    for (const ps of pairSets) {
      let ok = true;
      for (const st of ps) if (!triUnionTmp.has(st)) { ok = false; break; }
      if (ok) pairCount += 1;
    }
    if (pairCount >= 3) {
      ret.push(hit(
        "baiguan_chaogong", "百官朝拱", true,
        `紫微坐命，三方四正成对吉星≥3对（实际${pairCount}对）`,
        ["命/财/官/迁"]
      ));
    }

    // 在野孤君 / 无道之君（依据三方吉/煞）
    const goodSet = new Set(["天魁", "天钺", "文昌", "文曲", "左辅", "右弼", "三台", "八座", "恩光", "天贵", "台辅", "封诰", "天官", "天福"]);
    let hasGood = false;
    for (const j of tri) if ([...(palStars[j] || new Set())].some(s => goodSet.has(s))) { hasGood = true; break; }
    const hasShaOrJi = !noShaJi(palStars, palMutagen, tri);
    if (!hasGood && !hasShaOrJi) {
      ret.push(hit(
        "zaiye_goujun", "在野孤君", true,
        "紫微坐命，三方四正少吉亦无煞忌，会少而清高孤立",
        ["命/财/官/迁"]
      ));
    }
    if (hasShaOrJi) {
      ret.push(hit(
        "wudao_zhijun", "无道之君", true,
        "紫微坐命，三方四正见煞/忌冲破，易骄纵误判",
        ["命/财/官/迁"]
      ));
    }
  }

  // C) 紫破组合（紫微+破军同宫，支在丑/未）
  for (let i = 0; i < 12; i++) {
    if (starsIn(palStars, i, new Set(["紫微", "破军"])) && ["丑", "未"].includes(idxToBranch[i])) {
      ret.push(hit("zipo_tonggong", "紫破组合", true,
        `${idxToName[i]}同宫紫微+破军（${idxToBranch[i]}支）`, [idxToName[i]]));
      break;
    }
  }

  // D) 紫贪组合（紫微+贪狼同宫，支在卯/酉）及“极居卯酉”
  for (let i = 0; i < 12; i++) {
    if (starsIn(palStars, i, new Set(["紫微", "贪狼"])) && ["卯", "酉"].includes(idxToBranch[i])) {
      ret.push(hit("zitan_tonggong", "紫贪组合", true,
        `${idxToName[i]}同宫紫微+贪狼（${idxToBranch[i]}支）`, [idxToName[i]]));
      const triI = [i, _opp(i), (i + 4) % 12, (i + 8) % 12];
      if (!noShaJi(palStars, palMutagen, triI)) {
        ret.push(hit("jiju_maoyou", "极居卯酉", true,
          `紫贪同宫（${idxToBranch[i]}），三方四正见煞/忌`, [idxToName[i]]));
      }
      break;
    }
  }

  // 01 君臣庆会（3型，需三方四正无煞忌做严判）
  // A) 命：紫微+破军；左右分见左辅/右弼
  if (starsIn(palStars, iMing, new Set(["紫微", "破军"]))) {
    const leftHas = new Set([...palStars[iLeft]].filter(s => ["左辅", "右弼"].includes(s)));
    const rightHas = new Set([...palStars[iRight]].filter(s => ["左辅", "右弼"].includes(s)));
    
    if (leftHas.size > 0 && rightHas.size > 0) {
      const leftStar = [...leftHas][0];
      const rightStar = [...rightHas][0];
      if (leftStar !== rightStar) {
        const baseReason = "命宫同宫紫微+破军，左右分见左辅与右弼";
        if (noShaJi(palStars, palMutagen, tri)) {
          ret.push(hit("junchen_qinghui_A", "君臣庆会A", true, baseReason + "；三方无煞忌", ["命宫", "左右邻宫", "命/财/官/迁"]));
        } else {
          ret.push(hit("junchen_qinghui_A", "君臣庆会A", false, baseReason + "；但三方有煞忌（宽判）", ["命宫", "左右邻宫", "命/财/官/迁"]));
        }
      }
    }
  }

  // B) 命：紫微+天相；命与迁两端分见文昌/文曲（任意一端其一）
  if (starsIn(palStars, iMing, new Set(["紫微", "天相"]))) {
    const cond1 = (palStars[iMing] || new Set()).has("文昌") && (palStars[iQian] || new Set()).has("文曲");
    const cond2 = (palStars[iMing] || new Set()).has("文曲") && (palStars[iQian] || new Set()).has("文昌");
    
    if (cond1 || cond2) {
      const baseReason = "命宫紫微+天相，命↔迁两端分见文昌/文曲";
      if (noShaJi(palStars, palMutagen, tri)) {
        ret.push(hit("junchen_qinghui_B", "君臣庆会B", true, baseReason + "；三方无煞忌", ["命宫", "迁移", "命/财/官/迁"]));
      } else {
        ret.push(hit("junchen_qinghui_B", "君臣庆会B", false, baseReason + "；但三方有煞忌（宽判）", ["命宫", "迁移", "命/财/官/迁"]));
      }
    }
  }

  // C) 命：天府；左右各自包含（天机+天梁）与（天同+太阴）
  if ((palStars[iMing] || new Set()).has("天府")) {
    const leftOk = starsIn(palStars, iLeft, new Set(["天机", "天梁"]));
    const rightOk = starsIn(palStars, iRight, new Set(["天同", "太阴"]));
    
    if (leftOk && rightOk) {
      const baseReason = "命宫天府，左见天机+天梁，右见天同+太阴";
      if (noShaJi(palStars, palMutagen, tri)) {
        ret.push(hit("junchen_qinghui_C", "君臣庆会C", true, baseReason + "；三方无煞忌", ["命宫", "左右邻宫", "命/财/官/迁"]));
      } else {
        ret.push(hit("junchen_qinghui_C", "君臣庆会C", false, baseReason + "；但三方有煞忌（宽判）", ["命宫", "左右邻宫", "命/财/官/迁"]));
      }
    }
  }

  // 02 紫府同宫（任一宫紫微+天府同宫；典型只会出现在寅/申）
  for (let i = 0; i < 12; i++) {
    if (starsIn(palStars, i, new Set(["紫微", "天府"]))) {
      ret.push(hit("zifu_tonggong", "紫府同宫", true, 
        `${idxToName[i]}同宫见紫微+天府`, [idxToName[i]]));
      break;
    }
  }

  // 03 金舆扶驾（天府守命，左右合计有太阳与太阴；按文档此格只在丑/未可成）
  if ((palStars[iMing] || new Set()).has("天府")) {
    const moonSun = (
      ((palStars[iLeft] || new Set()).has("太阳") || (palStars[iRight] || new Set()).has("太阳")) &&
      ((palStars[iLeft] || new Set()).has("太阴") || (palStars[iRight] || new Set()).has("太阴"))
    );
    if (moonSun) {
      const strictBranch = ["丑", "未"].includes(idxToBranch[iMing]);
      ret.push(hit("jinyu_fujia", "金舆扶驾", strictBranch,
        `命宫天府，左右见日月；命支=${idxToBranch[iMing]}`,
        ["命宫", "左右邻宫"]));
    }
  }

  // 04 紫府夹命（命=天机+太阴；左右分别为天府与紫微）
  if (starsIn(palStars, iMing, new Set(["天机", "太阴"]))) {
    const condLr = (
      ((palStars[iLeft] || new Set()).has("天府") && (palStars[iRight] || new Set()).has("紫微")) ||
      ((palStars[iLeft] || new Set()).has("紫微") && (palStars[iRight] || new Set()).has("天府"))
    );
    if (condLr) {
      ret.push(hit("zifu_jiaming", "紫府夹命", true,
        "命宫天机+太阴，左右分见天府与紫微", ["命宫", "左右邻宫"]));
    }
  }

  // 05 极向离明（紫微坐命且命支=午；三方无煞为严判）
  if ((palStars[iMing] || new Set()).has("紫微") && idxToBranch[iMing] === "午") {
    const reason = "命宫紫微在午";
    if (noShaJi(palStars, palMutagen, tri)) {
      ret.push(hit("jixiang_liming", "极向离明", true, reason + "；三方无煞忌", ["命宫", "命/财/官/迁"]));
    } else {
      ret.push(hit("jixiang_liming", "极向离明", false, reason + "；但三方有煞忌（宽判）", ["命宫", "命/财/官/迁"]));
    }
  }

  // 06 火贪 / 铃贪（同宫为严，命三方强会照为宽）
  if ((palStars[iMing] || new Set()).has("贪狼")) {
    if ((palStars[iMing] || new Set()).has("火星")) {
      ret.push(hit("huotan", "火贪", true, "命宫同宫：贪狼+火星", ["命宫"]));
    } else if ((palStars[iMing] || new Set()).has("铃星")) {
      ret.push(hit("lingtan", "铃贪", true, "命宫同宫：贪狼+铃星", ["命宫"]));
    }
  }
  
  // 宽：三方有贪+火/铃（不要求同宫）
  const triUnion = new Set();
  for (const j of tri) {
    for (const star of palStars[j] || []) {
      triUnion.add(star);
    }
  }
  
  if (triUnion.has("贪狼") && (triUnion.has("火星") || triUnion.has("铃星"))) {
    ret.push(hit("huo_or_ling_tan_weak", "火/铃贪（弱）", false, "命三方四正会照：贪+火/铃", ["命/财/官/迁"]));
  }

  // 07 石中隐玉（巨门坐命且命支∈子/午）
  if ((palStars[iMing] || new Set()).has("巨门") && ["子", "午"].includes(idxToBranch[iMing])) {
    ret.push(hit("shizhong_yinyu", "石中隐玉", true, `巨门坐命，命支=${idxToBranch[iMing]}`, ["命宫"]));
  }

  // 08 梁马飘荡（任一宫：天梁+天马 同宫）
  for (let i = 0; i < 12; i++) {
    if (starsIn(palStars, i, new Set(["天梁", "天马"]))) {
      ret.push(hit("liangma_piaodang", "梁马飘荡", true, `${idxToName[i]}同宫天梁+天马`, [idxToName[i]]));
      break;
    }
  }

  // 09 阳梁昌禄（命三方四正集齐：太阳、天梁、文昌、禄存）
  const need = new Set(["太阳", "天梁", "文昌", "禄存"]);
  let hasAll = true;
  for (const star of need) {
    if (!triUnion.has(star)) {
      hasAll = false;
      break;
    }
  }
  if (hasAll) {
    ret.push(hit("yangliang_changlu", "阳梁昌禄", true, "命三方四正集齐：日/梁/昌/禄", ["命/财/官/迁"]));
  }

  // 10 杀破狼（命三方四正同时出现七杀/破军/贪狼）
  if (triUnion.has("七杀") && triUnion.has("破军") && triUnion.has("贪狼")) {
    ret.push(hit("shapolang", "杀破狼", true, "命三方四正集齐：七杀/破军/贪狼", ["命/财/官/迁"]));
  }

  // —— 五大格局（仅看命/财/官三宫主星） ——
  const tri3Union = new Set();
  for (const j of tri3) for (const s of (palStars[j] || new Set())) tri3Union.add(s);
  const tri3Major = new Set([...tri3Union].filter(s => MAJOR_14.has(s)));

  // A. 杀破狼格
  if (["七杀", "破军", "贪狼"].every(s => tri3Major.has(s))) {
    ret.push(hit(
      "big5_shapolang", "杀破狼格", true,
      "命/财/官三宫主星包含：七杀、破军、贪狼（三方互见）",
      ["命宫", "财帛", "官禄"]
    ));
  }
  // B. 府相格（仅见天府/天相两星，并且至少各见其一）
  const fuxiangSet = new Set(["天府", "天相"]);
  if (tri3Major.size > 0 && [...tri3Major].every(s => fuxiangSet.has(s)) && ([...tri3Major].some(s => s === "天府" || s === "天相"))) {
    ret.push(hit(
      "big5_fuxiang", "府相格", true,
      "命/财/官三宫主星仅由天府/天相构成（常见一宫空）",
      ["命宫", "财帛", "官禄"]
    ));
  }
  // C. 机月同梁格（仅见天机/太阴/天同/天梁，且至少出现其中三者）
  const jiyueSet = new Set(["天机", "太阴", "天同", "天梁"]);
  if (tri3Major.size >= 3 && [...tri3Major].every(s => jiyueSet.has(s))) {
    ret.push(hit(
      "big5_jiyue_tongliang", "机月同梁格", true,
      "命/财/官三宫主星由天机/太阴/天同/天梁构成（≥3种）",
      ["命宫", "财帛", "官禄"]
    ));
  }
  // D. 紫武廉府相
  const zwl = new Set(["紫微", "武曲", "廉贞"]);
  const fx = new Set(["天府", "天相"]);
  const hasZwl = [...tri3Major].some(s => zwl.has(s));
  const hasFx = [...tri3Major].some(s => fx.has(s));
  if (hasZwl && hasFx) {
    ret.push(hit(
      "big5_ziwulian_fuxiang", "紫武廉府相", true,
      "命/财/官三宫主星同时出现：紫微/武曲/廉贞 与 天府/天相",
      ["命宫", "财帛", "官禄"]
    ));
  }
  // E. 紫武廉杀破狼
  const spw = new Set(["七杀", "破军", "贪狼"]);
  const hasSpw = [...tri3Major].some(s => spw.has(s));
  if (hasZwl && hasSpw) {
    ret.push(hit(
      "big5_ziwulian_shapolang", "紫武廉杀破狼", true,
      "命/财/官三宫主星同时出现：紫微/武曲/廉贞 与 七杀/破军/贪狼",
      ["命宫", "财帛", "官禄"]
    ));
  }

  // 11 七杀朝斗（七杀坐命 且 命支∈子/午/寅/申）
  if ((palStars[iMing] || new Set()).has("七杀") && ["子", "午", "寅", "申"].includes(idxToBranch[iMing])) {
    ret.push(hit("qisha_chaodou", "七杀朝斗", true, `七杀坐命，命支=${idxToBranch[iMing]}`, ["命宫"]));
  }

  // 12 英星入庙（破军坐命 且 命支∈子/午）
  if ((palStars[iMing] || new Set()).has("破军") && ["子", "午"].includes(idxToBranch[iMing])) {
    ret.push(hit("yingxing_rumiao", "英星入庙", true, `破军坐命，命支=${idxToBranch[iMing]}`, ["命宫"]));
  }

  // 13 众水朝东（任一宫：破军+文曲 同宫，且支∈寅/卯）
  for (let i = 0; i < 12; i++) {
    if (starsIn(palStars, i, new Set(["破军", "文曲"])) && ["寅", "卯"].includes(idxToBranch[i])) {
      ret.push(hit("zhongshui_chaodong", "众水朝东", true, `${idxToName[i]}同宫破军+文曲，支=${idxToBranch[i]}`, [idxToName[i]]));
      break;
    }
  }

  // 14 三奇加会（命三方四正出现化禄/化权/化科）
  const hasLu = tri.some(j => palMutagen[j] && palMutagen[j].has("禄"));
  const hasQuan = tri.some(j => palMutagen[j] && palMutagen[j].has("权"));
  const hasKe = tri.some(j => palMutagen[j] && palMutagen[j].has("科"));
  
  if (hasLu && hasQuan && hasKe) {
    ret.push(hit("sanqi_jiahui", "三奇加会", true, "命三方四正见化禄/化权/化科", ["命/财/官/迁"]));
  }

  // 15 禄马交驰（任一宫：禄存+天马 同宫为严；对拱/三方仅作弱）
  let lmStrict = false;
  for (let i = 0; i < 12; i++) {
    if (starsIn(palStars, i, new Set(["禄存", "天马"]))) {
      ret.push(hit("luma_jiaochi", "禄马交驰", true, `${idxToName[i]}同宫禄存+天马`, [idxToName[i]]));
      lmStrict = true;
      break;
    }
  }
  
  if (!lmStrict) {
    // 弱：对拱或三方会
    for (let i = 0; i < 12; i++) {
      if ((palStars[i] || new Set()).has("禄存")) {
        const j = _opp(i);
        if ((palStars[j] || new Set()).has("天马")) {
          ret.push(hit("luma_jiaochi_weak", "禄马交驰（弱）", false, 
            `${idxToName[i]}与对宫${idxToName[j]}禄/马对拱`, [idxToName[i], idxToName[j]]));
          break;
        }
      }
    }
  }

  // 禄马交驰（化禄+天马 版本）
  // 严：同宫；弱：对拱或命三方内各自出现
  let hualuStrict = false;
  for (let i = 0; i < 12; i++) {
    if ((palMutagen[i] || new Set()).has("禄") && (palStars[i] || new Set()).has("天马")) {
      ret.push(hit("luma_jiaochi_hualu", "禄马交驰（化禄）", true,
        `${idxToName[i]}同宫化禄+天马`, [idxToName[i]]));
      hualuStrict = true;
      break;
    }
  }
  if (!hualuStrict) {
    for (let i = 0; i < 12; i++) {
      if ((palMutagen[i] || new Set()).has("禄")) {
        const j = _opp(i);
        if ((palStars[j] || new Set()).has("天马")) {
          ret.push(hit("luma_jiaochi_hualu_weak", "禄马交驰（化禄，对拱）", false,
            `${idxToName[i]}化禄 对拱 ${idxToName[j]}天马`, [idxToName[i], idxToName[j]]));
          hualuStrict = true;
          break;
        }
      }
    }
  }
  if (!hualuStrict) {
    const triHasHualu = tri.some(j => (palMutagen[j] || new Set()).has("禄"));
    const triHasMa = tri.some(j => (palStars[j] || new Set()).has("天马"));
    if (triHasHualu && triHasMa) {
      ret.push(hit("luma_jiaochi_hualu_tri", "禄马交驰（化禄，三方会）", false,
        "命三方四正会照：化禄 与 天马", ["命/财/官/迁"]));
    }
  }

  // 16 禄合鸳鸯（禄存 与 任一化禄 同宫；或对拱）
  const palaceHasHuaLu = (i) => palMutagen[i] && palMutagen[i].has("禄");
  
  for (let i = 0; i < 12; i++) {
    if ((palStars[i] || new Set()).has("禄存") && palaceHasHuaLu(i)) {
      ret.push(hit("luhe_yuanyang", "禄合鸳鸯", true, `${idxToName[i]}同宫禄存+化禄`, [idxToName[i]]));
      break;
    }
    const j = _opp(i);
    if ((palStars[i] || new Set()).has("禄存") && palaceHasHuaLu(j)) {
      ret.push(hit("luhe_yuanyang_weak", "禄合鸳鸯（对拱）", false, 
        `${idxToName[i]}禄存 对拱 ${idxToName[j]}化禄`, [idxToName[i], idxToName[j]]));
      break;
    }
  }

  // 17 明禄暗禄（命宫本位见"禄存或化禄"，暗合宫见另一禄）
  const iDark = darkPairIndex(idxToBranch, iMing);
  if (iDark !== null) {
    const mingHasMingLu = (palStars[iMing] || new Set()).has("禄存") || (palMutagen[iMing] || new Set()).has("禄");
    const darkHasAnLu = (palStars[iDark] || new Set()).has("禄存") || (palMutagen[iDark] || new Set()).has("禄");
    
    if (mingHasMingLu && darkHasAnLu) {
      ret.push(hit("minglu_anlu", "明禄暗禄", true,
        `命宫明禄（禄存/化禄），暗合宫亦见禄（宫=${idxToName[iDark]}）`,
        ["命宫", idxToName[iDark]]));
    }
  }

  // 18 禄马佩印（任一宫：禄存+天马+天相 同宫）
  for (let i = 0; i < 12; i++) {
    if (starsIn(palStars, i, new Set(["禄存", "天马", "天相"]))) {
      ret.push(hit("luma_peiyin", "禄马佩印", true, `${idxToName[i]}同宫禄存+天马+天相`, [idxToName[i]]));
      break;
    }
  }

  // 19 两重华盖（命宫同见 禄存+化禄，再同宫遇 空/劫 之一）
  if ((palStars[iMing] || new Set()).has("禄存") && (palMutagen[iMing] || new Set()).has("禄") && 
      anyStarIn(palStars, iMing, new Set(["地空", "地劫"]))) {
    ret.push(hit("liangchong_huagai", "两重华盖", true, "命宫禄存+化禄并遇空/劫", ["命宫"]));
  }

  // 19b 双禄朝垣（命三方四正内：禄存 与 化禄 同会；严判需三方无煞忌）
  const triHasLucun = tri.some(j => (palStars[j] || new Set()).has("禄存"));
  const triHasHualu = tri.some(j => (palMutagen[j] || new Set()).has("禄"));
  if (triHasLucun && triHasHualu) {
    const reason = "命三方四正会照：禄存 与 化禄";
    if (noShaJi(palStars, palMutagen, tri)) {
      ret.push(hit("shuanglu_chaoyuan", "双禄朝垣", true, reason + "；三方无煞忌", ["命/财/官/迁"]));
    } else {
      ret.push(hit("shuanglu_chaoyuan_weak", "双禄朝垣（宽）", false, reason + "；但三方有煞忌（宽判）", ["命/财/官/迁"]));
    }
  }

  // 20 辅弼拱主 / 左右同宫 / 左右夹命 / 魁钺夹命
  // 辅弼拱主：命有紫微，且左右夹（严）或三方会见左右（宽）
  if ((palStars[iMing] || new Set()).has("紫微")) {
    const lrStrict = (
      ((palStars[iLeft] || new Set()).has("左辅") && (palStars[iRight] || new Set()).has("右弼")) ||
      ((palStars[iRight] || new Set()).has("左辅") && (palStars[iLeft] || new Set()).has("右弼")) ||
      starsIn(palStars, iMing, new Set(["左辅", "右弼"]))
    );
    
    if (lrStrict) {
      ret.push(hit("fubi_gongzhu", "辅弼拱主", true, "命宫紫微，左右夹辅弼或同宫", ["命宫", "左右邻宫"]));
    } else if (triUnion.has("左辅") && triUnion.has("右弼")) {
      ret.push(hit("fubi_gongzhu_weak", "辅弼拱主（弱）", false, "命宫紫微，三方会辅弼", ["命/财/官/迁"]));
    }
  }

  // 左右同宫
  for (let i = 0; i < 12; i++) {
    if (starsIn(palStars, i, new Set(["左辅", "右弼"]))) {
      ret.push(hit("zuoyou_tonggong", "左右同宫", true, `${idxToName[i]}同宫左辅+右弼`, [idxToName[i]]));
      break;
    }
  }

  // 左右夹命
  if (((palStars[iLeft] || new Set()).has("左辅") && (palStars[iRight] || new Set()).has("右弼")) ||
      ((palStars[iRight] || new Set()).has("左辅") && (palStars[iLeft] || new Set()).has("右弼"))) {
    ret.push(hit("zuoyou_jiaming", "左右夹命", true, "左右邻宫分见左辅与右弼", ["左右邻宫"]));
  }

  // 魁钺夹命
  if (((palStars[iLeft] || new Set()).has("天魁") && (palStars[iRight] || new Set()).has("天钺")) ||
      ((palStars[iRight] || new Set()).has("天魁") && (palStars[iLeft] || new Set()).has("天钺"))) {
    ret.push(hit("kuiyue_jiaming", "魁钺夹命", true, "左右邻宫分见天魁与天钺", ["左右邻宫"]));
  }

  // 21 府相朝垣（命空宫；官禄坐天府，财帛坐天相）
  const mingMajorCount = [...(palStars[iMing] || new Set())].filter(s => MAJOR_14.has(s)).length;
  if (mingMajorCount === 0 && (palStars[iGuan] || new Set()).has("天府") && (palStars[iCai] || new Set()).has("天相")) {
    ret.push(hit("fuxiang_chaoyuan", "府相朝垣", true, "命空宫；官禄=天府，财帛=天相", ["命宫", "官禄", "财帛"]));
  }

  // 22 科明暗禄（命见化科；命之暗合宫见禄[禄存/化禄]）
  if ((palMutagen[iMing] || new Set()).has("科") && iDark !== null &&
      ((palStars[iDark] || new Set()).has("禄存") || (palMutagen[iDark] || new Set()).has("禄"))) {
    ret.push(hit("keming_anlu", "科明暗禄", true, 
      `命宫见化科；暗合宫见禄（${idxToName[iDark]}）`, ["命宫", idxToName[iDark]]));
  }

  // 23 禄衰马困（运限判）
  for (let i = 0; i < 12; i++) {
    if ((palStars[i] || new Set()).has("禄存") && anyStarIn(palStars, i, KILL_OR_LOSS_SET)) {
      for (let i = 0; i < 12; i++) {
        if ((palStars[i] || new Set()).has("天马") && (anyStarIn(palStars, i, RESTRAINT_SET) || (palMutagen[i] && palMutagen[i].has("忌")))) {
          ret.push(hit("lushuai_makun", "禄衰马困", true, "运盘同现：禄存遇耗/空/劫 + 天马遇煞/忌", ["运限盘"]));
          break;
        }
      }
    }
  }

  // 24 禄逢冲破（本命盘：任一宫化禄，被空/劫夹破 或 被对宫化忌冲照；弱：同宫见空/劫或单侧邻空/劫）
  for (let i = 0; i < 12; i++) {
    if ((palMutagen[i] || new Set()).has("禄")) {
      const L = _left(i);
      const R = _right(i);
      const J = _opp(i);
      const leftLoss = anyStarIn(palStars, L, new Set(["地空", "地劫"]));
      const rightLoss = anyStarIn(palStars, R, new Set(["地空", "地劫"]));
      const selfLoss = anyStarIn(palStars, i, new Set(["地空", "地劫"]));
      const oppJi = (palMutagen[J] || new Set()).has("忌");
      if ((leftLoss && rightLoss) || oppJi) {
        ret.push(hit(
          "lu_feng_chongpo", "禄逢冲破", true,
          `${idxToName[i]}化禄，` + (oppJi ? "对宫见化忌冲照" : "左右邻宫空/劫夹破"),
          [idxToName[i]]
        ));
        break;
      }
      if (selfLoss || leftLoss || rightLoss) {
        ret.push(hit(
          "lu_feng_chongpo_weak", "禄逢冲破（宽）", false,
          `${idxToName[i]}化禄，` + (selfLoss ? "同宫见空/劫" : "单侧邻宫空/劫"),
          [idxToName[i]]
        ));
        break;
      }
    }
  }

  return ret;
}

/**
 * Helper function to get all detected pattern names for easy checking
 * @param {Array} patterns - Array of pattern objects
 * @returns {Array} Array of pattern names
 */
export function getPatternNames(patterns) {
  return patterns.map(p => p.name);
}

/**
 * Helper function to get only strict patterns
 * @param {Array} patterns - Array of pattern objects
 * @returns {Array} Array of strict pattern objects
 */
export function getStrictPatterns(patterns) {
  return patterns.filter(p => p.strict);
}

/**
 * Helper function to get patterns by category (based on ID prefix)
 * @param {Array} patterns - Array of pattern objects
 * @param {string} category - Category prefix (e.g., 'junchen', 'zifu', 'luma')
 * @returns {Array} Array of matching pattern objects
 */
export function getPatternsByCategory(patterns, category) {
  return patterns.filter(p => p.id.startsWith(category));
}
