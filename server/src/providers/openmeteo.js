/**
 * WMO Weather interpretation codes (WW)
 */
const WMO_CODES = {
  0: '晴朗 (Clear sky)',
  1: '大部晴朗 (Mainly clear)',
  2: '局部多云 (Partly cloudy)',
  3: '阴天 (Overcast)',
  45: '有雾 (Fog)',
  48: '沉积雾 (Depositing rime fog)',
  51: '微量毛毛雨 (Light drizzle)',
  53: '中度毛毛雨 (Moderate drizzle)',
  55: '浓密毛毛雨 (Dense drizzle)',
  61: '小雨 (Slight rain)',
  63: '中雨 (Moderate rain)',
  65: '大雨 (Heavy rain)',
  71: '小雪 (Slight snow fall)',
  73: '中雪 (Moderate snow fall)',
  75: '大雪 (Heavy snow fall)',
  80: '微弱阵雨 (Slight rain showers)',
  81: '中度阵雨 (Moderate rain showers)',
  82: '暴烈阵雨 (Violent rain showers)',
  95: '雷暴 (Thunderstorm)',
};

export async function fetchOpenMeteoWeather(cityName = '北京') {
  // 1. 地理编码：将城市名转换为经纬度
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=zh&format=json`;
  const geoRes = await fetch(geoUrl);
  if (!geoRes.ok) {
    throw new Error(`Geocoding failed for city "${cityName}": ${geoRes.statusText}`);
  }
  const geoData = await geoRes.json();
  if (!geoData.results || geoData.results.length === 0) {
    throw new Error(`城市 "${cityName}" 未找到对应的地理坐标`);
  }

  const { latitude, longitude, name: matchedName, country } = geoData.results[0];

  // 2. 获取实况天气数据
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&timezone=auto`;
  const weatherRes = await fetch(weatherUrl);
  if (!weatherRes.ok) {
    throw new Error(`Weather fetch failed: ${weatherRes.statusText}`);
  }
  const weatherData = await weatherRes.json();
  const current = weatherData.current;

  return {
    provider: 'Open-Meteo',
    queryCity: cityName,
    matchedLocation: `${matchedName} (${country || ''})`,
    coordinates: {
      latitude,
      longitude
    },
    temperature: `${current.temperature_2m}°C`,
    apparentTemperature: `${current.apparent_temperature}°C`,
    humidity: `${current.relative_humidity_2m}%`,
    weatherCondition: WMO_CODES[current.weather_code] || `未知代码 (${current.weather_code})`,
    windSpeed: `${current.wind_speed_10m} km/h`,
    precipitation: `${current.precipitation} mm`,
    observationTime: current.time,
    timestamp: new Date().toISOString()
  };
}
