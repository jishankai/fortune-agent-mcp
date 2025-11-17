import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getPalace } from './tools/astrolabe.js';
import {
  getHoroscope,
  getYearlyHoroscope,
  getMonthlyHoroscope,
  getDailyHoroscope
} from './tools/horoscope.js';
import {
  analyzeSynastryByInfo,
  analyzeDecadalSynastryByInfo,
  analyzeYearlySynastryByInfo,
  analyzeMonthlySynastryByInfo,
  analyzeDailySynastryByInfo
} from './tools/synastry.js';
import { logger } from './utils/logger.js';

const PALACE_OPTIONS = ['命宫', '身宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '仆役', '官禄', '田宅', '福德', '父母', '来因'];

const sharedFields = {
  birth_date: z.string().describe('出生日期，格式：YYYY-MM-DD'),
  birth_time: z.string().describe('出生时间，格式：HH:mm'),
  gender: z.enum(['男', '女']).describe('性别'),
  city: z.string().describe('出生城市，用于经纬度查询和真太阳时计算'),
  is_lunar: z.boolean().optional().default(false).describe('是否为农历日期'),
  is_leap: z.boolean().optional().default(false).describe('是否为闰月（仅农历有效）'),
  palace_name: z.enum(PALACE_OPTIONS).optional().default('命宫').describe('要查询的宫位名称，默认为命宫')
};

function buildSchema(extraFields = {}) {
  return { ...sharedFields, ...extraFields };
}

const synastryBaseFields = {
  birth_date_a: z.string().describe('A方出生日期，格式：YYYY-MM-DD'),
  birth_time_a: z.string().describe('A方出生时间，格式：HH:mm'),
  gender_a: z.enum(['男', '女']).describe('A方性别'),
  city_a: z.string().describe('A方出生城市'),
  name_a: z.string().optional().default('A').describe('A方姓名'),
  is_lunar_a: z.boolean().optional().default(false).describe('A方是否为农历'),
  is_leap_a: z.boolean().optional().default(false).describe('A方是否为闰月'),
  birth_date_b: z.string().describe('B方出生日期，格式：YYYY-MM-DD'),
  birth_time_b: z.string().describe('B方出生时间，格式：HH:mm'),
  gender_b: z.enum(['男', '女']).describe('B方性别'),
  city_b: z.string().describe('B方出生城市'),
  name_b: z.string().optional().default('B').describe('B方姓名'),
  is_lunar_b: z.boolean().optional().default(false).describe('B方是否为农历'),
  is_leap_b: z.boolean().optional().default(false).describe('B方是否为闰月')
};

function registerTool(server, name, { title, description, inputSchema }, handler) {
  server.registerTool(
    name,
    { title, description, inputSchema },
    async (args) => {
      logger.debug(`[${name}] 输入`, { keys: Object.keys(args || {}) });
      const start = Date.now();
      const result = await handler(args);
      logger.debug(`[${name}] 用时 ${Date.now() - start}ms`);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      };
    }
  );
}

export function createMcpServer() {
  const server = new McpServer({
    name: 'fortune-mcp-service',
    version: '1.0.0'
  }, {
    capabilities: {
      tools: {}
    }
  });

  registerTool(server, 'get_palace', {
    title: '生成器',
    description: '根据阳历/农历生辰、城市位置生成紫微斗数星盘，查询输入宫位对应的信息，包含真太阳时计算、格局分析和全面运势分析',
    inputSchema: buildSchema()
  }, getPalace);

  registerTool(server, 'get_horoscope', {
    title: '运势查询',
    description: '查询紫微斗数运限（大限，小限），包含格局分析',
    inputSchema: buildSchema({
      query_year: z.number().describe('查询年份')
    })
  }, getHoroscope);

  registerTool(server, 'get_yearly_horoscope', {
    title: '流年运势查询',
    description: '查询紫微斗数流年运势（年运势），包含格局分析',
    inputSchema: buildSchema({
      query_year: z.number().describe('查询年份')
    })
  }, getYearlyHoroscope);

  registerTool(server, 'get_monthly_horoscope', {
    title: '流月运势查询',
    description: '查询紫微斗数流月运势（月运势），包含格局分析',
    inputSchema: buildSchema({
      query_year: z.number().describe('查询年份'),
      query_month: z.number().describe('查询月份（1-12）')
    })
  }, getMonthlyHoroscope);

  registerTool(server, 'get_daily_horoscope', {
    title: '流日运势查询',
    description: '查询紫微斗数流日运势（日运势），包含格局分析',
    inputSchema: buildSchema({
      query_year: z.number().describe('查询年份'),
      query_month: z.number().describe('查询月份（1-12）'),
      query_day: z.number().describe('查询日期（1-31）')
    })
  }, getDailyHoroscope);

  registerTool(server, 'analyze_synastry_by_info', {
    title: '合盘分析（输入信息）',
    description: '基于双方出生信息进行紫微斗数合盘分析，评估关系配对度和各宫位互动',
    inputSchema: { ...synastryBaseFields }
  }, analyzeSynastryByInfo);

  registerTool(server, 'analyze_decadal_synastry_by_info', {
    title: '合盘分析（大限）',
    description: '基于双方出生信息进行紫微斗数大限合盘分析，评估长期关系走向',
    inputSchema: {
      ...synastryBaseFields,
      query_year: z.number().describe('查询年份')
    }
  }, analyzeDecadalSynastryByInfo);

  registerTool(server, 'analyze_yearly_synastry_by_info', {
    title: '合盘分析（流年）',
    description: '基于双方出生信息进行紫微斗数流年合盘分析，评估年度互动主题',
    inputSchema: {
      ...synastryBaseFields,
      query_year: z.number().describe('查询年份')
    }
  }, analyzeYearlySynastryByInfo);

  registerTool(server, 'analyze_monthly_synastry_by_info', {
    title: '合盘分析（流月）',
    description: '基于双方出生信息进行紫微斗数流月合盘分析，评估月度互动主题',
    inputSchema: {
      ...synastryBaseFields,
      query_year: z.number().describe('查询年份'),
      query_month: z.number().describe('查询月份（1-12）')
    }
  }, analyzeMonthlySynastryByInfo);

  registerTool(server, 'analyze_daily_synastry_by_info', {
    title: '合盘分析（流日）',
    description: '基于双方出生信息进行紫微斗数流日合盘分析，评估每日互动主题',
    inputSchema: {
      ...synastryBaseFields,
      query_year: z.number().describe('查询年份'),
      query_month: z.number().describe('查询月份（1-12）'),
      query_day: z.number().describe('查询日期（1-31）')
    }
  }, analyzeDailySynastryByInfo);

  logger.info('✅ MCP 服务器创建完成，工具已注册');
  return server;
}
