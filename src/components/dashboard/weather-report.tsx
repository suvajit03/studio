'use client';

import { useUser } from '@/components/providers/user-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sun, Cloud, CloudRain, CloudSnow } from 'lucide-react';
import { useEffect, useState } from 'react';

// This is a mock weather data structure.
// In a real app, this would come from a weather API.
const weatherData = {
  sunny: { temp: '25°C', condition: 'Sunny', icon: <Sun className="h-16 w-16 text-yellow-400" /> },
  cloudy: { temp: '18°C', condition: 'Cloudy', icon: <Cloud className="h-16 w-16 text-gray-400" /> },
  rainy: { temp: '15°C', condition: 'Rainy', icon: <CloudRain className="h-16 w-16 text-blue-400" /> },
  snowy: { temp: '-2°C', condition: 'Snowy', icon: <CloudSnow className="h-16 w-16 text-white" /> },
};

type WeatherType = keyof typeof weatherData;

export default function WeatherReport() {
  const { user } = useUser();
  const [weather, setWeather] = useState<WeatherType>('sunny');

  useEffect(() => {
    // In a real app, you would fetch weather here based on user.location.
    // For this demo, we'll just cycle through them.
    const weatherTypes = Object.keys(weatherData) as WeatherType[];
    const randomIndex = Math.floor(Math.random() * weatherTypes.length);
    setWeather(weatherTypes[randomIndex]);
  }, [user.location]);

  const current_weather = weatherData[weather];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Weather</CardTitle>
        <CardDescription>Live weather report for {user.location}.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-around text-center p-8 rounded-lg bg-muted/50">
          <div>
            {current_weather.icon}
          </div>
          <div className="text-left">
            <p className="text-5xl font-bold">{current_weather.temp}</p>
            <p className="text-xl text-muted-foreground">{current_weather.condition}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
