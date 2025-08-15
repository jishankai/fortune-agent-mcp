/**
 * 天文计算工具模块
 * 提供各种天文计算的基础工具函数
 */

/**
 * 天文常数
 */
export const AstronomicalConstants = {
  // 时间常数
  JULIAN_DAY_J2000: 2451545.0,           // J2000.0 epoch
  SECONDS_PER_DAY: 86400.0,              // 一天的秒数
  DAYS_PER_JULIAN_CENTURY: 36525.0,     // 儒略世纪的天数
  
  // 角度转换
  DEGREES_TO_RADIANS: Math.PI / 180.0,
  RADIANS_TO_DEGREES: 180.0 / Math.PI,
  HOURS_TO_DEGREES: 15.0,                // 1小时 = 15度
  MINUTES_TO_DEGREES: 0.25,              // 1分钟 = 0.25度
  
  // 地球相关
  EARTH_EQUATORIAL_RADIUS: 6378137.0,    // 地球赤道半径 (米)
  EARTH_POLAR_RADIUS: 6356752.314245,    // 地球极半径 (米)
  EARTH_MEAN_RADIUS: 6371000.0,          // 地球平均半径 (米)
  
  // 太阳相关
  SOLAR_RADIUS: 695700000.0,             // 太阳半径 (米)
  AU: 149597870700.0,                    // 天文单位 (米)
  
  // 时区
  CHINA_TIMEZONE_OFFSET: 8.0             // 中国标准时间 (UTC+8)
};

/**
 * 天文工具类
 */
export class AstronomicalUtils {
  
  /**
   * 角度标准化到 0-360 度
   * @param {number} degrees - 角度
   * @returns {number} 标准化后的角度
   */
  static normalizeDegrees(degrees) {
    let normalized = degrees % 360.0;
    if (normalized < 0) normalized += 360.0;
    return normalized;
  }

  /**
   * 角度标准化到 -180 到 180 度
   * @param {number} degrees - 角度
   * @returns {number} 标准化后的角度
   */
  static normalizeDegreesSymmetric(degrees) {
    let normalized = degrees % 360.0;
    if (normalized > 180.0) normalized -= 360.0;
    if (normalized < -180.0) normalized += 360.0;
    return normalized;
  }

  /**
   * 度转弧度
   * @param {number} degrees - 角度
   * @returns {number} 弧度
   */
  static degreesToRadians(degrees) {
    return degrees * AstronomicalConstants.DEGREES_TO_RADIANS;
  }

  /**
   * 弧度转度
   * @param {number} radians - 弧度
   * @returns {number} 角度
   */
  static radiansToDegrees(radians) {
    return radians * AstronomicalConstants.RADIANS_TO_DEGREES;
  }

  /**
   * 时分秒转度
   * @param {number} hours - 小时
   * @param {number} minutes - 分钟
   * @param {number} seconds - 秒钟
   * @returns {number} 角度
   */
  static hmsToDecimalDegrees(hours, minutes = 0, seconds = 0) {
    return hours * 15.0 + minutes * 0.25 + seconds * (0.25 / 60.0);
  }

  /**
   * 度转时分秒
   * @param {number} degrees - 角度
   * @returns {Object} {hours, minutes, seconds}
   */
  static decimalDegreesToHms(degrees) {
    const totalHours = degrees / 15.0;
    const hours = Math.floor(totalHours);
    const totalMinutes = (totalHours - hours) * 60.0;
    const minutes = Math.floor(totalMinutes);
    const seconds = (totalMinutes - minutes) * 60.0;
    
    return { hours, minutes, seconds };
  }

  /**
   * 度分秒转度
   * @param {number} degrees - 度
   * @param {number} minutes - 分
   * @param {number} seconds - 秒
   * @returns {number} 十进制度数
   */
  static dmsToDecimalDegrees(degrees, minutes = 0, seconds = 0) {
    const sign = degrees < 0 ? -1 : 1;
    return Math.abs(degrees) + minutes / 60.0 + seconds / 3600.0 * sign;
  }

