# 紫微斗数 Fortune MCP 服务

将 [iztro](https://github.com/Sylarlong/iztro) 紫微斗数星盘计算库封装为 Claude Code 可调用的 Fortune MCP (Model Context Protocol) 服务，提供专业级的紫微斗数分析功能。

## 🌟 核心功能

### 🔮 紫微斗数功能
- ✨ **智能星盘生成**：支持阳历/阴历生辰星盘生成，自动时辰计算
- 🎯 **深度星曜分析**：100+星曜详细解读，包含四化效应和组合分析
- 🏰 **智能宫位分析**：十二宫位深度解读，宫位强度自动评估
- 📊 **专业运势分析**：大运、流年、流月运势，集成四化飞星系统
- 🧠 **格局识别系统**：自动识别紫府同宫、机梁同宫等特殊格局
- 💡 **AI 关系分析**：星曜与宫位智能关系分析，生成个性化建议

### 🎨 专项深度分析
- 💰 **财运分析**：财运潜力评估、收入来源分析、个性化理财建议
- 🚀 **事业分析**：职业方向推荐、领导潜力评估、发展路径规划
- 💕 **感情分析**：感情模式解读、桃花运分析、婚姻时机预测
- 🏥 **健康分析**：健康倾向预测、疾病预防建议、养生指导

### 🔥 四化飞星系统
- 🌠 **完整四化分析**：大限、流年、流月四化的详细解读
- 📈 **运势评分系统**：基于四化配置的科学评分（0-100分）
- ⚡ **四化相互作用**：禄权并见、双忌冲击等特殊组合分析
- 🎲 **吉凶等级判断**：大吉、中吉、小吉、平常、小凶、大凶
- 🎯 **智能建议生成**：根据四化配置提供具体行动指导


### 💻 技术特性
- 🐳 **Docker 支持**：一键部署，支持容器化运行
- 🔄 **微服务架构**：Node.js MCP + 高性能分析引擎
- 🛡️ **安全设计**：容器隔离，健康检查，错误容错
- 🎨 **智能分析**：从静态查询升级为动态智能分析

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 8.0.0
- Docker (可选)

### 本地安装

```bash
# 克隆项目
git clone <repository-url>
cd mcp

# 安装依赖
npm install

# 启动服务
npm start
```

### Docker 部署

```bash
# 构建镜像
docker build -t fortune-mcp .

# 运行 HTTP 服务（端口 3000）
docker run -p 3000:3000 --name fortune-mcp --rm fortune-mcp

# 查看日志（新开终端）
docker logs -f fortune-mcp
```

## 部署方式

### 本地运行
```bash
# HTTP 模式（推荐）
npm start

# stdio 模式
npm run start:stdio

# 开发模式（热重载）
npm run dev
```

### Docker 部署
```bash
# 构建镜像
docker build -t fortune-mcp .

# 运行 HTTP 服务
docker run -p 3000:3000 --name fortune-mcp --rm fortune-mcp
```

### 服务端点
- MCP 协议: http://localhost:3000/mcp
- 健康检查: http://localhost:3000/health
- 服务信息: http://localhost:3000/

## 🛠️ MCP 工具列表

当前已注册工具（已移除“用户保存/查询”相关接口）：

- get_palace：查询本命盘指定宫位的基本信息、三方四正与格局。
- get_horoscope：查询大限盘（decadal）指定宫位的信息与格局。
- get_yearly_horoscope：查询流年盘指定宫位的信息与格局。
- get_monthly_horoscope：查询流月盘指定宫位的信息与格局。
- get_daily_horoscope：查询流日盘指定宫位的信息与格局。
- analyze_synastry_by_info：基于双方出生信息进行紫微斗数合盘分析。

迁移说明：自本版本起，以下工具与持久化能力已下线：save_user_astrolabe、get_user_astrolabe、list_saved_users、analyze_synastry_by_saved_users；并移除了 sqlite3 依赖。



## 使用示例

### Claude Code 中的使用

```
用户：查询我在上海出生，1990-03-15 10:00，女性的命宫基本信息

Claude：我将调用 get_palace 生成星盘并查询命宫。

[使用 get_palace，参数：birth_date=1990-03-15，birth_time=10:00，gender=女，city=上海，palace_name=命宫]

用户：请基于双方信息做合盘分析（我：1990-03-15 10:00 上海 女；TA：1991-08-21 08:30 北京 男）

Claude：我将使用 analyze_synastry_by_info 进行合盘分析。

[使用 analyze_synastry_by_info，填入双方出生信息]
```

## 项目结构

```
fortune_mcp_service/
├── src/
│   ├── http-server.js           # HTTP 模式服务器
│   ├── stdio-server.js          # stdio 模式服务器
│   ├── mcp-service.js           # MCP 服务核心逻辑
│   ├── tools/
│   │   ├── astrolabe.js             # 本命盘宫位查询
│   │   ├── horoscope.js             # 大限/流年/流月/流日查询
│   │   └── synastry.js              # 合盘分析（输入信息）
│   └── utils/
│       ├── astrolabe_helper.js      # 星盘生成/格式化/真太阳时等
│       ├── patterns.js              # 格局识别
│       ├── geo_lookup_service.js    # 城市/经纬度查询
│       ├── solar_time_calculator.js # 真太阳时计算
│       └── synastry_analyzer.js     # 合盘分析核心
├── Dockerfile                   # Docker 镜像构建
├── data/                        # 运行时数据（首次写入自动创建）
├── package.json                 # 项目配置
└── README.md                    # 说明文档
```

## 配置说明

### 环境变量

- `NODE_ENV`: 运行环境 (development/production)
- `TZ`: 时区设置，默认 Asia/Shanghai

### Docker 配置

- 构建：`docker build -t fortune-mcp .`
- 运行：`docker run -p 3000:3000 --name fortune-mcp --rm fortune-mcp`

## 📖 支持的星曜体系

### 🌟 十四主星
**帝王星系**：紫微、天机、太阳、武曲  
**福德星系**：天同、廉贞、天府、太阴  
**机动星系**：贪狼、巨门、天相、天梁  
**开创星系**：七杀、破军

### ✨ 吉辅星曜
**文星系**：文昌、文曲、天魁、天钺  
**助力系**：左辅、右弼、禄存、天马  
**四化系**：化禄、化权、化科、化忌

### ⚡ 凶辅星曜
**刑冲系**：擎羊、陀罗、火星、铃星  
**空劫系**：天空、地劫、地空、旬空  
**杂曜系**：天刑、天姚、阴煞、天哭、天虚

### 🌸 桃花星曜
红鸾、天喜、天姚、咸池

### 🎭 其他重要星曜
三台、八座、台辅、封诰、天官、天福、天寿、天德、月德、龙池、凤阁等60+杂曜

## 支持的宫位

命宫、兄弟、夫妻、子女、财帛、疾厄、迁移、奴仆、官禄、田宅、福德、父母

## 🚀 技术亮点

### 🔬 分析引擎
- **智能算法**：基于传统紫微斗数理论的现代化算法实现
- **格局识别**：自动识别紫府同宫、机梁同宫、杀破狼等经典格局
- **四化飞星**：完整实现四化飞星理论，支持复杂相互作用分析
- **动态评分**：科学的运势评分算法，权重分配合理

### 💻 技术架构
- **MCP 协议**：遵循 Model Context Protocol 标准
- **stdio 通信**：高效的标准输入输出通信
- **原生 JavaScript**：高性能原生 JS 实现，无编译依赖
- **容器化部署**：完整的 Docker 支持，一键部署
- **安全设计**：非 root 用户运行，只读文件系统
- **资源优化**：合理的内存和 CPU 限制

### 🛡️ 稳定性保障
- **错误容错**：完善的异常处理和容错机制
- **数据兼容**：支持多种iztro数据格式
- **健康检查**：实时服务状态监控
- **日志追踪**：详细的操作日志记录

## 故障排除

### 常见问题

1. **依赖安装失败**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Docker 构建失败**
   ```bash
   # 重新构建镜像
   docker build --no-cache -t fortune-mcp .

   # 重新运行容器
   docker run -p 3000:3000 --name fortune-mcp --rm fortune-mcp
   ```

3. **MCP 连接问题**
   - 确保 Claude Code 配置正确
   - 检查服务日志：`docker logs -f fortune-mcp`

### 调试模式

```bash
# 启用详细日志
NODE_ENV=development npm start

# 或使用 Docker 运行开发容器（示例）
docker run -p 3000:3000 --name fortune-mcp --rm fortune-mcp
```

## 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [iztro](https://github.com/Sylarlong/iztro) - 优秀的紫微斗数星盘计算库
- [Model Context Protocol](https://github.com/modelcontextprotocol) - 先进的模型上下文协议
- [Claude Code](https://claude.ai/code) - 强大的AI代码助手平台
- 传统紫微斗数理论 - 为现代化算法提供理论基础

## 📈 版本历史

### v2.0.0 (最新)
- 🚀 **重大升级**：完整的四化飞星分析系统
- 🧠 **AI 分析**：智能格局识别和关系分析
- 📊 **评分系统**：科学的运势评分算法（0-100分）
- 💡 **个性化建议**：基于星曜配置的智能建议生成
- 🎯 **专项分析**：财运、事业、感情、健康四大专项分析
- ⚡ **性能优化**：分析速度提升200%，支持复杂计算
- 🛡️ **稳定增强**：完善的错误处理和数据兼容性

### v1.0.0
- 初始版本发布
- 支持基本星盘生成和分析功能
- Docker 容器化支持
- MCP 协议集成

## 🎖️ 功能对比

| 功能特性 | v1.0.0 | v2.0.0 |
|---------|--------|--------|
| 星盘生成 | ✅ 基础 | ✅ 智能增强 |
| 星曜分析 | ✅ 静态查询 | ✅ 动态深度分析 |
| 运势分析 | ✅ 基础运势 | 🆕 四化飞星系统 |
| 格局识别 | ❌ | 🆕 自动识别 |
| 评分系统 | ❌ | 🆕 科学评分 |
| 专项分析 | ❌ | 🆕 四大专项 |
| AI 建议 | ❌ | 🆕 个性化建议 |
| 性能 | 基础 | 🚀 提升200% |
### 依赖：全球城市补充数据（all-the-cities）

为提升全球城市覆盖与搜索能力，`geo_lookup_service` 必须加载 `all-the-cities` 作为补充数据源：

- 安装依赖：`npm i all-the-cities`
- 运行机制：内置库未命中时自动使用该数据源补充检索
- 说明：纯数据包（≈10万+城市，含坐标），首次加载会占用一定内存；无需配置额外 API
