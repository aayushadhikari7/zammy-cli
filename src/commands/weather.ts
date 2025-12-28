import { registerCommand } from './registry.js';
import { theme } from '../ui/colors.js';

registerCommand({
  name: 'weather',
  description: 'Get current weather for a city',
  usage: '/weather <city>',
  async execute(args: string[]) {
    const city = args.join(' ') || 'London';

    console.log(theme.dim(`Fetching weather for ${city}...`));

    try {
      // Using wttr.in - free weather API, no key needed
      const response = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);

      if (!response.ok) {
        console.log(theme.error(`Could not fetch weather for "${city}"`));
        return;
      }

      const data = await response.json() as any;
      const current = data.current_condition[0];
      const location = data.nearest_area[0];

      const temp = current.temp_C;
      const feelsLike = current.FeelsLikeC;
      const desc = current.weatherDesc[0].value;
      const humidity = current.humidity;
      const wind = current.windspeedKmph;
      const cityName = location.areaName[0].value;
      const country = location.country[0].value;

      console.log('');
      console.log(theme.highlight(`${cityName}, ${country}`));
      console.log('');
      console.log(`  ${theme.primary(desc)}`);
      console.log(`  Temperature: ${theme.warning(temp + '°C')} (feels like ${feelsLike}°C)`);
      console.log(`  Humidity: ${humidity}%`);
      console.log(`  Wind: ${wind} km/h`);
      console.log('');
    } catch (error) {
      console.log(theme.error(`Error fetching weather: ${error}`));
    }
  },
});
