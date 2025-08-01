
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Thermometer, Wind, Eye, Gauge, CloudIcon as CloudinessIcon, Droplets } from 'lucide-react';
import { format } from 'date-fns';
import type { HourData } from '@/lib/types';
import { Avatar, AvatarImage } from '../ui/avatar';

interface HourlyDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hour: HourData | null;
}

const detailMetrics = [
    { name: 'Feels Like', key: 'feelslike_c', unit: '°C', icon: Thermometer },
    { name: 'Wind', key: 'wind_kph', unit: ' km/h', icon: Wind },
    { name: 'Humidity', key: 'humidity', unit: '%', icon: Droplets },
    { name: 'Pressure', key: 'pressure_mb', unit: ' hPa', icon: Gauge },
    { name: 'Visibility', key: 'vis_km', unit: ' km', icon: Eye },
    { name: 'Cloud Cover', key: 'cloud', unit: '%', icon: CloudinessIcon },
] as const;


export default function HourlyDetailDialog({ open, onOpenChange, hour }: HourlyDetailDialogProps) {

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {hour && <DialogHeader>
          <DialogTitle>Forecast for {format(new Date(hour.time), "ha")}</DialogTitle>
        </DialogHeader>}
        {hour && (
             <div className="space-y-4">
                <Card className="text-center">
                    <CardContent className="flex flex-col items-center justify-center gap-2 p-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={hour.condition.icon} alt={hour.condition.text} />
                        </Avatar>
                        <p className="text-4xl font-bold">{Math.round(hour.temp_c)}°C</p>
                        <p className="text-muted-foreground">{hour.condition.text}</p>
                    </CardContent>
                </Card>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    {detailMetrics.map(metric => (
                         <Card key={metric.name} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <metric.icon className="h-6 w-6 text-primary" />
                            <div>
                                <p className="text-muted-foreground">{metric.name}</p>
                                <p className="font-semibold">{hour[metric.key]}{metric.unit}</p>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