  /**
   * 度转度分秒
   * @param {number} decimalDegrees - 十进制度数
   * @returns {Object} {degrees, minutes, seconds}
   */
  static decimalDegreesToDms(decimalDegrees) {
    const sign = decimalDegrees < 0 ? -1 : 1;
    const absolute = Math.abs(decimalDegrees);
    const degrees = Math.floor(absolute) * sign;
    const totalMinutes = (absolute - Math.floor(absolute)) * 60.0;
    const minutes = Math.floor(totalMinutes);
    const seconds = (totalMinutes - minutes) * 60.0;
    
    return { degrees, minutes, seconds };
  }

  /**
   * 计算儒略日
   * @param {number} year - 年
   * @param {number} month - 月
   * @param {number} day - 日
   * @param {number} hour - 时 (默认0)
   * @param {number} minute - 分 (默认0)  
   * @param {number} second - 秒 (默认0)
   * @returns {number} 儒略日
   */
  static calculateJulianDay(year, month, day, hour = 0, minute = 0, second = 0) {
    // 计算日内小数部分
    const dayFraction = (hour + minute / 60.0 + second / 3600.0) / 24.0;
    
    // 对于1月和2月，将其看作前一年的13月和14月
    if (month <= 2) {
      year -= 1;
      month += 12;
    }
    
    // 格里高利历修正
    const a = Math.floor(year / 100);
    const b = 2 - a + Math.floor(a / 4);
    
    // 儒略日计算
    const jd = Math.floor(365.25 * (year + 4716)) +
               Math.floor(30.6001 * (month + 1)) +
               day + b - 1524.5 + dayFraction;
    
    return jd;
  }

  /**
   * 儒略日转公历日期
   * @param {number} julianDay - 儒略日
   * @returns {Object} {year, month, day, hour, minute, second}
   */
  static julianDayToGregorian(julianDay) {
    const z = Math.floor(julianDay + 0.5);
    const f = (julianDay + 0.5) - z;
    
    let a = z;
    if (z >= 2299161) {
      const alpha = Math.floor((z - 1867216.25) / 36524.25);
      a = z + 1 + alpha - Math.floor(alpha / 4);
    }
    
    const b = a + 1524;
    const c = Math.floor((b - 122.1) / 365.25);
    const d = Math.floor(365.25 * c);
    const e = Math.floor((b - d) / 30.6001);
    
    const day = b - d - Math.floor(30.6001 * e);
    const month = e < 14 ? e - 1 : e - 13;
    const year = month > 2 ? c - 4716 : c - 4715;
    
    // 计算时分秒
    const dayFraction = f;
    const totalSeconds = dayFraction * 24 * 3600;
    const hour = Math.floor(totalSeconds / 3600);
    const minute = Math.floor((totalSeconds % 3600) / 60);
    const second = Math.floor(totalSeconds % 60);
    
    return { year, month, day, hour, minute, second };
  }

  /**
   * 计算儒略世纪数
   * @param {number} julianDay - 儒略日
   * @returns {number} 儒略世纪数 (从J2000.0开始)
   */
  static calculateJulianCenturies(julianDay) {
    return (julianDay - AstronomicalConstants.JULIAN_DAY_J2000) / 
           AstronomicalConstants.DAYS_PER_JULIAN_CENTURY;
  }

  /**
   * 计算格林威治恒星时 (Greenwich Sidereal Time)
   * @param {number} julianDay - 儒略日
   * @returns {number} 格林威治恒星时 (度)
   */
  static calculateGreenwichSiderealTime(julianDay) {
    const T = this.calculateJulianCenturies(julianDay);
    
    // 0时的格林威治平恒星时
    let gst0 = 280.46061837 + 
               360.98564736629 * (julianDay - AstronomicalConstants.JULIAN_DAY_J2000) +
               0.000387933 * T * T - 
               T * T * T / 38710000.0;
    
    return this.normalizeDegrees(gst0);
  }

