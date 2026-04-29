'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Building2,
  QrCode,
  Star,
  TrendingUp,
  Plus,
  ArrowRight,
  Activity,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useBusinesses } from '@/hooks/useBusinesses';
import { useAnalytics } from '@/hooks/useAnalytics';
import { getRecentActivity } from '@/services/logService';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatNumber } from '@/lib/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ActivityItem {
  id: string;
  type: 'scan' | 'review';
  business: string;
  time: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { businesses, loading: bizLoading } = useBusinesses(user?.uid);
  const businessIds = businesses.map((b) => b.id);
  const { data: analyticsData, totalScans, totalClicks, conversionRate } = useAnalytics(
    businessIds,
    7
  );
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);

  const activeBusinesses = businesses.filter((b) => b.active).length;

  // Load recent activity once businesses are fetched
  useEffect(() => {
    if (bizLoading || businessIds.length === 0) {
      setActivityLoading(false);
      return;
    }
    const nameMap = Object.fromEntries(businesses.map((b) => [b.id, b.name]));
    setActivityLoading(true);
    getRecentActivity(businessIds, nameMap, 8)
      .then(setActivity)
      .catch(() => setActivity([]))
      .finally(() => setActivityLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bizLoading, businessIds.join(',')]);

  const chartData = analyticsData.slice(-7).map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    Scans: d.scans,
    Clicks: d.clicks,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good morning, {user?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Here&apos;s what&apos;s happening with your businesses today.
          </p>
        </div>
        <Link href="/dashboard/businesses/new">
          <Button size="sm">
            <Plus size={16} />
            Add Business
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <StatCard
            title="Total Businesses"
            value={bizLoading ? '—' : businesses.length}
            change={`${activeBusinesses} active`}
            changeType="neutral"
            icon={Building2}
            iconColor="text-violet-600"
            iconBg="bg-violet-100"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <StatCard
            title="QR Scans"
            value={formatNumber(totalScans)}
            change="last 7 days"
            changeType="neutral"
            icon={QrCode}
            iconColor="text-indigo-600"
            iconBg="bg-indigo-100"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <StatCard
            title="Review Clicks"
            value={formatNumber(totalClicks)}
            change="last 7 days"
            changeType="neutral"
            icon={Star}
            iconColor="text-amber-600"
            iconBg="bg-amber-100"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <StatCard
            title="Conversion Rate"
            value={`${conversionRate}%`}
            change="scans → reviews"
            changeType="neutral"
            icon={TrendingUp}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-100"
          />
        </motion.div>
      </div>

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-bold text-gray-900">Scans &amp; Review Clicks</h2>
              <p className="text-xs text-gray-500 mt-0.5">Last 7 days</p>
            </div>
            <Link href="/dashboard/analytics">
              <Button variant="ghost" size="sm" className="text-violet-600">
                Full Report <ArrowRight size={14} />
              </Button>
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="scansGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="clicksGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  fontSize: '12px',
                }}
              />
              <Area type="monotone" dataKey="Scans" stroke="#7c3aed" strokeWidth={2} fill="url(#scansGrad)" />
              <Area type="monotone" dataKey="Clicks" stroke="#f59e0b" strokeWidth={2} fill="url(#clicksGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <Activity size={16} className="text-violet-600" />
            <h2 className="font-bold text-gray-900">Recent Activity</h2>
          </div>

          {activityLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : activity.length === 0 ? (
            <div className="text-center py-8">
              <Activity size={28} className="text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No activity yet</p>
              <p className="text-xs text-gray-300 mt-1">Scans and reviews will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activity.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      item.type === 'scan' ? 'bg-violet-100' : 'bg-amber-100'
                    }`}
                  >
                    {item.type === 'scan' ? (
                      <QrCode size={14} className="text-violet-600" />
                    ) : (
                      <Star size={14} className="text-amber-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.business}</p>
                    <p className="text-xs text-gray-500">
                      {item.type === 'scan' ? 'QR scanned' : 'Review clicked'} · {item.time}
                    </p>
                  </div>
                  <Badge variant={item.type === 'scan' ? 'purple' : 'warning'} className="flex-shrink-0">
                    {item.type}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Businesses quick view */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Your Businesses</h2>
          <Link href="/dashboard/businesses">
            <Button variant="ghost" size="sm" className="text-violet-600">
              View all <ArrowRight size={14} />
            </Button>
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {bizLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : businesses.length === 0 ? (
            <div className="p-12 text-center">
              <Building2 size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No businesses yet</p>
              <p className="text-sm text-gray-400 mt-1">Add your first business to get started</p>
              <Link href="/dashboard/businesses/new" className="mt-4 inline-block">
                <Button size="sm">
                  <Plus size={15} /> Add Business
                </Button>
              </Link>
            </div>
          ) : (
            businesses.slice(0, 5).map((biz) => (
              <div
                key={biz.id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: biz.brandColor }}
                >
                  {biz.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{biz.name}</p>
                  <p className="text-xs text-gray-500">
                    {biz.category} · {biz.city}
                  </p>
                </div>
                <Badge variant={biz.active ? 'success' : 'warning'}>
                  {biz.active ? 'Active' : 'Inactive'}
                </Badge>
                <Link href={`/b/${biz.slug}`} target="_blank">
                  <button className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors">
                    <ArrowRight size={14} />
                  </button>
                </Link>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
