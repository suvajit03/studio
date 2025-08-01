'use client';

import { useUser } from '@/components/providers/user-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sun, Cloud, CloudRain, CloudSnow, Thermometer, Wind, Loader2, Sunrise, Sunset, Eye, Gauge, CloudIcon as CloudinessIcon, Clock, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { format } from 'date-fns';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../ui/carousel';
import Link from 'next/link';
import { Button } from '../ui/button';

interface ForecastInfo {
    time: string;
    temp: string;
    condition: string;
    icon: JSX.Element;
}

interface WeatherInfo {
    temp: string;
    condition: string;
    icon: JSX.Element;
    wind: string;
    humidity: string;
    feelsLike: string;
    tempMin: string;
    tempMax: string;
    pressure: string;
    visibility: string;
    cloudiness: string;
    sunrise: string;
    sunset: string;
    forecast: ForecastInfo[];
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
            const [currentWeatherResponse, forecastResponse] = await Promise.all([
                 fetch(`https://api.openweathermap.org/data/2.5/weather?q=${user.location}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}&units=metric`),
                 fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${user.location}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}&units=metric`)
            ]);
            
            if (!currentWeatherResponse.ok) {
                const errorData = await currentWeatherResponse.json();
                throw new Error(errorData.message || 'Failed to fetch current weather');
            }

             if (!forecastResponse.ok) {
                const errorData = await forecastResponse.json();
                throw new Error(errorData.message || 'Failed to fetch forecast');
            }

            const currentData = await currentWeatherResponse.json();
            const forecastData = await forecastResponse.json();

            const hourlyForecasts: ForecastInfo[] = forecastData.list.slice(0, 8).map((item: any) => ({
                time: format(new Date(item.dt * 1000), 'ha'),
                temp: `${Math.round(item.main.temp)}°`,
                condition: item.weather[0].main,
                icon: getWeatherIcon(item.weather[0].main.toLowerCase(), 8),
            }));
            
            setWeather({
                temp: `${Math.round(currentData.main.temp)}°C`,
                condition: currentData.weather[0].main,
                icon: getWeatherIcon(currentData.weather[0].main.toLowerCase(), 16),
                wind: `${currentData.wind.speed} km/h`,
                humidity: `${currentData.main.humidity}%`,
                feelsLike: `${Math.round(currentData.main.feels_like)}°C`,
                tempMin: `${Math.round(currentData.main.temp_min)}°C`,
                tempMax: `${Math.round(currentData.main.temp_max)}°C`,
                pressure: `${currentData.main.pressure} hPa`,
                visibility: `${currentData.visibility / 1000} km`,
                cloudiness: `${currentData.clouds.all}%`,
                sunrise: format(new Date(currentData.sys.sunrise * 1000), 'h:mm a'),
                sunset: format(new Date(currentData.sys.sunset * 1000), 'h:mm a'),
                forecast: hourlyForecasts,
            });

        } catch (error) {
            console.error(error);
            setWeather(null);
        } finally {
            setLoading(false);
        }
    }

    if (user.isLoggedIn && user.location) {
        fetchWeather();
    } else {
        setLoading(false);
        setWeather(null);
    }
  }, [user.location, user.isLoggedIn]);


  return (
    <Card className={isMobile ? "border-0 shadow-none" : ""}>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                 <CardTitle>Current Weather</CardTitle>
                <CardDescription className="capitalize">
                    {user.isLoggedIn && user.location ? `Live weather report for ${user.location}.` : 'Log in and set a location to see the weather.'}
                </CardDescription>
            </div>
            {user.isLoggedIn && user.location &&
                <Button asChild variant="outline" size="sm">
                    <Link href="/forecast">
                        5-Day Forecast
                        <ArrowRight className="ml-2 h-4 w-4"/>
                    </Link>
                </Button>
            }
        </div>
      </CardHeader>
      <CardContent>
        {loading && <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}
        {!loading && !weather && user.isLoggedIn && <p className="text-sm text-muted-foreground text-center">Could not load weather data. Please check your API key and location in settings.</p>}
        {!loading && !user.isLoggedIn && <p className="text-sm text-muted-foreground text-center">Please log in to view weather information.</p>}
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

                <Card className="p-4">
                     <CardTitle className="text-base flex items-center gap-2 mb-4">
                        <Clock className="h-5 w-5"/>
                        24-Hour Forecast
                    </CardTitle>
                    <Carousel opts={{ align: "start" }} className="w-full">
                        <CarouselContent>
                            {weather.forecast.map((hour, index) => (
                            <CarouselItem key={index} className="basis-1/4 sm:basis-1/5 md:basis-1/6">
                                <div className="flex flex-col items-center justify-center gap-2 p-2 rounded-lg bg-muted/50 h-full">
                                    <p className="text-xs text-muted-foreground">{hour.time}</p>
                                    {hour.icon}
                                    <p className="font-bold text-lg">{hour.temp}</p>
                                </div>
                            </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="hidden md:flex"/>
                        <CarouselNext className="hidden md:flex"/>
                    </Carousel>
                </Card>

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

                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger>More Details</AccordionTrigger>
                        <AccordionContent>
                           <div className="grid grid-cols-2 gap-4 text-sm pt-2">
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                                    <Thermometer className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="text-muted-foreground">Feels Like</p>
                                        <p className="font-semibold">{weather.feelsLike}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                                    <Thermometer className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="text-muted-foreground">Max / Min</p>
                                        <p className="font-semibold">{weather.tempMax} / {weather.tempMin}</p>
                                    </div>
                                </div>
                                 <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                                    <Gauge className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="text-muted-foreground">Pressure</p>
                                        <p className="font-semibold">{weather.pressure}</p>
                                    </div>
                                </div>
                                 <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                                    <Eye className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="text-muted-foreground">Visibility</p>
                                        <p className="font-semibold">{weather.visibility}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                                    <CloudinessIcon className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="text-muted-foreground">Cloudiness</p>
                                        <p className="font-semibold">{weather.cloudiness}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col justify-center gap-2 p-3 rounded-lg bg-muted/50">
                                    <div className="flex items-center gap-2">
                                        <Sunrise className="h-5 w-5 text-yellow-500" />
                                        <p className="font-semibold">{weather.sunrise}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Sunset className="h-5 w-5 text-orange-500" />
                                        <p className="font-semibold">{weather.sunset}</p>
                                    </div>
                                </div>
                           </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
