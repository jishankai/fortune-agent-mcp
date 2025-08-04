import { solarTimeCalculator } from '../utils/solar_time_calculator.js';
import { geoLookupService } from '../utils/geo_lookup_service.js';
import { Solar, Lunar } from 'lunar-javascript';

export async function calculateBazi(args) {
  try {
    console.log('JavaScript本地计算八字：', JSON.stringify(args));
    
    const { year, month, day, hour, minute, isLunar = false, gender, address } = args;
    
    let finalHour = hour;
    let finalMinute = minute;
    let locationInfo = null;
    let solarTimeInfo = null;
    
    // 如果提供了地址，进行真太阳时矫正
    if (address) {
      console.log('查询地理位置：', address);
      const locationResult = geoLookupService.lookupAddress(address);
      
      if (locationResult.success) {
        locationInfo = locationResult.data;
        console.log('地理位置查询成功：', locationInfo.standardName);
        
        // 计算真太阳时
        const solarTimeResult = solarTimeCalculator.getSolarTime({
          dateTime: { year, month, day, hour, minute, second: 0 },
          longitude: locationInfo.longitude,
          latitude: locationInfo.latitude
        });
        
        if (solarTimeResult.success) {
          solarTimeInfo = solarTimeResult.data;
          finalHour = solarTimeInfo.trueSolarTime.hour;
          finalMinute = solarTimeInfo.trueSolarTime.minute;
          console.log(`真太阳时矫正：${hour}:${minute} -> ${finalHour}:${finalMinute}`);
        }
      }
    }
    
    // 使用 lunar-javascript 计算八字
    
    let lunar;
    if (isLunar) {
      // 如果输入是阴历
      lunar = Lunar.fromYmdHms(year, month, day, finalHour, finalMinute, 0);
    } else {
      // 如果输入是阳历，先转换为阴历
      const solar = Solar.fromYmdHms(year, month, day, finalHour, finalMinute, 0);
      lunar = solar.getLunar();
    }
    
    // 获取八字
    const eightChar = lunar.getEightChar();
    
    // 构造详细的八字信息
    const baziInfo = {
      // 基本信息
      inputDate: {
        year,
        month,
        day,
        hour: finalHour,
        minute: finalMinute,
        isLunar,
        gender
      },
      
      // 八字干支
      bazi: {
        year: eightChar.getYear(),        // 年柱
        month: eightChar.getMonth(),      // 月柱
        day: eightChar.getDay(),          // 日柱
        time: eightChar.getTime()         // 时柱
      },
      
      // 详细八字信息
      baziDetails: {
        yearPillar: {
          heavenlyStem: eightChar.getYearGan(),      // 年天干
          earthlyBranch: eightChar.getYearZhi(),     // 年地支
          combined: eightChar.getYear()
        },
        monthPillar: {
          heavenlyStem: eightChar.getMonthGan(),     // 月天干
          earthlyBranch: eightChar.getMonthZhi(),    // 月地支
          combined: eightChar.getMonth()
        },
        dayPillar: {
          heavenlyStem: eightChar.getDayGan(),       // 日天干
          earthlyBranch: eightChar.getDayZhi(),      // 日地支
          combined: eightChar.getDay()
        },
        timePillar: {
          heavenlyStem: eightChar.getTimeGan(),      // 时天干
          earthlyBranch: eightChar.getTimeZhi(),     // 时地支
          combined: eightChar.getTime()
        }
      },
      
      // 阴历信息
      lunarInfo: {
        year: lunar.getYear(),
        month: lunar.getMonth(),
        day: lunar.getDay(),
        yearInChinese: lunar.getYearInChinese(),
        monthInChinese: lunar.getMonthInChinese(),
        dayInChinese: lunar.getDayInChinese(),
        toString: lunar.toString()
      },
      
      // 阳历信息
      solarInfo: {
        solar: lunar.getSolar(),
        toString: lunar.getSolar().toString()
      },
      
      // 真太阳时信息
      location: locationInfo,
      solarTime: solarTimeInfo,
      
      // 时辰信息
      timeInfo: {
        originalTime: `${hour}:${minute}`,
        correctedTime: `${finalHour}:${finalMinute}`,
        timeCorrection: solarTimeInfo ? `${solarTimeInfo.equation}秒` : '无矫正'
      }
    };

    console.log('八字计算完成');
    return {
      status: 'success',
      data: baziInfo
    };
  } catch (error) {
    console.error('八字计算失败：', error);
    return {
      status: 'error',
      error: error.message,
      data: null,
    };
  }
}

export async function calculateSolarTime(args) {
  try {
    console.log('JavaScript本地计算真太阳时：', JSON.stringify(args));
    
    const { year, month, day, hour, minute, second = 0, longitude, latitude } = args;
    
    // 使用本地JavaScript模块计算真太阳时
    const result = solarTimeCalculator.getSolarTime({
      dateTime: { year, month, day, hour, minute, second },
      longitude,
      latitude
    });
    
    if (!result.success) {
      throw new Error(result.error);
    }

    console.log('真太阳时计算完成');
    return {
      status: 'success',
      data: result.data
    };
  } catch (error) {
    console.error('真太阳时计算失败：', error);
    return {
      status: 'error',
      error: error.message,
      data: null,
    };
  }
}

export async function lookupLocation(args) {
  try {
    console.log('JavaScript本地查询地理位置：', JSON.stringify(args));
    
    const { address } = args;
    
    // 使用本地JavaScript模块查询地理位置
    const result = geoLookupService.lookupAddress(address);
    
    if (!result.success) {
      throw new Error(result.error);
    }

    console.log('地理位置查询完成');
    return {
      status: 'success',
      data: result.data
    };
  } catch (error) {
    console.error('地理位置查询失败：', error);
    return {
      status: 'error',
      error: error.message,
      data: null,
    };
  }
}