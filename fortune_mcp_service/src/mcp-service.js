import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { generateAstrolabeSolar, generateAstrolabeLunar } from './tools/astrolabe.js';
import { 
  getDecadalHoroscope, 
  getAgeHoroscope, 
  getYearlyHoroscope, 
  getMonthlyHoroscope, 
  getDailyHoroscope 
} from './tools/horoscope.js';

export function createMcpServer() {
  const server = new McpServer({
    name: 'fortune-mcp-service',
    version: '1.0.0',
  }, {
    capabilities: {
      tools: {}
    }
  });

  // 注册阳历星盘生成工具
  server.registerTool(
    'generate_astrolabe_solar',
    {
      title: '增强阳历星盘生成器',
      description: '根据阳历生辰、城市位置生成紫微斗数星盘，包含真太阳时计算和全面运势分析',
      inputSchema: {
        solar_date: z.string().describe('阳历日期，格式：YYYY-MM-DD'),
        time: z.string().describe('出生时间，格式：HH:mm'),
        gender: z.enum(['男', '女']).describe('性别'),
        city: z.string().describe('出生城市，如：北京、上海、广州等，用于经纬度查询和真太阳时计算'),
      }
    },
    async (args) => {
      console.log(`生成增强阳历星盘：${JSON.stringify(args)}`);
      const result = await generateAstrolabeSolar(args);
      console.log('增强星盘生成完成！');
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  // 注册阴历星盘生成工具
  server.registerTool(
    'generate_astrolabe_lunar',
    {
      title: '增强阴历星盘生成器',
      description: '根据阴历生辰、城市位置生成紫微斗数星盘，包含真太阳时计算和全面运势分析',
      inputSchema: {
        lunar_date: z.string().describe('阴历日期，格式：YYYY-MM-DD'),
        time: z.string().describe('出生时间，格式：HH:mm'),
        gender: z.enum(['男', '女']).describe('性别'),
        city: z.string().describe('出生城市，如：北京、上海、广州等，用于经纬度查询和真太阳时计算'),
      }
    },
    async (args) => {
      console.log(`生成增强阴历星盘：${JSON.stringify(args)}`);
      const result = await generateAstrolabeLunar(args);
      console.log('增强阴历星盘生成完成！');
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  // 注册大限运势工具
  server.registerTool(
    'get_decadal_horoscope',
    {
      title: '大限运势查询',
      description: '查询紫微斗数大限运势（十年运势）',
      inputSchema: {
        date: z.string().describe('出生日期，格式：YYYY-MM-DD'),
        time: z.string().describe('出生时间，格式：HH:mm'),
        gender: z.enum(['男', '女']).describe('性别'),
        city: z.string().describe('出生城市，用于经纬度查询和真太阳时计算'),
        is_lunar: z.boolean().optional().default(false).describe('是否为农历日期'),
        query_year: z.number().describe('查询年份')
      }
    },
    async (args) => {
      console.log(`查询大限运势：${JSON.stringify(args)}`);
      const result = await getDecadalHoroscope(args.date, args.time, args.gender, args.city, args.is_lunar, args.query_year);
      console.log('大限运势查询完成！');
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  // 注册小限运势工具  
  server.registerTool(
    'get_age_horoscope',
    {
      title: '小限运势查询',
      description: '查询紫微斗数小限运势（年龄运势）',
      inputSchema: {
        date: z.string().describe('出生日期，格式：YYYY-MM-DD'),
        time: z.string().describe('出生时间，格式：HH:mm'),
        gender: z.enum(['男', '女']).describe('性别'),
        city: z.string().describe('出生城市，用于经纬度查询和真太阳时计算'),
        is_lunar: z.boolean().optional().default(false).describe('是否为农历日期'),
        query_year: z.number().describe('查询年份')
      }
    },
    async (args) => {
      console.log(`查询小限运势：${JSON.stringify(args)}`);
      const result = await getAgeHoroscope(args.date, args.time, args.gender, args.city, args.is_lunar, args.query_year);
      console.log('小限运势查询完成！');
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  // 注册流年运势工具
  server.registerTool(
    'get_yearly_horoscope',
    {
      title: '流年运势查询',
      description: '查询紫微斗数流年运势（年运势）',
      inputSchema: {
        date: z.string().describe('出生日期，格式：YYYY-MM-DD'),
        time: z.string().describe('出生时间，格式：HH:mm'),
        gender: z.enum(['男', '女']).describe('性别'),
        city: z.string().describe('出生城市，用于经纬度查询和真太阳时计算'),
        is_lunar: z.boolean().optional().default(false).describe('是否为农历日期'),
        query_year: z.number().describe('查询年份')
      }
    },
    async (args) => {
      console.log(`查询流年运势：${JSON.stringify(args)}`);
      const result = await getYearlyHoroscope(args.date, args.time, args.gender, args.city, args.is_lunar, args.query_year);
      console.log('流年运势查询完成！');
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  // 注册流月运势工具
  server.registerTool(
    'get_monthly_horoscope',
    {
      title: '流月运势查询',
      description: '查询紫微斗数流月运势（月运势）',
      inputSchema: {
        date: z.string().describe('出生日期，格式：YYYY-MM-DD'),
        time: z.string().describe('出生时间，格式：HH:mm'),
        gender: z.enum(['男', '女']).describe('性别'),
        city: z.string().describe('出生城市，用于经纬度查询和真太阳时计算'),
        is_lunar: z.boolean().optional().default(false).describe('是否为农历日期'),
        query_year: z.number().describe('查询年份'),
        query_month: z.number().describe('查询月份（1-12）')
      }
    },
    async (args) => {
      console.log(`查询流月运势：${JSON.stringify(args)}`);
      const result = await getMonthlyHoroscope(args.date, args.time, args.gender, args.city, args.is_lunar, args.query_year, args.query_month);
      console.log('流月运势查询完成！');
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  // 注册流日运势工具
  server.registerTool(
    'get_daily_horoscope',
    {
      title: '流日运势查询',
      description: '查询紫微斗数流日运势（日运势）',
      inputSchema: {
        date: z.string().describe('出生日期，格式：YYYY-MM-DD'),
        time: z.string().describe('出生时间，格式：HH:mm'),
        gender: z.enum(['男', '女']).describe('性别'),
        city: z.string().describe('出生城市，用于经纬度查询和真太阳时计算'),
        is_lunar: z.boolean().optional().default(false).describe('是否为农历日期'),
        query_year: z.number().describe('查询年份'),
        query_month: z.number().describe('查询月份（1-12）'),
        query_day: z.number().describe('查询日期（1-31）')
      }
    },
    async (args) => {
      console.log(`查询流日运势：${JSON.stringify(args)}`);
      const result = await getDailyHoroscope(args.date, args.time, args.gender, args.city, args.is_lunar, args.query_year, args.query_month, args.query_day);
      console.log('流日运势查询完成！');
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  console.log('✅ MCP 服务器创建完成，已注册 7 个工具');
  return server;
}
