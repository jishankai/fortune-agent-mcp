# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chinese astrology (紫微斗数/Ziwei Doushu) MCP (Model Context Protocol) service that provides astrological chart calculations and analysis through Claude Code. The service wraps the `iztro` astrology calculation library and exposes it via MCP tools for Claude's use.

## Architecture

### Core Components

- **MCP Service Layer**: `src/mcp-service.js` - Core MCP server with 10 registered tools
- **Server Modes**: 
  - HTTP mode: `src/http-server.js` (recommended, port 3000)
  - stdio mode: `src/stdio-server.js` (for direct MCP connection)
- **Tool Modules**:
  - `src/tools/astrolabe.js` - Palace-based chart generation and analysis
  - `src/tools/horoscope.js` - Multi-timeframe fortune analysis (decadal, yearly, monthly, daily)
  - `src/tools/user.js` - User data persistence and management
- **Utilities**: 
  - `src/utils/astrolabe_helper.js` - Core astrolabe generation and formatting
  - `src/utils/geo_lookup_service.js` - City coordinate lookup service
  - `src/utils/solar_time_calculator.js` - True solar time calculation
  - `src/utils/patterns.js` - Pattern detection for astrology charts
- **Storage**: `src/storage/userStorage.js` - SQLite-based user data storage

### Key Dependencies

- `iztro`: Chinese astrology calculation library (v2.5.3)
- `@modelcontextprotocol/sdk`: MCP protocol implementation
- `express`: HTTP server framework
- `lunar-javascript`: Lunar calendar conversions
- `sqlite3`: Local storage for user data
- `zod`: Schema validation

## Development Commands

```bash
# Install dependencies
npm install

# Start HTTP server (recommended)
npm start

# Start stdio server
npm run start:stdio

# Development mode with hot reload
npm run dev

# Build and run with Docker
docker build -t fortune-mcp .
docker run -p 3000:3000 fortune-mcp
```

## Service Endpoints (HTTP Mode)

- MCP Protocol: `http://localhost:3000/mcp`
- Health Check: `http://localhost:3000/health`
- Service Info: `http://localhost:3000/`

## Available MCP Tools

### Chart Generation and Palace Analysis
- `get_palace` - Generate astrolabe and query specific palace information with pattern analysis

### Fortune Analysis Tools (Full Analysis)
- `get_horoscope` - Decadal fortune analysis (大限运势) with pattern analysis
- `get_yearly_horoscope` - Annual fortune analysis (流年运势) with pattern analysis
- `get_monthly_horoscope` - Monthly fortune analysis (流月运势) with pattern analysis  
- `get_daily_horoscope` - Daily fortune analysis (流日运势) with pattern analysis

### Fortune Analysis Tools (Lite Versions)
- `get_yearly_horoscope_lite` - Lightweight annual fortune analysis
- `get_monthly_horoscope_lite` - Lightweight monthly fortune analysis
- `get_daily_horoscope_lite` - Lightweight daily fortune analysis

### User Management Tools
- `save_user_astrolabe` - Save user astrology charts to local SQLite storage
- `get_user_astrolabe` - Retrieve saved user charts by name
- `list_saved_users` - List all saved users

## Enhanced Features

### City-Based Coordinate Lookup
- Supports 40+ major Chinese cities with precise coordinates
- Fuzzy matching for city names (handles suffixes like 市/县/区/镇)
- Defaults to Beijing coordinates for unknown cities

### True Solar Time Calculation  
- Astronomical algorithm-based true solar time calculation
- Accounts for Earth's orbital variations and equation of time
- Timezone and longitude corrections for accurate time determination
- Shows time adjustment in minutes from standard time

### Comprehensive Fortune Analysis
- **Personality Analysis**: Based on Life Palace (命宫) major stars
- **Wealth Analysis**: Financial potential from Wealth Palace (财帛宫)
- **Career Analysis**: Professional direction from Career Palace (官禄宫)  
- **Love Analysis**: Relationship patterns from Marriage Palace (夫妻宫)
- **Health Analysis**: Health tendencies from Health Palace (疾厄宫)
- **Temporal Analysis**: Decadal fortune (大限), yearly fortune (流年), age limit (小限)

## Data Flow Pattern

1. **Input**: Provide birth date, time, gender, and city
2. **Coordinate Lookup**: System automatically finds city coordinates via `geo_lookup_service.js`
3. **True Solar Time**: Calculates astronomical true solar time via `solar_time_calculator.js`
4. **Chart Generation**: Creates comprehensive astrology chart using iztro library
5. **Pattern Detection**: Analyzes chart patterns via `patterns.js`
6. **Fortune Analysis**: Generates detailed analysis based on palace configurations
7. **Output**: Returns complete chart with time calculations, palace data, and pattern analysis

## Tool Function Mapping

- `get_palace` → `getPalace()` in `src/tools/astrolabe.js`
- Fortune tools → various functions in `src/tools/horoscope.js`
- User tools → functions in `src/tools/user.js`
- Core generation → `generateAstrolabe()` in `src/utils/astrolabe_helper.js`

## Key Technical Details

### Session Management (HTTP Mode)
- Uses session IDs for maintaining MCP connections
- Automatic cleanup of inactive sessions (30min timeout)
- Session reuse for performance

### Error Handling
- Comprehensive error catching in all tools
- Graceful degradation when data is incomplete
- Detailed logging for debugging

### Performance Considerations
- 50MB JSON payload limit for large astrolabe data (configured in http-server.js:22)
- Session cleanup runs every 5 minutes, with 30-minute timeout for inactive sessions
- Extensive debug logging for request body sizes and astrolabe data

### Security Features
- Non-root container execution
- Read-only filesystem in Docker
- No new privileges security option
- CORS configuration for browser clients

## Troubleshooting

### Common Issues
1. **Dependency installation failures**: Delete `node_modules` and `package-lock.json`, then `npm install`
2. **Docker build failures**: Use `docker build --no-cache -t fortune-mcp .`
3. **MCP connection issues**: Check service logs with `docker logs <container_name>`

### Debug Mode
- Set `NODE_ENV=development` for verbose logging
- Use `npm run dev` for hot reload during development

## Working with Chinese Astrology Data

### Supported Star Types
- 14 Major Stars (十四主星): Purple Star, Heavenly Machine, Sun, etc.
- Lucky Assistant Stars: Literary stars, Support stars, Four Transformations
- Unlucky Assistant Stars: Punishment stars, Void stars, etc.
- Peach Blossom Stars: Romance and relationship indicators
- 60+ Miscellaneous Stars

### Palace System
- 12 Palaces: Life, Siblings, Spouse, Children, Wealth, Health, Travel, Friends, Career, Property, Fortune, Parents
- Each palace contains multiple stars with brightness levels and transformations

### Four Transformations System (四化)
- 化禄 (Transformation to Wealth), 化权 (Power), 化科 (Fame), 化忌 (Obstruction)
- Critical for fortune analysis and scoring algorithms
- Complex interactions between transformations affect analysis results