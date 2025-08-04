export class DartServiceClient {
  constructor(baseUrl = 'http://dart_iztro_service:8001') {
    this.baseUrl = baseUrl;
  }

  async makeRequest(endpoint, data) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error(`Error calling ${endpoint}:`, error);
      throw new Error(`Failed to call Dart service: ${error.message}`);
    }
  }

  async calculateBazi(params) {
    const { solar_date, time, gender, is_lunar = false } = params;
    
    // 解析日期和时间
    const [year, month, day] = solar_date.split('-').map(Number);
    const [hour, minute] = time.split(':').map(Number);
    
    const requestData = {
      year,
      month,
      day,
      hour,
      minute,
      isLunar: is_lunar,
      gender: gender === '男' ? 'male' : 'female',
    };

    return await this.makeRequest('/api/calculate-bazi', requestData);
  }

  async calculateSolarTime(params) {
    const { year, month, day, hour, minute, second = 0, longitude, latitude } = params;
    
    const requestData = {
      year,
      month,
      day,
      hour,
      minute,
      second,
      longitude,
      latitude,
    };

    return await this.makeRequest('/api/calculate-solar-time', requestData);
  }

  async lookupLocation(params) {
    const { address } = params;
    
    const requestData = {
      address,
    };

    return await this.makeRequest('/api/lookup-location', requestData);
  }

  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}