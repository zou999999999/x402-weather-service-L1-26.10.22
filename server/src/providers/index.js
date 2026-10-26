import { fetchOpenMeteoWeather } from './openmeteo.js';
import { fetchAmapWeather } from './amap.js';

export async function getWeather(cityName = '北京') {
  const providerType = (process.env.PROVIDER || 'openmeteo').toLowerCase();

  if (providerType === 'amap') {
    return await fetchAmapWeather(cityName);
  } else {
    return await fetchOpenMeteoWeather(cityName);
  }
}

export function getCurrentProviderName() {
  return (process.env.PROVIDER || 'openmeteo').toLowerCase();
}
