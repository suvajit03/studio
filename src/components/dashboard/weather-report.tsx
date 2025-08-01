'use client';

import { useUser } from '@/components/providers/user-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sun, Cloud, CloudRain, CloudSnow, Thermometer, Wind, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface WeatherInfo {
    temp: string;
    condition: string;
    icon: JSX.Element;
    wind: string;
    humidity: string;
}

const getWeatherIcon = (condition: string, size: number = 4) => {
    const s = `h-${size} w-${size}`;
    if (condition.includes('sun') || condition.includes('clear')) return <Sun className={`${s} text-yellow-400`} />;
    if (condition.includes('cloud')) return <Cloud className={`${s} text-gray-400`} />;
    if (condition.includes('rain')) return <CloudRain className={`${s} text-blue-400`} />;
    if (condition.includes('snow')) return <CloudSnow className={`${s} text-white`} />;
    return <Sun className={`${s} text-yellow-400`} />;
}

export default function WeatherReport() {
  const { user } = useUser();
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    async function fetchWeather() {
        if (!user.location) return;
        setLoading(true);
        try {
            const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${user.location}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}&units=metric`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch weather');
            }
            const data = await response.json();
            
            setWeather({
                temp: `${Math.round(data.main.temp)}°C`,
                condition: data.weather[0].main,
                icon: getWeatherIcon(data.weather[0].main.toLowerCase(), 16),
                wind: `${data.wind.speed} km/h`,
                humidity: `${data.main.humidity}%`
            });

        } catch (error) {
            console.error(error);
            setWeather(null);
        } finally {
            setLoading(false);
        }
    }

    fetchWeather();
  }, [user.location]);


  return (
    <Card className={isMobile ? "border-0 shadow-none" : ""}>
      <CardHeader>
        <CardTitle>Current Weather</CardTitle>
        <CardDescription className="capitalize">Live weather report for {user.location}.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading && <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}
        {weather && (
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-around text-center p-8 rounded-lg bg-muted/50">
                <div>
                    {weather.icon}
                </div>
                <div className="text-left">
                    <p className="text-5xl font-bold">{weather.temp}</p>
                    <p className="text-xl text-muted-foreground">{weather.condition}</p>
                </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                        <Wind className="h-5 w-5 text-primary" />
                        <div>
                            <p className="text-muted-foreground">Wind</p>
                            <p className="font-semibold">{weather.wind}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                        <Thermometer className="h-5 w-5 text-primary" />
                        <div>
                            <p className="text-muted-foreground">Humidity</p>
                            <p className="font-semibold">{weather.humidity}</p>
                        </div>
                    </div>
                </div>
            </div>
        )}
        {!loading && !weather && <p className="text-sm text-muted-foreground text-center">Could not load weather data. Please check your API key and location.</p>}
      </CardContent>
    </Card>
  );
}
