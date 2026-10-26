/**
 * 常用城市名称到高德 adcode 的映射表
 */
const CITY_ADCODES = {
  '北京': '110000',
  '北京市': '110000',
  '上海': '310000',
  '上海市': '310000',
  '广州': '440100',
  '广州市': '440100',
  '深圳': '440300',
  '深圳市': '440300',
  '杭州': '330100',
  '杭州市': '330100',
  '成都': '510100',
  '成都市': '510100',
  '武汉': '420100',
  '武汉市': '420100',
  '南京': '320100',
  '南京市': '320100',
  '西安': '610100',
  '西安市': '610100',
  '重庆': '500000',
  '重庆市': '500000',
  '天津': '120000',
  '天津市': '120000',
  '苏州': '320500',
  '苏州市': '320500'
};

export async function fetchAmapWeather(cityName = '北京') {
  const amapKey = process.env.AMAP_KEY;
  if (!amapKey) {
    throw new Error('未配置高德天气 API Key (环境变量 AMAP_KEY 缺失)');
  }

  const cleanCity = cityName.trim();
  const adcode = CITY_ADCODES[cleanCity] || CITY_ADCODES[cleanCity + '市'];
  if (!adcode) {
    throw new Error(`暂不支持城市 "${cityName}" 的高德 adcode 映射，请尝试北京/上海/广州/深圳等常用城市，或切换为 Open-Meteo`);
  }

  const url = `https://restapi.amap.com/v3/weather/weatherInfo?key=${encodeURIComponent(amapKey)}&city=${adcode}&extensions=base`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`高德 API 请求失败: ${res.statusText}`);
  }

  const data = await res.json();
  if (data.status !== '1' || !data.lives || data.lives.length === 0) {
    throw new Error(`高德 API 返回错误: ${data.info || '未获取到天气数据'}`);
  }

  const live = data.lives[0];
  return {
    provider: 'Amap (高德天气)',
    queryCity: cityName,
    matchedLocation: `${live.province} ${live.city}`,
    adcode: live.adcode,
    temperature: `${live.temperature}°C`,
    weatherCondition: live.weather,
    humidity: `${live.humidity}%`,
    windDirection: `${live.winddirection}风`,
    windPower: `${live.windpower}级`,
    reportTime: live.reporttime,
    timestamp: new Date().toISOString()
  };
}
