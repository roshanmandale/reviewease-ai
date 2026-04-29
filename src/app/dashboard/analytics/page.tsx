'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, QrCode, Star, Percent, Smartphone, Monitor, Tablet } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useBusinesses } from '@/hooks/useBusinesses';
import { useAuth } from '@/lib/auth-context';
import { getReviewClicks, getScanLogs } from '@/services/logService';
import { StatCard } from '@/components/ui/StatCard';
import { formatNumber } from '@/lib/utils';

const DEVICE_COLORS = ['#7c3aed', '#6366f1', '#a78bfa'];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { businesses, loading: bizLoading } = useBusinesses(user?.uid);
  const businessIds = businesses.map((b) => b.id);

  const [range, setRange] = useState<7 | 14 | 30>(14);
  const { data, loading, totalScans, totalClicks, conversionRate } = useAnalytics(
    businessIds,
    range
  );

  // Derived stats from real review_clicks
  const [ratingData, setRatingData] = useState([
    { rating: '5 ⭐', count: 0, fill: '#10b981' },
    { rating: '4 ⭐', count: 0, fill: '#6366f1' },
    { rating: '3 ⭐', count: 0, fill: '#f59e0b' },
    { rating: '2 ⭐', count: 0, fill: '#f97316' },
    { rating: '1 ⭐', count: 0, fill: '#ef4444' },
  ]);
  const [toneData, setToneData] = useState([
    { tone: 'Friendly', count: 0 },
    { tone: 'Professional', count: 0 },
    { tone: 'Hinglish', count: 0 },
    { tone: 'Hindi', count: 0 },
    { tone: 'Short', count: 0 },
  ]);
  const [deviceData, setDeviceData] = useState([
    { name: 'Mobile', value: 0 },
    { name: 'Desktop', value: 0 },
    { name: 'Tablet', value: 0 },
  ]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (bizLoading || businessIds.length === 0) {
      setStatsLoading(false);
      return;
    }

    async function loadStats() {
      setStatsLoading(true);
      try {
        // Aggregate across all businesses
        const allClicks = (
          await Promise.all(businessIds.map((id) => getReviewClicks(id)))
        ).flat();
        const allScans = (
          await Promise.all(businessIds.map((id) => getScanLogs(id)))
        ).flat();

        // Ratings
        const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        allClicks.forEach((c) => {
          if (c.rating >= 1 && c.rating <= 5) ratingCounts[c.rating]++;
        });
        setRatingData([
          { rating: '5 ⭐', count: ratingCounts[5], fill: '#10b981' },
          { rating: '4 ⭐', count: ratingCounts[4], fill: '#6366f1' },
          { rating: '3 ⭐', count: ratingCounts[3], fill: '#f59e0b' },
          { rating: '2 ⭐', count: ratingCounts[2], fill: '#f97316' },
          { rating: '1 ⭐', count: ratingCounts[1], fill: '#ef4444' },
        ]);

        // Tones
        const toneCounts: Record<string, number> = {
          Friendly: 0, Professional: 0, Hinglish: 0, Hindi: 0, Short: 0,
        };
        allClicks.forEach((c) => {
          if (c.tone in toneCounts) toneCounts[c.tone]++;
        });
        setToneData(Object.entries(toneCounts).map(([tone, count]) => ({ tone, count })));

        // Devices
        const deviceCounts: Record<string, number> = { mobile: 0, desktop: 0, tablet: 0 };
        allScans.forEach((s) => {
          if (s.deviceType in deviceCounts) deviceCounts[s.deviceType]++;
        });
        const total = Object.values(deviceCounts).reduce((a, b) => a + b, 0) || 1;
        setDeviceData([
          { name: 'Mobile', value: Math.round((deviceCounts.mobile / total) * 100) },
          { name: 'Desktop', value: Math.round((deviceCounts.desktop / total) * 100) },
          { name: 'Tablet', value: Math.round((deviceCounts.tablet / total) * 100) },
        ]);
      } catch (err) {
        console.error('Failed to load analytics stats:', err);
      } finally {
        setStatsLoading(false);
      }
    }

    loadStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bizLoading, businessIds.join(',')]);

  const chartData = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    Scans: d.scans,
    Clicks: d.clicks,
  }));

  const topBusinesses = businesses
    .map((b) => {
      const scanCount = 0; // will be populated from real data in future
      return { name: b.name, scans: scanCount };
    })
    .sort((a, b) => b.scans - a.scans);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Track your review funnel performance</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {([7, 14, 30] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                range === r
                  ? 'bg-white shadow-sm text-violet-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          {
            title: 'Total Scans',
            value: formatNumber(totalScans),
            change: `last ${range} days`,
            changeType: 'neutral' as const,
            icon: QrCode,
            iconColor: 'text-violet-600',
            iconBg: 'bg-violet-100',
          },
          {
            title: 'Review Clicks',
            value: formatNumber(totalClicks),
            change: `last ${range} days`,
            changeType: 'neutral' as const,
            icon: Star,
            iconColor: 'text-amber-600',
            iconBg: 'bg-amber-100',
          },
          {
            title: 'Conversion Rate',
            value: `${conversionRate}%`,
            change: 'scans → reviews',
            changeType: 'neutral' as const,
            icon: Percent,
            iconColor: 'text-emerald-600',
            iconBg: 'bg-emerald-100',
          },
          {
            title: 'Avg Daily Scans',
            value: range > 0 ? Math.round(totalScans / range) : 0,
            change: 'per day',
            changeType: 'neutral' as const,
            icon: TrendingUp,
            iconColor: 'text-indigo-600',
            iconBg: 'bg-indigo-100',
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <StatCard {...stat} />
          </motion.div>
        ))}
      </div>

      {/* Main chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
      >
        <h2 className="font-bold text-gray-900 mb-1">Scans vs Review Clicks</h2>
        <p className="text-xs text-gray-500 mb-6">Daily breakdown for the last {range} days</p>
        {loading ? (
          <div className="h-64 bg-gray-50 rounded-xl animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="scansGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="clicksGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Area
                type="monotone"
                dataKey="Scans"
                stroke="#7c3aed"
                strokeWidth={2.5}
                fill="url(#scansGrad2)"
              />
              <Area
                type="monotone"
                dataKey="Clicks"
                stroke="#f59e0b"
                strokeWidth={2.5}
                fill="url(#clicksGrad2)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* Row: Device + Ratings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
        >
          <h2 className="font-bold text-gray-900 mb-1">Device Breakdown</h2>
          <p className="text-xs text-gray-500 mb-6">How customers are scanning your QR codes</p>
          {statsLoading ? (
            <div className="h-40 bg-gray-50 rounded-xl animate-pulse" />
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {deviceData.map((_, index) => (
                      <Cell key={index} fill={DEVICE_COLORS[index % DEVICE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => `${v}%`}
                    contentStyle={{ borderRadius: '10px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3 flex-1">
                {deviceData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: DEVICE_COLORS[i % DEVICE_COLORS.length] }}
                      />
                      <span className="text-sm text-gray-600">{d.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Ratings distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
        >
          <h2 className="font-bold text-gray-900 mb-1">Ratings Selected</h2>
          <p className="text-xs text-gray-500 mb-6">Star ratings chosen by customers</p>
          {statsLoading ? (
            <div className="h-40 bg-gray-50 rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={ratingData} layout="vertical" barSize={14}>
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="rating"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip contentStyle={{ borderRadius: '10px', fontSize: '12px' }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {ratingData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      {/* Row: Tone usage + Top businesses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tone usage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
        >
          <h2 className="font-bold text-gray-900 mb-1">Review Tone Usage</h2>
          <p className="text-xs text-gray-500 mb-6">Which styles customers prefer</p>
          {statsLoading ? (
            <div className="h-48 bg-gray-50 rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={toneData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis
                  dataKey="tone"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={{ borderRadius: '10px', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#7c3aed" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Top businesses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
        >
          <h2 className="font-bold text-gray-900 mb-1">Your Businesses</h2>
          <p className="text-xs text-gray-500 mb-6">All active locations</p>
          {bizLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : businesses.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No businesses yet</p>
          ) : (
            <div className="space-y-4">
              {businesses.map((biz, i) => (
                <div key={biz.id} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-300 w-5">#{i + 1}</span>
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: biz.brandColor }}
                  >
                    {biz.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{biz.name}</p>
                    <p className="text-xs text-gray-400">{biz.category}</p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      biz.active
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {biz.active ? 'Active' : 'Off'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
