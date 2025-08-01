
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
import type { WeatherInfo, WeatherMetric, ForecastInfo, HourData } from '@/lib/types';
import WeatherDetailDialog from './weather-detail-dialog';
import HourlyDetailDialog from './hourly-detail-dialog';

const getWeatherIcon = (condition: string, size: number = 4) => {
    const s = `h-${size} w-${size}`;
    const lowerCaseCondition = condition.toLowerCase();
    if (lowerCaseCondition.includes('sun') || lowerCaseCondition.includes('clear')) return <Sun className={`${s} text-yellow-400`} />;
    if (lowerCaseCondition.includes('cloud') || lowerCaseCondition.includes('overcast')) return <Cloud className={`${s} text-gray-400`} />;
    if (lowerCaseCondition.includes('rain')) return <CloudRain className={`${s} text-blue-400`} />;
    if (lowerCaseCondition.includes('snow')) return <CloudSnow className={`${s} text-white`} />;
    return <Sun className={`${s} text-yellow-400`} />;
}

const weatherMetrics: WeatherMetric[] = [
    { name: 'Wind', key: 'maxwind_kph', unit: ' km/h', icon: Wind, precision: 0 },
    { name: 'Humidity', key: 'avghumidity', unit: '%', icon: Thermometer, precision: 0 },
    { name: 'Feels Like', key: 'feelslike_c', unit: '°C', icon: Thermometer, precision: 1 },
    { name: 'Pressure', key: 'pressure_mb', unit: ' hPa', icon: Gauge, precision: 0 },
    { name: 'Visibility', key: 'avgvis_km', unit: ' km', icon: Eye, precision: 0 },
    { name: 'Cloudiness', key: 'cloud', unit: '%', icon: CloudinessIcon, precision: 0 },
    { name: 'Temperature', key: 'temp_c', unit: '°C', icon: Thermometer, precision: 1}
];

export default function WeatherReport() {
  const { user } = useUser();
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDetailDialogOpen, setDetailDialogOpen] = useState(false);
  const [isHourlyDetailOpen, setHourlyDetailOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<WeatherMetric | null>(null);
  const [selectedHour, setSelectedHour] = useState<HourData | null>(null);
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
                hourData: item,
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
                // Add full day data for metric lookup
                day: forecastData.day,
                current: currentData
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
  
  const handleMetricClick = (metric: WeatherMetric) => {
    setSelectedMetric(metric);
    setDetailDialogOpen(true);
  }

  const handleHourClick = (hourData: HourData) => {
    setSelectedHour(hourData);
    setHourlyDetailOpen(true);
  }

  const getMetricValue = (metricKey: keyof WeatherInfo['day'] | keyof WeatherInfo['current'], precision: number) => {
    if (!weather) return 'N/A';
    // Prioritize current data for some fields, day average for others
    const value = weather.current[metricKey as keyof WeatherInfo['current']] ?? weather.day[metricKey as keyof WeatherInfo['day']];
    if(typeof value === 'number') {
        return value.toFixed(precision);
    }
    return value || 'N/A';
  }

  return (
    <>
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
                            <CarouselItem key={index} className="basis-1/3 sm:basis-1/4 md:basis-1/5 lg:basis-[12.5%]">
                                <button
                                  className="flex flex-col items-center justify-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors h-full w-full text-center"
                                  onClick={() => handleHourClick(hour.hourData)}
                                >
                                    <p className="text-xs text-muted-foreground">{hour.time}</p>
                                    {hour.icon}
                                    <p className="font-bold text-lg">{hour.temp}</p>
                                </button>
                            </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="hidden md:flex"/>
                        <CarouselNext className="hidden md:flex"/>
                    </Carousel>
                </Card>

                <div className="grid grid-cols-2 gap-4 text-sm">
                   {weatherMetrics.slice(0, 2).map((metric) => (
                       <Card key={metric.name} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors" onClick={() => handleMetricClick(metric)}>
                            <metric.icon className="h-5 w-5 text-primary" />
                            <div>
                                <p className="text-muted-foreground">{metric.name}</p>
                                <p className="font-semibold">{getMetricValue(metric.key, metric.precision)}{metric.unit}</p>
                            </div>
                        </Card>
                   ))}
                </div>

                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger>More Details</AccordionTrigger>
                        <AccordionContent>
                           <div className="grid grid-cols-2 gap-4 text-sm pt-2">
                               {weatherMetrics.slice(2).map((metric) => (
                                <Card key={metric.name} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors" onClick={() => handleMetricClick(metric)}>
                                    <metric.icon className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="text-muted-foreground">{metric.name}</p>
                                        <p className="font-semibold">{getMetricValue(metric.key, metric.precision)}{metric.unit}</p>
                                    </div>
                                </Card>
                               ))}
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
    <WeatherDetailDialog 
        open={isDetailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        metric={selectedMetric}
        location={user.location}
    />
    <HourlyDetailDialog
        open={isHourlyDetailOpen}
        onOpenChange={setHourlyDetailOpen}
        hour={selectedHour}
    />
    </>
  );
}
