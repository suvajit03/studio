
'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { format, subDays } from 'date-fns';
import type { HistoricalData, ForecastData, WeatherMetric } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

interface WeatherDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metric: WeatherMetric | null;
  location: string;
}

const chartConfig = {
  value: {
    label: 'Value',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;


export default function WeatherDetailDialog({ open, onOpenChange, metric, location }: WeatherDetailDialogProps) {
  const [data, setData] = useState<(HistoricalData | ForecastData)[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!open || !metric || !location) return;

      setLoading(true);
      setData(null);
      setError(null);

      try {
        const today = new Date();
        const promises = [];

        // Fetch last 7 days of history
        for (let i = 7; i > 0; i--) {
          const date = subDays(today, i);
          const formattedDate = format(date, 'yyyy-MM-dd');
          promises.push(
            fetch(`https://api.weatherapi.com/v1/history.json?key=${process.env.NEXT_PUBLIC_WEATHERAPI_KEY}&q=${location}&dt=${formattedDate}`)
              .then(res => res.json())
          );
        }
        
        // Fetch 5-day forecast
        promises.push(
          fetch(`https://api.weatherapi.com/v1/forecast.json?key=${process.env.NEXT_PUBLIC_WEATHERAPI_KEY}&q=${location}&days=5`)
            .then(res => res.json())
        );

        const results = await Promise.all(promises);
        
        const historicalResults = results.slice(0, 7);
        const forecastResult = results[7];

        if (forecastResult.error) {
            throw new Error(forecastResult.error.message);
        }

        const combinedData: (HistoricalData | ForecastData)[] = [];

        // Process historical data
        historicalResults.forEach(day => {
            if (day.forecast?.forecastday[0]) {
                combinedData.push({
                    date: day.forecast.forecastday[0].date,
                    value: day.forecast.forecastday[0].day[metric.key],
                    type: 'history',
                });
            }
        });

        // Process forecast data
        forecastResult.forecast.forecastday.forEach((day: any) => {
            combinedData.push({
                date: day.date,
                value: day.day[metric.key],
                type: 'forecast',
            });
        });

        setData(combinedData);
      } catch (e: any) {
        console.error(e);
        setError(e.message || 'Failed to fetch detailed weather data.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [open, metric, location]);
  
  const getChartData = () => {
    if (!data || !metric) return [];
    return data.map(d => ({
        date: format(new Date(d.date), 'MMM d'),
        value: d.value,
        type: d.type
    }));
  }

  const chartData = getChartData();
  const currentValue = data?.find(d => d.date === format(new Date(), 'yyyy-MM-dd'))?.value;
  const averageValue = data ? (data.reduce((acc, curr) => acc + curr.value, 0) / data.length).toFixed(metric.precision) : 0;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        {metric && <DialogHeader>
          <DialogTitle className="capitalize">{metric.name} Details</DialogTitle>
        </DialogHeader>}
        <div className="min-h-[24rem]">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {error && (
             <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {data && metric && (
            <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-4 text-center">
                    <Card>
                        <CardHeader className="p-2 pb-0">
                            <CardDescription>Current</CardDescription>
                        </CardHeader>
                        <CardContent className="p-2 pt-0">
                            <p className="text-2xl font-bold">{currentValue}{metric.unit}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="p-2 pb-0">
                            <CardDescription>12-Day Avg.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-2 pt-0">
                            <p className="text-2xl font-bold">{averageValue}{metric.unit}</p>
                        </CardContent>
                    </Card>
                </div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">History & Forecast</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-64 w-full">
                    <AreaChart accessibilityLayer data={chartData} margin={{ left: -20, right: 10 }}>
                        <defs>
                            <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="50%" stopColor="var(--color-value)" stopOpacity={0.8} />
                                <stop offset="50%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8} />
                            </linearGradient>
                        </defs>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => `${value}${metric.unit}`}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="line" />}
                      />
                      <Area
                        dataKey="value"
                        type="natural"
                        fill="url(#splitColor)"
                        stroke="var(--color-value)"
                        stackId="a"
                      />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

