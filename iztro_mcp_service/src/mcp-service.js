import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { generateAstrolabeSolar, generateAstrolabeLunar } from './tools/astrolabe.js';
import { analyzeStar, getPalaceInfo, analyzeRelationships } from './tools/analysis.js';
import { getHoroscope } from './tools/horoscope.js';
import { calculateBazi, calculateSolarTime, lookupLocation } from './tools/extended.js';

export function createMcpServer() {
  const server = new McpServer({
    name: 'iztro-mcp-service',
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
      title: '阳历星盘生成器',
      description: '根据阳历生辰生成紫微斗数星盘',
      inputSchema: {
        solar_date: z.string().describe('阳历日期，格式：YYYY-MM-DD'),
        time: z.string().describe('出生时间，格式：HH:mm'),
        gender: z.enum(['男', '女']).describe('性别'),
        is_leap: z.boolean().optional().describe('是否闰月').default(false)
      }
    },
    async (args) => {
      console.log(`生成阳历星盘：${JSON.stringify(args)}`);
      const result = await generateAstrolabeSolar(args);
      console.log('星盘生成完成！');
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  // 注册阴历星盘生成工具
  server.registerTool(
    'generate_astrolabe_lunar',
    {
      title: '阴历星盘生成器',
      description: '根据阴历生辰生成紫微斗数星盘',
      inputSchema: {
        lunar_date: z.string().describe('阴历日期，格式：YYYY-MM-DD'),
        time: z.string().describe('出生时间，格式：HH:mm'),
        gender: z.enum(['男', '女']).describe('性别'),
        is_leap: z.boolean().optional().describe('是否闰月').default(false)
      }
    },
    async (args) => {
      console.log(`生成阴历星盘：${JSON.stringify(args)}`);
      const result = await generateAstrolabeLunar(args);
      console.log('阴历星盘生成完成！');
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  // 注册星曜分析工具
  server.registerTool(
    'analyze_star',
    {
      title: '星曜分析器',
      description: '分析特定星曜的意义与影响',
      inputSchema: {
        star_name: z.string().describe('星曜名称，如：紫微、天府、太阳等'),
        palace: z.string().optional().describe('所在宫位，如：命宫、财帛宫、事业宫等')
      }
    },
    async (args) => {
      console.log(`分析星曜：${JSON.stringify(args)}`);
      const result = await analyzeStar(args);
      console.log('星曜分析完成！');
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  // 注册运势查询工具
  server.registerTool(
    'get_horoscope',
    {
      title: '运势查询器',
      description: '获取大限、小限、流年、流月、流日等运势信息',
      inputSchema: {
        astrolabe_data: z.object({
          basic_info: z.object({
            solar_date: z.string().optional(),
            lunar_date: z.string().optional(),
            time: z.string().optional(),
            gender: z.string().optional(),
            zodiac: z.string().optional(),
            five_elements: z.string().optional()
          }).passthrough().optional(),
          palace_data: z.array(z.object({
            name: z.string().optional(),
            stars: z.array(z.object({
              name: z.string().optional(),
              type: z.string().optional(),
              scope: z.string().optional(),
              brightness: z.string().optional(),
              mutagen: z.string().optional()
            }).passthrough()).optional(),
            earthly_branch: z.string().optional(),
            heavenly_stem: z.string().optional(),
            is_body_palace: z.boolean().optional(),
            is_original_palace: z.boolean().optional()
          }).passthrough()).optional(),
          star_locations: z.record(z.object({
            name: z.string().optional(),
            palace: z.string().optional(),
            brightness: z.string().optional(),
            type: z.string().optional(),
            mutagen: z.string().optional()
          }).passthrough()).optional()
        }).passthrough().describe('星盘数据（从generate_astrolabe_*获得）'),
        year: z.number().describe('查询年份'),
        month: z.number().optional().describe('查询月份（可选）'),
        day: z.number().optional().describe('查询日期（流日查询时必需）'),
        query_type: z.enum(['yearly', 'monthly', 'daily', 'decadal', 'age_limit']).optional().describe('查询类型：yearly=流年，monthly=流月，daily=流日，decadal=大限，age_limit=小限').default('yearly')
      }
    },
    async (args) => {
      console.log(`查询运势：${JSON.stringify(args)}`);
      const result = await getHoroscope(args);
      console.log('运势查询完成！');
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  // 注册宫位信息查询工具
  server.registerTool(
    'get_palace_info',
    {
      title: '宫位信息查询器',
      description: '查询特定宫位的详细信息',
      inputSchema: {
        astrolabe_data: z.object({
          basic_info: z.object({
            solar_date: z.string().optional(),
            lunar_date: z.string().optional(),
            time: z.string().optional(),
            gender: z.string().optional(),
            zodiac: z.string().optional(),
            five_elements: z.string().optional()
          }).passthrough().optional(),
          palace_data: z.array(z.object({
            name: z.string().optional(),
            stars: z.array(z.object({
              name: z.string().optional(),
              type: z.string().optional(),
              scope: z.string().optional(),
              brightness: z.string().optional(),
              mutagen: z.string().optional()
            }).passthrough()).optional(),
            earthly_branch: z.string().optional(),
            heavenly_stem: z.string().optional(),
            is_body_palace: z.boolean().optional(),
            is_original_palace: z.boolean().optional()
          }).passthrough()).optional(),
          star_locations: z.record(z.object({
            name: z.string().optional(),
            palace: z.string().optional(),
            brightness: z.string().optional(),
            type: z.string().optional(),
            mutagen: z.string().optional()
          }).passthrough()).optional()
        }).passthrough().describe('星盘数据（从generate_astrolabe_*获得）'),
        palace_name: z.string().describe('宫位名称，如：命宫、财帛宫、夫妻宫等')
      }
    },
    async (args) => {
      console.log(`查询宫位信息：${JSON.stringify(args)}`);
      const result = await getPalaceInfo(args);
      console.log('宫位信息查询完成！');
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  // 注册关系分析工具
  server.registerTool(
    'analyze_relationships',
    {
      title: '关系分析器',
      description: '分析星曜与宫位之间的关系和影响',
      inputSchema: {
        astrolabe_data: z.object({
          basic_info: z.object({
            solar_date: z.string().optional(),
            lunar_date: z.string().optional(),
            time: z.string().optional(),
            gender: z.string().optional(),
            zodiac: z.string().optional(),
            five_elements: z.string().optional()
          }).passthrough().optional(),
          palace_data: z.array(z.object({
            name: z.string().optional(),
            stars: z.array(z.object({
              name: z.string().optional(),
              type: z.string().optional(),
              scope: z.string().optional(),
              brightness: z.string().optional(),
              mutagen: z.string().optional()
            }).passthrough()).optional(),
            earthly_branch: z.string().optional(),
            heavenly_stem: z.string().optional(),
            is_body_palace: z.boolean().optional(),
            is_original_palace: z.boolean().optional()
          }).passthrough()).optional(),
          star_locations: z.record(z.object({
            name: z.string().optional(),
            palace: z.string().optional(),
            brightness: z.string().optional(),
            type: z.string().optional(),
            mutagen: z.string().optional()
          }).passthrough()).optional()
        }).passthrough().describe('星盘数据（从generate_astrolabe_*获得）'),
        analysis_type: z.enum(['基本格局', '财运分析', '事业分析', '感情分析', '健康分析']).describe('分析类型')
      }
    },
    async (args) => {
      console.log('=== MCP analyzeRelationships 工具调用 ===');
      console.log('args 类型:', typeof args);
      console.log('args 原始大小:', JSON.stringify(args).length, '字符');
      console.log('args 键:', Object.keys(args));
      
      if (args.astrolabe_data) {
        console.log('astrolabe_data 存在，类型:', typeof args.astrolabe_data);
        console.log('astrolabe_data 键:', Object.keys(args.astrolabe_data));
        if (args.astrolabe_data.palace_data) {
          console.log('宫位数据长度:', args.astrolabe_data.palace_data.length);
        }
      } else {
        console.log('❌ astrolabe_data 不存在或为空');
      }
      
      console.log(`analysis_type: ${args.analysis_type}`);
      console.log('=== MCP 调试结束 ===');
      
      const result = await analyzeRelationships(args);
      console.log('关系分析完成！');
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  // 注册八字计算工具
  server.registerTool(
    'calculate_bazi',
    {
      title: '八字计算器',
      description: '基于JavaScript本地计算生辰八字信息，支持真太阳时矫正',
      inputSchema: {
        year: z.number().describe('年份'),
        month: z.number().describe('月份'),
        day: z.number().describe('日期'),
        hour: z.number().describe('小时'),
        minute: z.number().describe('分钟'),
        gender: z.enum(['男', '女']).describe('性别'),
        isLunar: z.boolean().optional().describe('是否农历').default(false),
        address: z.string().optional().describe('出生地址（可选，用于真太阳时矫正）')
      }
    },
    async (args) => {
      console.log(`计算八字：${JSON.stringify(args)}`);
      const result = await calculateBazi(args);
      console.log('八字计算完成！');
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  // 注册真太阳时计算工具
  server.registerTool(
    'calculate_solar_time',
    {
      title: '真太阳时计算器',
      description: '基于天文算法计算真太阳时和平太阳时',
      inputSchema: {
        year: z.number().describe('年份'),
        month: z.number().describe('月份'),
        day: z.number().describe('日期'),
        hour: z.number().describe('小时'),
        minute: z.number().describe('分钟'),
        second: z.number().optional().describe('秒').default(0),
        longitude: z.number().describe('经度（东正西负）'),
        latitude: z.number().describe('纬度（北正南负）')
      }
    },
    async (args) => {
      console.log(`计算真太阳时：${JSON.stringify(args)}`);
      const result = await calculateSolarTime(args);
      console.log('真太阳时计算完成！');
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  // 注册地理位置查询工具
  server.registerTool(
    'lookup_location',
    {
      title: '地理位置查询器',
      description: '根据地址查询经纬度坐标信息',
      inputSchema: {
        address: z.string().describe('地址，如：北京市海淀区')
      }
    },
    async (args) => {
      console.log(`查询地理位置：${JSON.stringify(args)}`);
      const result = await lookupLocation(args);
      console.log('地理位置查询完成！');
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  // 注册专门的大限运势查询工具
  server.registerTool(
    'get_decadal_fortune',
    {
      title: '大限运势查询器',
      description: '专门查询大限（十年大运）运势信息，提供详细的大限宫位分析',
      inputSchema: {
        astrolabe_data: z.object({
          basic_info: z.object({
            solar_date: z.string().optional(),
            lunar_date: z.string().optional(),
            time: z.string().optional(),
            gender: z.string().optional(),
            zodiac: z.string().optional(),
            five_elements: z.string().optional()
          }).passthrough().optional(),
          palace_data: z.array(z.object({
            name: z.string().optional(),
            stars: z.array(z.object({
              name: z.string().optional(),
              type: z.string().optional(),
              scope: z.string().optional(),
              brightness: z.string().optional(),
              mutagen: z.string().optional()
            }).passthrough()).optional(),
            earthly_branch: z.string().optional(),
            heavenly_stem: z.string().optional(),
            is_body_palace: z.boolean().optional(),
            is_original_palace: z.boolean().optional()
          }).passthrough()).optional(),
          star_locations: z.record(z.object({
            name: z.string().optional(),
            palace: z.string().optional(),
            brightness: z.string().optional(),
            type: z.string().optional(),
            mutagen: z.string().optional()
          }).passthrough()).optional()
        }).passthrough().describe('星盘数据（从generate_astrolabe_*获得）'),
        year: z.number().describe('参考年份（用于确定当前大限）')
      }
    },
    async (args) => {
      console.log(`查询大限运势：${JSON.stringify(args)}`);
      const result = await getHoroscope({
        ...args,
        query_type: 'decadal'
      });
      console.log('大限运势查询完成！');
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  // 注册专门的小限运势查询工具
  server.registerTool(
    'get_age_limit_fortune',
    {
      title: '小限运势查询器',
      description: '专门查询小限（年度个人运势）信息，分析当年个人状态变化',
      inputSchema: {
        astrolabe_data: z.object({
          basic_info: z.object({
            solar_date: z.string().optional(),
            lunar_date: z.string().optional(),
            time: z.string().optional(),
            gender: z.string().optional(),
            zodiac: z.string().optional(),
            five_elements: z.string().optional()
          }).passthrough().optional(),
          palace_data: z.array(z.object({
            name: z.string().optional(),
            stars: z.array(z.object({
              name: z.string().optional(),
              type: z.string().optional(),
              scope: z.string().optional(),
              brightness: z.string().optional(),
              mutagen: z.string().optional()
            }).passthrough()).optional(),
            earthly_branch: z.string().optional(),
            heavenly_stem: z.string().optional(),
            is_body_palace: z.boolean().optional(),
            is_original_palace: z.boolean().optional()
          }).passthrough()).optional(),
          star_locations: z.record(z.object({
            name: z.string().optional(),
            palace: z.string().optional(),
            brightness: z.string().optional(),
            type: z.string().optional(),
            mutagen: z.string().optional()
          }).passthrough()).optional()
        }).passthrough().describe('星盘数据（从generate_astrolabe_*获得）'),
        year: z.number().describe('查询年份')
      }
    },
    async (args) => {
      console.log(`查询小限运势：${JSON.stringify(args)}`);
      const result = await getHoroscope({
        ...args,
        query_type: 'age_limit'
      });
      console.log('小限运势查询完成！');
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  // 注册专门的流日运势查询工具
  server.registerTool(
    'get_daily_fortune',
    {
      title: '流日运势查询器',
      description: '专门查询流日（每日运势）信息，提供具体日期的运势分析',
      inputSchema: {
        astrolabe_data: z.object({
          basic_info: z.object({
            solar_date: z.string().optional(),
            lunar_date: z.string().optional(),
            time: z.string().optional(),
            gender: z.string().optional(),
            zodiac: z.string().optional(),
            five_elements: z.string().optional()
          }).passthrough().optional(),
          palace_data: z.array(z.object({
            name: z.string().optional(),
            stars: z.array(z.object({
              name: z.string().optional(),
              type: z.string().optional(),
              scope: z.string().optional(),
              brightness: z.string().optional(),
              mutagen: z.string().optional()
            }).passthrough()).optional(),
            earthly_branch: z.string().optional(),
            heavenly_stem: z.string().optional(),
            is_body_palace: z.boolean().optional(),
            is_original_palace: z.boolean().optional()
          }).passthrough()).optional(),
          star_locations: z.record(z.object({
            name: z.string().optional(),
            palace: z.string().optional(),
            brightness: z.string().optional(),
            type: z.string().optional(),
            mutagen: z.string().optional()
          }).passthrough()).optional()
        }).passthrough().describe('星盘数据（从generate_astrolabe_*获得）'),
        year: z.number().describe('查询年份'),
        month: z.number().describe('查询月份'),
        day: z.number().describe('查询日期')
      }
    },
    async (args) => {
      console.log(`查询流日运势：${JSON.stringify(args)}`);
      const result = await getHoroscope({
        ...args,
        query_type: 'daily'
      });
      console.log('流日运势查询完成！');
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  console.log('✅ MCP 服务器创建完成，已注册 12 个工具');
  return server;
}
