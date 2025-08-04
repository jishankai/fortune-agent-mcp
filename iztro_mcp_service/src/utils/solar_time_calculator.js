/**
 * 真太阳时计算器
 * 基于天文算法实现高精度真太阳时计算
 */

/**
 * 真太阳时计算器类
 */
export class SolarTimeCalculator {
  constructor() {
    // 常数定义
    this.J2000 = 2451545.0; // J2000.0 epoch
    this.DEGREES_TO_RADIANS = Math.PI / 180.0;
    this.RADIANS_TO_DEGREES = 180.0 / Math.PI;
  }

  /**
   * 计算儒略日 (Julian Day)
   * @param {number} year - 年
   * @param {number} month - 月 
   * @param {number} day - 日
   * @param {number} hour - 时
   * @param {number} minute - 分
   * @param {number} second - 秒
   * @returns {number} 儒略日
   */
  calculateJulianDay(year, month, day, hour = 0, minute = 0, second = 0) {
    // 计算小数日
    const fractionalDay = (hour + minute / 60.0 + second / 3600.0) / 24.0;
    
    // 公历转儒略日算法
    if (month <= 2) {
      year -= 1;
      month += 12;
    }
    
    const a = Math.floor(year / 100);
    const b = Math.floor(a / 4);
    const c = 2 - a + b;
    const e = Math.floor(365.25 * (year + 4716));
    const f = Math.floor(30.6001 * (month + 1));
    
    return c + day + e + f - 1524.5 + fractionalDay;
  }

  /**
   * 计算地球轨道偏心率
   * @param {number} T - 儒略世纪数
   * @returns {number} 偏心率
   */
  calculateEccentricity(T) {
    return 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T;
  }

  /**
   * 计算太阳平黄经 (Mean Longitude of Sun)
   * @param {number} T - 儒略世纪数
   * @returns {number} 太阳平黄经 (度)
   */
  calculateMeanLongitude(T) {
    let L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    // 归一化到 0-360 度
    return this.normalizeAngle(L0);
  }

  /**
   * 计算太阳平近点角 (Mean Anomaly of Sun)
   * @param {number} T - 儒略世纪数
   * @returns {number} 太阳平近点角 (度)
   */
  calculateMeanAnomaly(T) {
    let M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
    return this.normalizeAngle(M);
  }

  /**
   * 计算太阳中心方程 (Equation of Center)
   * @param {number} M - 太阳平近点角 (度)
   * @param {number} T - 儒略世纪数
   * @returns {number} 中心方程 (度)
   */
  calculateEquationOfCenter(M, T) {
    const Mr = M * this.DEGREES_TO_RADIANS;
    
    const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mr) +
              (0.019993 - 0.000101 * T) * Math.sin(2 * Mr) +
              0.000289 * Math.sin(3 * Mr);
    
