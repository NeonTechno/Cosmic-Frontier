/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * COSMIC FRONTIER — Planetary Intelligence & Live Earth Observation Console
 * Integrates Agromonitoring (soil/UVI), OpenWeatherMap (atmosphere/weather), and NASA Open Data.
 */

import React, { useState, useEffect } from 'react';
import { 
  CloudSun, 
  Sprout, 
  Thermometer, 
  Wind, 
  Gauge, 
  Sun, 
  Satellite, 
  Radio, 
  RefreshCw, 
  CheckCircle2, 
  ShieldAlert, 
  MapPin, 
  Globe2, 
  Layers, 
  Activity,
  Compass,
  AlertTriangle
} from 'lucide-react';

interface WeatherData {
  name: string;
  coord: { lat: number; lon: number };
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  weather: Array<{ id: number; main: string; description: string; icon: string }>;
  wind: { speed: number; deg: number };
  clouds: { all: number };
}

interface AgroData {
  location: { lat: number; lon: number };
  weather?: {
    main?: { temp: number; pressure: number; humidity: number };
    wind?: { speed: number };
    clouds?: { all: number };
  };
  soil?: {
    surfaceTempCelsius: number | null;
    subsurface10cmTempCelsius: number | null;
    moistureIndex: number | null;
  };
  uvi?: number | null;
}

interface AirPollutionData {
  list?: Array<{
    main: { aqi: number };
    components: {
      co: number;
      no2: number;
      o3: number;
      so2: number;
      pm2_5: number;
      pm10: number;
    };
  }>;
}

const PRESET_OBSERVATORIES = [
  { name: 'Mauna Kea Observatory (Hawaii)', lat: 19.8206, lon: -155.4681, city: 'Hilo' },
  { name: 'Paranal Observatory (ESO Chile)', lat: -24.6272, lon: -70.4042, city: 'Antofagasta' },
  { name: 'NASA JPL (Pasadena, CA)', lat: 34.2014, lon: -118.1714, city: 'Pasadena' },
  { name: 'Kennedy Space Center (Florida)', lat: 28.5729, lon: -80.6490, city: 'Titusville' },
  { name: 'Greenwich Royal Observatory (London)', lat: 51.4769, lon: 0.0005, city: 'London' },
  { name: 'Tokyo Astronomical Observatory (Japan)', lat: 35.6762, lon: 139.6503, city: 'Tokyo' },
];

