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
  - `src/tools/astrolabe.js` - Chart generation (solar/lunar calendar)
  - `src/tools/horoscope.js` - Multi-timeframe fortune analysis
  - `src/tools/userManager.js` - User data persistence
- **Utilities**: `src/utils/` - Helper functions, astronomical calculations, HTTP client
- **Storage**: `src/storage/` - SQLite-based user data storage

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

# Docker deployment (production)
docker-compose up -d

# Docker development environment
docker-compose --profile dev up -d

# Docker stdio mode
docker-compose --profile stdio up -d
```

## Service Endpoints (HTTP Mode)

- MCP Protocol: `http://localhost:3000/mcp`
- Health Check: `http://localhost:3000/health`
- Service Info: `http://localhost:3000/`

## Available MCP Tools

### Enhanced Astrology Chart Generation
- `generate_astrolabe_solar` - Enhanced solar calendar chart with city coordinates, true solar time calculation, and comprehensive fortune analysis
- `generate_astrolabe_lunar` - Enhanced lunar calendar chart with city coordinates, true solar time calculation, and comprehensive fortune analysis

### Fortune Analysis Tools
- `get_decadal_horoscope` - Decadal fortune analysis (大限运势)
- `get_age_horoscope` - Age-based fortune analysis (小限运势) 
- `get_yearly_horoscope` - Annual fortune analysis (流年运势)
- `get_monthly_horoscope` - Monthly fortune analysis (流月运势)
- `get_daily_horoscope` - Daily fortune analysis (流日运势)

### User Management Tools
- `save_user_astrolabe` - Save user astrology charts to local storage
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
2. **Coordinate Lookup**: System automatically finds city coordinates
3. **True Solar Time**: Calculates astronomical true solar time based on location
4. **Chart Generation**: Creates comprehensive astrology chart using iztro library
5. **Fortune Analysis**: Generates detailed personality, wealth, career, love, and health insights
6. **Output**: Returns complete chart with time calculations, palace data, and fortune analysis

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
- 50MB JSON payload limit for large astrolabe data
- Memory limits: 512M production, 256M stdio mode
- CPU limits: 0.5 cores production, 0.25 stdio mode

### Security Features
- Non-root container execution
- Read-only filesystem in Docker
- No new privileges security option
- CORS configuration for browser clients

## Troubleshooting

### Common Issues
1. **Dependency installation failures**: Delete `node_modules` and `package-lock.json`, then `npm install`
2. **Docker build failures**: Use `docker-compose build --no-cache`
3. **MCP connection issues**: Check service logs with `docker-compose logs`

### Debug Mode
- Set `NODE_ENV=development` for verbose logging
- Use Docker dev profile for development debugging

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