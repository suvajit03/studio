'use client';

import { useUser } from '@/components/providers/user-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sun, Cloud, CloudRain, CloudSnow, Loader2, ArrowLeft, Wind, Thermometer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '../ui/button';

interface DailyForecast {
    date: string;
    day: string;
    tempMax: string;
    tempMin: string;
    condition: string;
    icon: JSX.Element;
    wind: string;
    humidity: string;
}

const getWeatherIcon = (condition: string, size: number = 8) => {
    const s = `h-${size} w-${size}`;
    const lowerCaseCondition = condition.toLowerCase();
    if (lowerCaseCondition.includes('sun') || lowerCaseCondition.includes('clear')) return <Sun className={`${s} text-yellow-400`} />;
    if (lowerCaseCondition.includes('cloud') || lowerCaseCondition.includes('overcast')) return <Cloud className={`${s} text-gray-400`} />;
    if (lowerCaseCondition.includes('rain')) return <CloudRain className={`${s} text-blue-400`} />;
    if (lowerCaseCondition.includes('snow')) return <CloudSnow className={`${s} text-white`} />;
    return <Sun className={`${s} text-yellow-400`} />;
}

export default function ForecastPage() {
  const { user } = useUser();
  const [forecast, setForecast] = useState<DailyForecast[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchForecast() {
        if (!user.isLoggedIn || !user.location) {
            setLoading(false);
            return;
        };
        setLoading(true);
        try {
            const response = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${process.env.NEXT_PUBLIC_WEATHERAPI_KEY}&q=${user.location}&days=5`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error.message || 'Failed to fetch forecast');
            }
            const data = await response.json();
            
            const processedForecast: DailyForecast[] = data.forecast.forecastday.map((day: any) => {
                return {
                    date: format(new Date(day.date_epoch * 1000), 'MMMM d'),
                    day: format(new Date(day.date_epoch * 1000), 'EEEE'),
                    tempMax: `${Math.round(day.day.maxtemp_c)}°`,
                    tempMin: `${Math.round(day.day.mintemp_c)}°`,
                    condition: day.day.condition.text,
                    icon: getWeatherIcon(day.day.condition.text),
                    wind: `${Math.round(day.day.maxwind_kph)} km/h`,
                    humidity: `${day.day.avghumidity}%`,
                };
            });

            setForecast(processedForecast);

        } catch (error) {
            console.error(error);
            setForecast(null);
        } finally {
            setLoading(false);
        }
    }

    fetchForecast();
  }, [user.location, user.isLoggedIn]);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl">
        <header className="flex items-center gap-4 mb-6">
             <Button asChild variant="outline" size="icon">
                <Link href="/">
                    <ArrowLeft className="h-4 w-4"/>
                </Link>
            </Button>
            <div>
                <h1 className="text-2xl font-bold font-headline">5-Day Forecast</h1>
                <p className="text-muted-foreground capitalize">{user.location}</p>
            </div>
        </header>

        <main className="space-y-4">
            {loading && <div className="flex items-center justify-center p-16"><Loader2 className="h-10 w-10 animate-spin" /></div>}
            {!loading && !user.isLoggedIn && (
                <Card className="text-center p-8">
                    <CardTitle>Please Log In</CardTitle>
                    <CardDescription>You need to be logged in to view the weather forecast.</CardDescription>
                    <Button asChild className="mt-4"><Link href="/">Go to Homepage</Link></Button>
                </Card>
            )}
            {!loading && user.isLoggedIn && !forecast && (
                 <Card className="text-center p-8">
                    <CardTitle>Could Not Load Forecast</CardTitle>
                    <CardDescription>Please check your location settings and API key.</CardDescription>
                     <Button asChild className="mt-4" variant="outline"><Link href="/">Go Back</Link></Button>
                </Card>
            )}
            {!loading && forecast && (
                <div className="grid grid-cols-1 gap-4">
                    {forecast.map((day, index) => (
                        <Card key={index} className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                           <div className="flex items-center gap-4 w-full sm:w-1/3">
                                {day.icon}
                                <div>
                                    <p className="font-bold">{day.day}</p>
                                    <p className="text-sm text-muted-foreground">{day.date}</p>
                                </div>
                           </div>
                           <div className="w-full sm:w-1/3 text-center">
                               <p className="font-semibold text-lg">{day.tempMax} / {day.tempMin}</p>
                               <p className="text-sm text-muted-foreground">{day.condition}</p>
                           </div>
                           <div className="w-full sm:w-1/3 flex justify-around sm:justify-end gap-4 text-sm">
                               <div className="flex items-center gap-2">
                                   <Wind className="h-4 w-4 text-primary"/>
                                   <span>{day.wind}</span>
                               </div>
                               <div className="flex items-center gap-2">
                                   <Thermometer className="h-4 w-4 text-primary"/>
                                   <span>{day.humidity}</span>
                               </div>
                           </div>
                        </Card>
                    ))}
                </div>
            )}
        </main>
    </div>
  );
}