  /**
   * 计算地方恒星时 (Local Sidereal Time)
   * @param {number} julianDay - 儒略日
   * @param {number} longitude - 经度 (东经为正)
   * @returns {number} 地方恒星时 (度)
   */
  static calculateLocalSiderealTime(julianDay, longitude) {
    const gst = this.calculateGreenwichSiderealTime(julianDay);
    const lst = gst + longitude;
    return this.normalizeDegrees(lst);
  }

  /**
   * 计算两个角度的差值 (考虑周期性)
   * @param {number} angle1 - 角度1
   * @param {number} angle2 - 角度2
   * @returns {number} 角度差 (-180 到 180)
   */
  static angleDifference(angle1, angle2) {
    let diff = angle1 - angle2;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    return diff;
  }

  /**
   * 验证日期有效性
   * @param {number} year - 年
   * @param {number} month - 月
   * @param {number} day - 日
   * @returns {boolean} 是否有效
   */
  static isValidDate(year, month, day) {
    if (year < 1000 || year > 3000) return false;
    if (month < 1 || month > 12) return false;
    
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    
    // 检查闰年
    if (month === 2 && this.isLeapYear(year)) {
      return day >= 1 && day <= 29;
    }
    
    return day >= 1 && day <= daysInMonth[month - 1];
  }

  /**
   * 判断是否为闰年
   * @param {number} year - 年份
   * @returns {boolean} 是否为闰年
   */
  static isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  }

  /**
   * 验证时间有效性
   * @param {number} hour - 小时
   * @param {number} minute - 分钟
   * @param {number} second - 秒钟
   * @returns {boolean} 是否有效
   */
  static isValidTime(hour, minute, second) {
    return hour >= 0 && hour <= 23 &&
           minute >= 0 && minute <= 59 &&
           second >= 0 && second <= 59;
  }

  /**
   * 验证经纬度有效性
   * @param {number} longitude - 经度
   * @param {number} latitude - 纬度
   * @returns {boolean} 是否有效
   */
  static isValidCoordinates(longitude, latitude) {
    return longitude >= -180 && longitude <= 180 &&
           latitude >= -90 && latitude <= 90;
  }

  /**
   * 格式化角度显示
   * @param {number} degrees - 角度
   * @param {number} precision - 小数位数
   * @returns {string} 格式化的角度字符串
   */
  static formatDegrees(degrees, precision = 2) {
    return `${degrees.toFixed(precision)}°`;
  }

  /**
   * 格式化时间显示
   * @param {number} hours - 小时
   * @param {number} minutes - 分钟
   * @param {number} seconds - 秒钟
   * @returns {string} 格式化的时间字符串
   */
  static formatTime(hours, minutes, seconds = 0) {
    const h = Math.floor(hours).toString().padStart(2, '0');
    const m = Math.floor(minutes).toString().padStart(2, '0');
    const s = Math.floor(seconds).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  /**
   * 计算两点间距离 (大圆距离)
   * @param {number} lat1 - 纬度1
   * @param {number} lon1 - 经度1
   * @param {number} lat2 - 纬度2
   * @param {number} lon2 - 经度2
   * @returns {number} 距离 (千米)
   */
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = AstronomicalConstants.EARTH_MEAN_RADIUS / 1000; // 转换为千米
    
    const lat1Rad = this.degreesToRadians(lat1);
    const lon1Rad = this.degreesToRadians(lon1);
    const lat2Rad = this.degreesToRadians(lat2);
    const lon2Rad = this.degreesToRadians(lon2);
    
    const dLat = lat2Rad - lat1Rad;
    const dLon = lon2Rad - lon1Rad;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }
}

// 导出常数和工具类
export { AstronomicalConstants as Constants };
export default AstronomicalUtils;