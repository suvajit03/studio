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
    const lowerCaseCondition = condition.toLowerCase();
    if (lowerCaseCondition.includes('sun') || lowerCaseCondition.includes('clear')) return <Sun className={`${s} text-yellow-400`} />;
    if (lowerCaseCondition.includes('cloud') || lowerCaseCondition.includes('overcast')) return <Cloud className={`${s} text-gray-400`} />;
    if (lowerCaseCondition.includes('rain')) return <CloudRain className={`${s} text-blue-400`} />;
    if (lowerCaseCondition.includes('snow')) return <CloudSnow className={`${s} text-white`} />;
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
            const response = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${process.env.NEXT_PUBLIC_WEATHERAPI_KEY}&q=${user.location}&days=2`);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error.message || 'Failed to fetch weather');
            }

            const data = await response.json();
            const currentData = data.current;
            const forecastData = data.forecast.forecastday[0];
            const tomorrowForecastData = data.forecast.forecastday[1];

            const currentHour = new Date().getHours();
            const todaysHours = forecastData.hour.slice(currentHour);
            const tomorrowsHours = tomorrowForecastData.hour.slice(0, 24 - todaysHours.length);

            const hourlyForecasts: ForecastInfo[] = [...todaysHours, ...tomorrowsHours].map((item: any) => ({
                time: format(new Date(item.time_epoch * 1000), 'ha'),
                temp: `${Math.round(item.temp_c)}°`,
                condition: item.condition.text,
                icon: getWeatherIcon(item.condition.text, 8),
            }));
            
            setWeather({
                temp: `${Math.round(currentData.temp_c)}°C`,
                condition: currentData.condition.text,
                icon: getWeatherIcon(currentData.condition.text, 16),
                wind: `${currentData.wind_kph} km/h`,
                humidity: `${currentData.humidity}%`,
                feelsLike: `${Math.round(currentData.feelslike_c)}°C`,
                tempMin: `${Math.round(forecastData.day.mintemp_c)}°C`,
                tempMax: `${Math.round(forecastData.day.maxtemp_c)}°C`,
                pressure: `${currentData.pressure_mb} hPa`,
                visibility: `${currentData.vis_km} km`,
                cloudiness: `${currentData.cloud}%`,
                sunrise: forecastData.astro.sunrise,
                sunset: forecastData.astro.sunset,
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
        <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
                 <CardTitle className="text-lg sm:text-2xl">Current Weather</CardTitle>
                <CardDescription className="capitalize">
                    {user.isLoggedIn && user.location ? (isMobile ? user.location : `Live report for ${user.location}.`) : 'Log in and set a location.'}
                </CardDescription>
            </div>
            {user.isLoggedIn && user.location &&
                <Button asChild variant="outline" size="sm" className="shrink-0 text-[11px] sm:text-sm p-2 sm:p-3">
                    <Link href="/forecast">
                        <span>5-Day Forecast</span>
                        <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4"/>
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
                            <CarouselItem key={index} className="basis-1/3 sm:basis-1/4 md:basis-1/5">
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