    return C;
  }

  /**
   * 计算太阳真黄经 (True Longitude of Sun)
   * @param {number} L0 - 太阳平黄经
   * @param {number} C - 中心方程
   * @returns {number} 太阳真黄经 (度)
   */
  calculateTrueLongitude(L0, C) {
    return this.normalizeAngle(L0 + C);
  }

  /**
   * 计算黄赤交角 (Obliquity of Ecliptic)
   * @param {number} T - 儒略世纪数
   * @returns {number} 黄赤交角 (度)
   */
  calculateObliquity(T) {
    const eps0 = 23.0 + 26.0/60.0 + 21.448/3600.0 - 
                 46.8150/3600.0 * T - 
                 0.00059/3600.0 * T * T + 
                 0.001813/3600.0 * T * T * T;
    return eps0;
  }

  /**
   * 计算太阳赤经 (Right Ascension)
   * @param {number} lambda - 太阳真黄经 (度)
   * @param {number} eps - 黄赤交角 (度)
   * @returns {number} 太阳赤经 (度)
   */
  calculateRightAscension(lambda, eps) {
    const lambdaRad = lambda * this.DEGREES_TO_RADIANS;
    const epsRad = eps * this.DEGREES_TO_RADIANS;
    
    const alpha = Math.atan2(
      Math.cos(epsRad) * Math.sin(lambdaRad),
      Math.cos(lambdaRad)
    );
    
    return this.normalizeAngle(alpha * this.RADIANS_TO_DEGREES);
  }

  /**
   * 计算时间方程 (Equation of Time)
   * @param {number} L0 - 太阳平黄经 (度)
   * @param {number} alpha - 太阳赤经 (度)
   * @returns {number} 时间方程 (分钟)
   */
  calculateEquationOfTime(L0, alpha) {
    let E = L0 - 0.0057183 - alpha;
    
    // 处理边界情况
    if (E > 180) E -= 360;
    if (E < -180) E += 360;
    
    // 转换为分钟
    return E * 4.0;
  }

  /**
   * 计算真太阳时
   * @param {Object} params - 参数对象
   * @param {Object} params.dateTime - 日期时间 {year, month, day, hour, minute, second}
   * @param {number} params.longitude - 经度 (东经为正)
   * @param {number} params.latitude - 纬度 (北纬为正)
   * @returns {Object} 计算结果
   */
  getSolarTime(params) {
    try {
      const { dateTime, longitude, latitude } = params;
      const { year, month, day, hour, minute, second = 0 } = dateTime;

      // 输入验证
      this.validateInputs(year, month, day, hour, minute, second, longitude, latitude);

      // 计算儒略日
      const JD = this.calculateJulianDay(year, month, day, hour, minute, second);
      
      // 计算儒略世纪数
      const T = (JD - this.J2000) / 36525.0;

      // 计算各天文要素
      const L0 = this.calculateMeanLongitude(T);
      const M = this.calculateMeanAnomaly(T);
      const C = this.calculateEquationOfCenter(M, T);
      const lambda = this.calculateTrueLongitude(L0, C);
      const eps = this.calculateObliquity(T);
      const alpha = this.calculateRightAscension(lambda, eps);
      const E = this.calculateEquationOfTime(L0, alpha);

      // 计算地方时修正 (相对于标准时区的经度修正)
      // 中国标准时间基于东经120度，所以需要计算相对于120度的差值
      const standardLongitude = 120.0; // 中国标准时间基准经度
      const longitudeCorrection = (longitude - standardLongitude) * 4.0; // 1度 = 4分钟
      
      // 计算真太阳时
      const totalCorrection = E + longitudeCorrection;
      const meanSolarMinutes = hour * 60 + minute + second / 60.0;
      const trueSolarMinutes = meanSolarMinutes + totalCorrection;

      // 转换为时分格式
      const trueSolarTime = this.minutesToHourMinute(trueSolarMinutes);
      const meanSolarTime = { hour, minute, second };

      return {
        success: true,
        data: {
          inputDateTime: {
            year, month, day, hour, minute, second,
            longitude, latitude
          },
          meanSolarTime,
          trueSolarTime: {
            hour: trueSolarTime.hour,
            minute: trueSolarTime.minute,
            second: Math.round(trueSolarTime.second)
          },
          corrections: {
            equationOfTime: E, // 分钟
            longitudeCorrection, // 分钟
            totalCorrection // 分钟
          },
          astronomicalData: {
            julianDay: JD,
            sunMeanLongitude: L0,
            sunTrueLongitude: lambda,
            sunRightAscension: alpha,
            obliquity: eps
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * 验证输入参数
   */
  validateInputs(year, month, day, hour, minute, second, longitude, latitude) {
    if (!Number.isInteger(year) || year < 1000 || year > 3000) {
      throw new Error('年份必须是1000-3000之间的整数');
    }
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new Error('月份必须是1-12之间的整数');
    }
    if (!Number.isInteger(day) || day < 1 || day > 31) {
      throw new Error('日期必须是1-31之间的整数');
    }
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
      throw new Error('小时必须是0-23之间的整数');
    }
    if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
      throw new Error('分钟必须是0-59之间的整数');
    }
    if (!Number.isInteger(second) || second < 0 || second > 59) {
      throw new Error('秒数必须是0-59之间的整数');
    }
    if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
      throw new Error('经度必须是-180到180之间的数值');
    }
    if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
      throw new Error('纬度必须是-90到90之间的数值');
    }
  }

  /**
   * 分钟转换为时分秒格式
   * @param {number} totalMinutes - 总分钟数
   * @returns {Object} {hour, minute, second}
   */
  minutesToHourMinute(totalMinutes) {
    // 处理负值和超过24小时的情况
    let minutes = totalMinutes;
    while (minutes < 0) minutes += 24 * 60;
    while (minutes >= 24 * 60) minutes -= 24 * 60;

    const hour = Math.floor(minutes / 60);
    const minute = Math.floor(minutes % 60);
    const second = (minutes % 1) * 60;

    return { hour, minute, second };
  }

  /**
   * 角度归一化到0-360度
   * @param {number} angle - 角度
   * @returns {number} 归一化后的角度
   */
  normalizeAngle(angle) {
    let normalized = angle % 360;
    if (normalized < 0) normalized += 360;
    return normalized;
  }
}

// 导出单例实例
export const solarTimeCalculator = new SolarTimeCalculator();