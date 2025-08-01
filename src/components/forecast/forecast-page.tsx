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
    if (condition.includes('sun') || condition.includes('clear')) return <Sun className={`${s} text-yellow-400`} />;
    if (condition.includes('cloud')) return <Cloud className={`${s} text-gray-400`} />;
    if (condition.includes('rain')) return <CloudRain className={`${s} text-blue-400`} />;
    if (condition.includes('snow')) return <CloudSnow className={`${s} text-white`} />;
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
            const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${user.location}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}&units=metric`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch forecast');
            }
            const data = await response.json();
            
            // Process data to get one forecast per day
            const dailyData: { [key: string]: any[] } = {};
            data.list.forEach((item: any) => {
                const date = format(new Date(item.dt * 1000), 'yyyy-MM-dd');
                if (!dailyData[date]) {
                    dailyData[date] = [];
                }
                dailyData[date].push(item);
            });

            const processedForecast: DailyForecast[] = Object.keys(dailyData).map(date => {
                const dayItems = dailyData[date];
                const tempMax = Math.round(Math.max(...dayItems.map(i => i.main.temp_max)));
                const tempMin = Math.round(Math.min(...dayItems.map(i => i.main.temp_min)));
                const dominantWeather = dayItems.reduce((acc, curr) => {
                    acc[curr.weather[0].main] = (acc[curr.weather[0].main] || 0) + 1;
                    return acc;
                }, {} as {[key:string]: number});
                const condition = Object.keys(dominantWeather).reduce((a, b) => dominantWeather[a] > dominantWeather[b] ? a : b);
                const wind = `${Math.round(dayItems[0].wind.speed)} km/h`;
                const humidity = `${dayItems[0].main.humidity}%`;

                return {
                    date: format(new Date(date), 'MMMM d'),
                    day: format(new Date(date), 'EEEE'),
                    tempMax: `${tempMax}°`,
                    tempMin: `${tempMin}°`,
                    condition: condition,
                    icon: getWeatherIcon(condition.toLowerCase()),
                    wind,
                    humidity,
                };
            }).slice(0, 5); // API provides 5 days

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
