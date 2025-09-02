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
 * @param {Object} astrolabe - iztro星盘对象
 * @returns {Object} - 宫位星曜、四化、名称和干支映射表
 */
function buildMaps(astrolabe) {
  const palStars = {};
  const palMutagen = {};
  const nameToIdx = {};
  const idxToBranch = {};
  const idxToStem = {};

  // 仅处理iztro astrolabe对象
  if (typeof astrolabe.palace !== 'function') {
    throw new Error('仅支持iztro astrolabe对象，请使用generateAstrolabe()生成的星盘数据');
  }

  for (let i = 0; i < 12; i++) {
    const palaceName = PALACE_NAMES[i];
    const palace = astrolabe.palace(palaceName);
    
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
 * Create a pattern hit result
 */
function hit(pid, name, strict, reason, involved) {
  return {
    id: pid,
    name: name,
    strict: strict,
    reason: reason,
    involved: involved
  };
}

// -------------------------
// Pattern Detectors
// -------------------------

/**
 * Main pattern detection function
 * @param {Object} astrolabe - The base astrolabe data (response["data"])
 * @param {Object} activeChart - Optional active chart data (十年/流年/流月/流日)
 * @returns {Array} List of detected patterns
 */
export function detectPatterns(astrolabe, activeChart = null) {
  const { palStars, palMutagen, nameToIdx, idxToBranch, idxToStem } = buildMaps(astrolabe);
  
  const ret = [];
  
  const iMing = nameToIdx["命宫"];
  const iCai = nameToIdx["财帛"];
  const iGuan = nameToIdx["官禄"];
  const iQian = nameToIdx["迁移"];
  const iLeft = _left(iMing);
  const iRight = _right(iMing);
  const iOppMing = _opp(iMing);
  const tri = [iMing, iCai, iGuan, iQian];

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
        `${PALACE_NAMES[i]}同宫见紫微+天府`, [PALACE_NAMES[i]]));
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
      ret.push(hit("liangma_piaodang", "梁马飘荡", true, `${PALACE_NAMES[i]}同宫天梁+天马`, [PALACE_NAMES[i]]));
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
      ret.push(hit("zhongshui_chaodong", "众水朝东", true, `${PALACE_NAMES[i]}同宫破军+文曲，支=${idxToBranch[i]}`, [PALACE_NAMES[i]]));
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
      ret.push(hit("luma_jiaochi", "禄马交驰", true, `${PALACE_NAMES[i]}同宫禄存+天马`, [PALACE_NAMES[i]]));
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
            `${PALACE_NAMES[i]}与对宫${PALACE_NAMES[j]}禄/马对拱`, [PALACE_NAMES[i], PALACE_NAMES[j]]));
          break;
        }
      }
    }
  }

  // 16 禄合鸳鸯（禄存 与 任一化禄 同宫；或对拱）
  const palaceHasHuaLu = (i) => palMutagen[i] && palMutagen[i].has("禄");
  
  for (let i = 0; i < 12; i++) {
    if ((palStars[i] || new Set()).has("禄存") && palaceHasHuaLu(i)) {
      ret.push(hit("luhe_yuanyang", "禄合鸳鸯", true, `${PALACE_NAMES[i]}同宫禄存+化禄`, [PALACE_NAMES[i]]));
      break;
    }
    const j = _opp(i);
    if ((palStars[i] || new Set()).has("禄存") && palaceHasHuaLu(j)) {
      ret.push(hit("luhe_yuanyang_weak", "禄合鸳鸯（对拱）", false, 
        `${PALACE_NAMES[i]}禄存 对拱 ${PALACE_NAMES[j]}化禄`, [PALACE_NAMES[i], PALACE_NAMES[j]]));
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
        `命宫明禄（禄存/化禄），暗合宫亦见禄（宫=${PALACE_NAMES[iDark]}）`,
        ["命宫", PALACE_NAMES[iDark]]));
    }
  }

  // 18 禄马佩印（任一宫：禄存+天马+天相 同宫）
  for (let i = 0; i < 12; i++) {
    if (starsIn(palStars, i, new Set(["禄存", "天马", "天相"]))) {
      ret.push(hit("luma_peiyin", "禄马佩印", true, `${PALACE_NAMES[i]}同宫禄存+天马+天相`, [PALACE_NAMES[i]]));
      break;
    }
  }

  // 19 两重华盖（命宫同见 禄存+化禄，再同宫遇 空/劫 之一）
  if ((palStars[iMing] || new Set()).has("禄存") && (palMutagen[iMing] || new Set()).has("禄") && 
      anyStarIn(palStars, iMing, new Set(["地空", "地劫"]))) {
    ret.push(hit("liangchong_huagai", "两重华盖", true, "命宫禄存+化禄并遇空/劫", ["命宫"]));
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
      ret.push(hit("zuoyou_tonggong", "左右同宫", true, `${PALACE_NAMES[i]}同宫左辅+右弼`, [PALACE_NAMES[i]]));
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
      `命宫见化科；暗合宫见禄（${PALACE_NAMES[iDark]}）`, ["命宫", PALACE_NAMES[iDark]]));
  }

  // 23 禄衰马困（运限判，需 activeChart）
  if (activeChart !== null) {
    const { palStars: aStars, palMutagen: aMut } = buildMaps(activeChart);
    
    // A: 禄衰——任一宫：禄存 与 耗/空/劫 同宫
    let aLuShuaiAny = false;
    for (let i = 0; i < 12; i++) {
      if ((aStars[i] || new Set()).has("禄存") && anyStarIn(aStars, i, KILL_OR_LOSS_SET)) {
        aLuShuaiAny = true;
        break;
      }
    }
    
    // B: 马困——任一宫：天马 与 煞忌 同宫（含 化忌）
    let aMaKunAny = false;
    for (let i = 0; i < 12; i++) {
      if ((aStars[i] || new Set()).has("天马") && 
          (anyStarIn(aStars, i, RESTRAINT_SET) || (aMut[i] && aMut[i].has("忌")))) {
        aMaKunAny = true;
        break;
      }
    }
    
    if (aLuShuaiAny && aMaKunAny) {
      ret.push(hit("lushuai_makun", "禄衰马困", true, "运盘同现：禄存遇耗/空/劫 + 天马遇煞/忌", ["运限盘"]));
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
