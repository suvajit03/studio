'use client';

import { useUser } from '@/components/providers/user-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sun, Cloud, CloudRain, CloudSnow, Loader2, ArrowLeft, Wind, Thermometer, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../ui/carousel';
import { motion } from 'framer-motion';

interface HourForecast {
    time: string;
    temp: string;
    condition: string;
    icon: JSX.Element;
}

interface DailyForecast {
    date: string;
    day: string;
    tempMax: string;
    tempMin: string;
    condition: string;
    icon: JSX.Element;
    wind: string;
    humidity: string;
    hourly: HourForecast[];
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
                const hourly: HourForecast[] = day.hour.map((item: any) => ({
                    time: format(new Date(item.time_epoch * 1000), 'ha'),
                    temp: `${Math.round(item.temp_c)}°`,
                    condition: item.condition.text,
                    icon: getWeatherIcon(item.condition.text, 6),
                }));

                return {
                    date: format(new Date(day.date_epoch * 1000), 'MMMM d'),
                    day: format(new Date(day.date_epoch * 1000), 'EEEE'),
                    tempMax: `${Math.round(day.day.maxtemp_c)}°`,
                    tempMin: `${Math.round(day.day.mintemp_c)}°`,
                    condition: day.day.condition.text,
                    icon: getWeatherIcon(day.day.condition.text),
                    wind: `${Math.round(day.day.maxwind_kph)} km/h`,
                    humidity: `${day.day.avghumidity}%`,
                    hourly: hourly,
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

        <main className="space-y-2">
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
                <Accordion type="single" collapsible className="w-full space-y-2">
                    {forecast.map((day, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                            <AccordionItem value={`item-${index}`} className="border-b-0">
                                <Card className="p-0 overflow-hidden">
                                    <AccordionTrigger className="p-4 hover:no-underline hover:bg-muted/50 transition-colors [&[data-state=open]]:bg-muted/50">
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
                                            <div className="flex items-center gap-4 w-full sm:w-1/3">
                                                {day.icon}
                                                <div>
                                                    <p className="font-bold text-left">{index === 0 ? 'Today' : day.day}</p>
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
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="p-4 border-t">
                                            <h4 className="font-semibold mb-4 text-sm flex items-center gap-2"><Clock className="h-4 w-4"/> Hourly Forecast</h4>
                                            <Carousel opts={{ align: "start" }} className="w-full">
                                                <CarouselContent>
                                                    {day.hourly.map((hour, hourIndex) => (
                                                    <CarouselItem key={hourIndex} className="basis-1/4 sm:basis-1/5 md:basis-[12.5%]">
                                                        <div className="flex flex-col items-center justify-center gap-2 p-2 rounded-lg bg-muted/30 h-full text-center">
                                                            <p className="text-xs text-muted-foreground">{hour.time}</p>
                                                            {hour.icon}
                                                            <p className="font-bold text-base">{hour.temp}</p>
                                                        </div>
                                                    </CarouselItem>
                                                    ))}
                                                </CarouselContent>
                                                <CarouselPrevious className="hidden md:flex"/>
                                                <CarouselNext className="hidden md:flex"/>
                                            </Carousel>
                                        </div>
                                    </AccordionContent>
                                </Card>
                            </AccordionItem>
                        </motion.div>
                    ))}
                </Accordion>
            )}
        </main>
    </div>
  );
}