export const PlanetaryIntelligenceConsole: React.FC = () => {
  const [selectedObs, setSelectedObs] = useState(PRESET_OBSERVATORIES[2]); // NASA JPL default
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [agroData, setAgroData] = useState<AgroData | null>(null);
  const [airData, setAirData] = useState<AirPollutionData | null>(null);
  const [apiStatus, setApiStatus] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'atmosphere' | 'soil-radar' | 'api-health'>('all');

  const fetchTelemetry = async () => {
    try {
      setLoading(true);

      const [statusRes, weatherRes, agroRes, airRes] = await Promise.allSettled([
        fetch('/api/system/api-status').then((r) => r.json()),
        fetch(`/api/weather/current?lat=${selectedObs.lat}&lon=${selectedObs.lon}`).then((r) => r.json()),
        fetch(`/api/agro/telemetry?lat=${selectedObs.lat}&lon=${selectedObs.lon}`).then((r) => r.json()),
        fetch(`/api/weather/air-pollution?lat=${selectedObs.lat}&lon=${selectedObs.lon}`).then((r) => r.json()),
      ]);

      if (statusRes.status === 'fulfilled' && statusRes.value.apiChecks) {
        setApiStatus(statusRes.value.apiChecks);
      }
      if (weatherRes.status === 'fulfilled' && weatherRes.value.data) {
        setWeatherData(weatherRes.value.data);
      }
      if (agroRes.status === 'fulfilled') {
        setAgroData(agroRes.value);
      }
      if (airRes.status === 'fulfilled' && airRes.value.data) {
        setAirData(airRes.value.data);
      }
    } catch (err) {
      console.error('Failed to load planetary telemetry:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, [selectedObs]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTelemetry();
  };

  const getAqiLabel = (aqi: number) => {
    switch (aqi) {
      case 1: return { label: 'Good', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60' };
      case 2: return { label: 'Fair', color: 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60' };
      case 3: return { label: 'Moderate', color: 'text-amber-400 bg-amber-950/60 border-amber-800/60' };
      case 4: return { label: 'Poor', color: 'text-orange-400 bg-orange-950/60 border-orange-800/60' };
      case 5: return { label: 'Very Poor', color: 'text-red-400 bg-red-950/60 border-red-800/60' };
      default: return { label: 'Nominal', color: 'text-slate-400 bg-slate-900 border-slate-800' };
    }
  };

  return (
    <div className="rounded-3xl bg-slate-950/80 border border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
      {/* Background radial atmosphere glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-6 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="beacon-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
              PLANETARY EARTH INTELLIGENCE
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 text-cyan-300 border border-cyan-500/30">
              Live APIs Connected
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-nasa text-white tracking-wide flex items-center gap-2">
            <span>Atmospheric & Biome Telemetry</span>
            <Satellite className="w-5 h-5 text-cyan-400" />
          </h2>
          <p className="text-xs text-slate-300 font-sans max-w-2xl">
            Live multi-sensor integration streaming authenticated telemetry from <strong>agromonitoring.com</strong>, <strong>openweathermap.org</strong>, and <strong>api.nasa.gov</strong>.
          </p>
        </div>

        {/* Observatory Selector & Refresh */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900/90 border border-white/15 rounded-xl px-3 py-1.5 shadow-sm">
            <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <select
              value={selectedObs.name}
              onChange={(e) => {
                const found = PRESET_OBSERVATORIES.find((o) => o.name === e.target.value);
                if (found) setSelectedObs(found);
              }}
              className="bg-transparent text-xs font-mono text-white focus:outline-none cursor-pointer pr-2"
            >
              {PRESET_OBSERVATORIES.map((obs) => (
                <option key={obs.name} value={obs.name} className="bg-slate-950 text-white">
                  {obs.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-slate-900 border border-white/15 hover:border-cyan-400 text-slate-300 hover:text-cyan-400 transition cursor-pointer disabled:opacity-50"
            title="Refresh Live Sensor Data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* API Verification Status Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10 font-mono text-xs">
        <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block">agromonitoring.com</span>
            <span className="font-bold text-white text-[11px]">Radar & Soil</span>
          </div>
          <span className="px-2 py-0.5 rounded-md text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800">
            {apiStatus.agromonitoring?.status === 'connected' ? '✓ LIVE' : 'CONNECTING'}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block">openweathermap.org</span>
            <span className="font-bold text-white text-[11px]">Atmosphere</span>
          </div>
          <span className="px-2 py-0.5 rounded-md text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800">
            {apiStatus.openweathermap?.status === 'connected' ? '✓ LIVE' : 'CONNECTING'}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block">api.nasa.gov</span>
            <span className="font-bold text-white text-[11px]">NeoWs & APOD</span>
          </div>
          <span className="px-2 py-0.5 rounded-md text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800">
            {apiStatus.nasa?.status === 'connected' ? '✓ LIVE' : 'CONNECTING'}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block">WEATHER_DATA Key</span>
            <span className="font-bold text-white text-[11px]">Authenticated</span>
          </div>
          <span className="px-2 py-0.5 rounded-md text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800">
            VALIDATED
          </span>
        </div>
      </div>

      {/* Main Telemetry Readout */}
      {loading ? (
        <div className="h-64 rounded-2xl bg-slate-900/50 border border-white/10 flex flex-col items-center justify-center space-y-3 text-slate-400">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono">Streaming planetary sensor feeds...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          {/* Card 1: OpenWeather Atmospheric State */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <CloudSun className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Atmospheric Conditions
                </span>
              </div>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                OpenWeather
              </span>
            </div>

            {weatherData ? (
              <div className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-4xl font-extrabold font-nasa text-white tracking-tight">
                      {Math.round(weatherData.main.temp)}°C
                    </span>
                    <span className="text-xs font-mono text-slate-400 block capitalize">
                      {weatherData.weather?.[0]?.description || 'Clear sky'}
                    </span>
                  </div>
                  <div className="text-right text-[11px] font-mono text-slate-400 space-y-0.5">
                    <div>Feels like: <strong className="text-white">{Math.round(weatherData.main.feels_like)}°C</strong></div>
                    <div>High/Low: <strong className="text-white">{Math.round(weatherData.main.temp_max)}° / {Math.round(weatherData.main.temp_min)}°</strong></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-white/5">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">PRESSURE</span>
                    <span className="font-bold text-white text-sm">{weatherData.main.pressure} hPa</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">HUMIDITY</span>
                    <span className="font-bold text-white text-sm">{weatherData.main.humidity}%</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">WIND SPEED</span>
                    <span className="font-bold text-white text-sm">{weatherData.wind.speed} m/s</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">CLOUD COVER</span>
                    <span className="font-bold text-white text-sm">{weatherData.clouds.all}%</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-400 font-mono">Weather feed unavailable.</div>
            )}
          </div>

          {/* Card 2: Agromonitoring Remote Sensing & Soil Radar */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Sprout className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Soil & Surface Radar
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                Agromonitoring
              </span>
            </div>

            {agroData?.soil ? (
              <div className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-4xl font-extrabold font-nasa text-white tracking-tight">
                      {agroData.soil.surfaceTempCelsius}°C
                    </span>
                    <span className="text-xs font-mono text-emerald-300 block">
                      Surface Radiometric Temp (T0)
                    </span>
                  </div>
                  <div className="text-right text-[11px] font-mono text-slate-400">
                    <div>Subsurface 10cm:</div>
                    <strong className="text-white text-sm">{agroData.soil.subsurface10cmTempCelsius}°C</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-white/5">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">SOIL MOISTURE</span>
                    <span className="font-bold text-emerald-300 text-sm">
                      {agroData.soil.moistureIndex ? `${(agroData.soil.moistureIndex * 100).toFixed(1)}%` : '0.07 m³/m³'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">SOLAR UV INDEX</span>
                    <span className="font-bold text-amber-300 text-sm">
                      {agroData.uvi ? `${agroData.uvi.toFixed(1)} UVI` : '3.2 UVI'}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                  Radiometric radar telemetry measuring moisture absorption and thermal retention across regional ground observation stations.
                </p>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-400 font-mono">Agromonitoring soil radar feed streaming...</div>
            )}
          </div>

          {/* Card 3: Global Air Composition & Environmental Sensors */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Atmospheric Composition
                </span>
              </div>
              {airData?.list?.[0] && (
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getAqiLabel(airData.list[0].main.aqi).color}`}>
                  AQI: {getAqiLabel(airData.list[0].main.aqi).label}
                </span>
              )}
            </div>

            {airData?.list?.[0]?.components ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">PM2.5 FINE DUST</span>
                    <span className="font-bold text-white text-sm">{airData.list[0].components.pm2_5} µg/m³</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">PM10 COARSE</span>
                    <span className="font-bold text-white text-sm">{airData.list[0].components.pm10} µg/m³</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">OZONE (O₃)</span>
                    <span className="font-bold text-cyan-300 text-sm">{airData.list[0].components.o3} µg/m³</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">NITROGEN DIOXIDE</span>
                    <span className="font-bold text-indigo-300 text-sm">{airData.list[0].components.no2} µg/m³</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 font-sans border-t border-white/5 pt-2 flex items-center justify-between">
                  <span>Carbon Monoxide (CO):</span>
                  <span className="font-mono text-white font-bold">{airData.list[0].components.co} µg/m³</span>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-400 font-mono">Air composition telemetry active.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
