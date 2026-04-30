'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Shield,
  Users,
  Search,
  Edit2,
  Check,
  X,
  Ban,
  RefreshCw,
  Building2,
  QrCode,
  Star,
  TrendingUp,
  Eye,
  ChevronDown,
  ChevronUp,
  UserPlus,
  Play,
  FileText,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getAllUsers, adminUpdateUser } from '@/services/authService';
import { getAllBusinesses } from '@/services/businessService';
import { User, UserRole, Business } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatCard } from '@/components/ui/StatCard';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState('');
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [expandedUid, setExpandedUid] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    role: UserRole;
    businessLimit: number;
    plan: string;
    disabled: boolean;
    approvalStatus: User['approvalStatus'];
  }>({ role: 'owner', businessLimit: 1, plan: 'free', disabled: false, approvalStatus: 'idle' });
  const [saving, setSaving] = useState(false);
  const [runningRetention, setRunningRetention] = useState(false);
  const [retentionResult, setRetentionResult] = useState<{
    success: number; skipped: number; errors: number;
    totalScansDeleted: number; totalClicksDeleted: number;
  } | null>(null);

  // Guard: redirect non-admins
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push('/dashboard');
    }
  }, [user, isAdmin, loading, router]);

  // Run the retention/cleanup job manually
  const handleRunRetention = async () => {
    setRunningRetention(true);
    setRetentionResult(null);
    try {
      const res = await fetch('/api/cron/retention', { method: 'GET' });
      const data = await res.json();
      if (res.ok) {
        setRetentionResult(data);
        toast.success(
          `✅ Done! ${data.success} reports generated, ${data.totalScansDeleted + data.totalClicksDeleted} old logs deleted.`
        );
        // Refresh businesses to show updated nextDeletionDate
        await fetchAll();
      } else {
        toast.error(data.error || 'Retention job failed');
      }
    } catch {
      toast.error('Failed to run retention job. Check console.');
    } finally {
      setRunningRetention(false);
    }
  };

  const fetchAll = useCallback(async () => {
    setFetching(true);
    try {
      const [allUsers, allBiz] = await Promise.all([getAllUsers(), getAllBusinesses()]);
      setUsers(
        allUsers.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
      setBusinesses(allBiz);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load data');
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchAll();
  }, [isAdmin, fetchAll]);

  // Platform stats
  const totalUsers = users.length;
  const totalBusinesses = businesses.length;
  const activeBusinesses = businesses.filter((b) => b.active).length;
  const ownerCount = users.filter((u) => u.role === 'owner').length;

  // Businesses per user map
  const bizByOwner = businesses.reduce<Record<string, Business[]>>((acc, b) => {
    if (!acc[b.ownerUid]) acc[b.ownerUid] = [];
    acc[b.ownerUid].push(b);
    return acc;
  }, {});

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const startEdit = (u: User) => {
    setEditingUid(u.uid);
    setEditForm({
      role: u.role,
      businessLimit: u.businessLimit,
      plan: u.plan,
      disabled: u.disabled,
      approvalStatus: u.approvalStatus,
    });
  };

  const cancelEdit = () => setEditingUid(null);

  const saveEdit = async (uid: string) => {
    if (uid === user?.uid && editForm.role !== 'admin') {
      toast.error("You can't remove your own admin role.");
      return;
    }
    setSaving(true);
    try {
      await adminUpdateUser(uid, {
        role: editForm.role,
        businessLimit: editForm.businessLimit,
        plan: editForm.plan as User['plan'],
        disabled: editForm.disabled,
        approvalStatus: editForm.approvalStatus,
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.uid === uid
            ? {
                ...u,
                role: editForm.role,
                businessLimit: editForm.businessLimit,
                plan: editForm.plan as User['plan'],
                disabled: editForm.disabled,
                approvalStatus: editForm.approvalStatus,
              }
            : u
        )
      );
      toast.success('User updated ✅');
      setEditingUid(null);
    } catch {
      toast.error('Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const toggleDisable = async (u: User) => {
    if (u.uid === user?.uid) {
      toast.error("You can't disable your own account.");
      return;
    }
    try {
      await adminUpdateUser(u.uid, { disabled: !u.disabled });
      setUsers((prev) =>
        prev.map((x) => (x.uid === u.uid ? { ...x, disabled: !u.disabled } : x))
      );
      toast.success(u.disabled ? 'User enabled' : 'User disabled');
    } catch {
      toast.error('Failed to update user');
    }
  };

  const handleUpdateStatus = async (uid: string, status: User['approvalStatus']) => {
    try {
      await adminUpdateUser(uid, { approvalStatus: status });
      setUsers((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, approvalStatus: status } : u))
      );
      toast.success(`User ${status} ✅`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  if (loading || !isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Platform overview · {totalUsers} users · {totalBusinesses} businesses
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={fetchAll}>
            <RefreshCw size={14} />
            Refresh
          </Button>
          <Link href="/register">
            <Button size="sm">
              <UserPlus size={14} />
              Create User
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Data Retention Control ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100 rounded-2xl p-5"
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Trash2 size={18} className="text-violet-600" />
            </div>
            <div>
              <p className="font-bold text-gray-900">Data Retention Job</p>
              <p className="text-sm text-gray-500 mt-0.5">
                Generates PDF reports for all businesses, then deletes logs older than 15 days.
                Runs automatically every day at 2 AM. Click to run manually now.
              </p>
              {retentionResult && (
                <div className="mt-3 flex flex-wrap gap-3">
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-medium">
                    ✅ {retentionResult.success} reports generated
                  </span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                    ⏭ {retentionResult.skipped} skipped (no old data)
                  </span>
                  <span className="text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-medium">
                    🗑 {retentionResult.totalScansDeleted + retentionResult.totalClicksDeleted} logs deleted
                  </span>
                  {retentionResult.errors > 0 && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-medium">
                      ⚠️ {retentionResult.errors} errors
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/dashboard/reports">
              <Button variant="secondary" size="sm">
                <FileText size={14} />
                View Reports
              </Button>
            </Link>
            <Button
              size="sm"
              loading={runningRetention}
              onClick={handleRunRetention}
              className="bg-violet-600 hover:bg-violet-700"
            >
              <Play size={14} />
              {runningRetention ? 'Running...' : 'Run Retention Now'}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ── Platform Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <StatCard
            title="Total Users"
            value={fetching ? '—' : totalUsers}
            change={`${ownerCount} owners`}
            changeType="neutral"
            icon={Users}
            iconColor="text-violet-600"
            iconBg="bg-violet-100"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <StatCard
            title="Total Businesses"
            value={fetching ? '—' : totalBusinesses}
            change={`${activeBusinesses} active`}
            changeType="neutral"
            icon={Building2}
            iconColor="text-indigo-600"
            iconBg="bg-indigo-100"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <StatCard
            title="Active Businesses"
            value={fetching ? '—' : activeBusinesses}
            change={`${totalBusinesses - activeBusinesses} inactive`}
            changeType="neutral"
            icon={TrendingUp}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-100"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <StatCard
            title="Disabled Accounts"
            value={fetching ? '—' : users.filter((u) => u.disabled).length}
            change="blocked users"
            changeType="neutral"
            icon={Ban}
            iconColor="text-red-500"
            iconBg="bg-red-100"
          />
        </motion.div>
      </div>

      {/* ── All Businesses Overview ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-violet-600" />
            <h2 className="font-bold text-gray-900">All Businesses</h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {totalBusinesses}
            </span>
          </div>
        </div>
        {fetching ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : businesses.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Building2 size={32} className="mx-auto mb-2 text-gray-200" />
            No businesses yet
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {businesses.map((biz) => {
              const owner = users.find((u) => u.uid === biz.ownerUid);
              return (
                <div
                  key={biz.id}
                  className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: biz.brandColor }}
                  >
                    {biz.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{biz.name}</p>
                    <p className="text-xs text-gray-400">
                      {biz.category} · {biz.city}
                      {owner && (
                        <span className="ml-2 text-violet-500">
                          Owner: {owner.name}
                        </span>
                      )}
                    </p>
                  </div>
                  <Badge variant={biz.active ? 'success' : 'warning'}>
                    {biz.active ? 'Active' : 'Inactive'}
                  </Badge>
                  <a
                    href={`/b/${biz.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                    title="Preview review page"
                  >
                    <Eye size={14} />
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ── Users Management ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-violet-600" />
            <h2 className="font-bold text-gray-900">User Management</h2>
          </div>
          <div className="max-w-xs w-full">
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search size={14} />}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">User</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Role</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Plan</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Biz Limit</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Businesses</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Approval</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Joined</th>
                  <th className="text-right px-5 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {fetching ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-12 text-center text-gray-400">
                      <Users size={32} className="mx-auto mb-2 text-gray-200" />
                      No users found
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => {
                    const userBiz = bizByOwner[u.uid] || [];
                    const isExpanded = expandedUid === u.uid;

                    return (
                      <React.Fragment key={u.uid}>
                        <motion.tr
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={`hover:bg-gray-50 transition-colors ${u.disabled ? 'opacity-50' : ''}`}
                        >
                          {/* User info */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{u.name}</p>
                                <p className="text-xs text-gray-500">{u.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="px-5 py-4">
                            {editingUid === u.uid ? (
                              <select
                                value={editForm.role}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, role: e.target.value as UserRole })
                                }
                                className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                              >
                                <option value="owner">owner</option>
                                <option value="admin">admin</option>
                              </select>
                            ) : (
                              <Badge variant={u.role === 'admin' ? 'purple' : 'default'}>
                                {u.role}
                              </Badge>
                            )}
                          </td>

                          {/* Plan */}
                          <td className="px-5 py-4">
                            {editingUid === u.uid ? (
                              <select
                                value={editForm.plan}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, plan: e.target.value })
                                }
                                className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                              >
                                {['free', 'starter', 'pro', 'agency'].map((p) => (
                                  <option key={p} value={p}>
                                    {p}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="capitalize text-gray-700 text-xs">{u.plan}</span>
                            )}
                          </td>

                          {/* Business Limit */}
                          <td className="px-5 py-4">
                            {editingUid === u.uid ? (
                              <input
                                type="number"
                                min={0}
                                max={999}
                                value={editForm.businessLimit}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    businessLimit: parseInt(e.target.value) || 0,
                                  })
                                }
                                className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                              />
                            ) : (
                              <span className="font-mono text-gray-700 text-xs">
                                {userBiz.length} / {u.businessLimit}
                              </span>
                            )}
                          </td>

                          {/* Businesses count — expandable */}
                          <td className="px-5 py-4">
                            {userBiz.length > 0 ? (
                              <button
                                onClick={() =>
                                  setExpandedUid(isExpanded ? null : u.uid)
                                }
                                className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 font-medium"
                              >
                                {userBiz.length} biz
                                {isExpanded ? (
                                  <ChevronUp size={12} />
                                ) : (
                                  <ChevronDown size={12} />
                                )}
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400">None</span>
                            )}
                          </td>

                          {/* Approval Status */}
                          <td className="px-5 py-4">
                             {editingUid === u.uid ? (
                               <select
                                 value={editForm.approvalStatus}
                                 onChange={(e) =>
                                   setEditForm({ ...editForm, approvalStatus: e.target.value as User['approvalStatus'] })
                                 }
                                 className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                               >
                                 <option value="idle">Idle</option>
                                 <option value="pending">Pending</option>
                                 <option value="approved">Approved</option>
                                 <option value="rejected">Rejected</option>
                               </select>
                             ) : (
                               <Badge
                                 variant={
                                   u.approvalStatus === 'approved'
                                     ? 'success'
                                     : u.approvalStatus === 'pending'
                                     ? 'warning'
                                     : u.approvalStatus === 'rejected'
                                     ? 'danger'
                                     : 'default'
                                 }
                               >
                                 {u.approvalStatus}
                               </Badge>
                             )}
                           </td>

                          {/* Status */}
                          <td className="px-5 py-4">
                            <Badge variant={u.disabled ? 'danger' : 'success'}>
                              {u.disabled ? 'Disabled' : 'Active'}
                            </Badge>
                          </td>

                          {/* Joined */}
                          <td className="px-5 py-4 text-gray-500 text-xs">
                            {u.createdAt ? formatDate(u.createdAt) : '—'}
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-1.5">
                              {editingUid === u.uid ? (
                                <>
                                  <button
                                    onClick={() => saveEdit(u.uid)}
                                    disabled={saving}
                                    className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                    title="Save"
                                  >
                                    <Check size={14} />
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                                    title="Cancel"
                                  >
                                    <X size={14} />
                                  </button>
                                </>
                              ) : (
                                <>
                                    {u.approvalStatus !== 'approved' && (
                                      <button
                                        onClick={() => handleUpdateStatus(u.uid, 'approved')}
                                        className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                        title="Approve User"
                                      >
                                        <Check size={14} />
                                      </button>
                                    )}
                                    {u.approvalStatus !== 'rejected' && u.approvalStatus !== 'idle' && (
                                      <button
                                        onClick={() => handleUpdateStatus(u.uid, 'rejected')}
                                        className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                        title="Reject User"
                                      >
                                        <X size={14} />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => startEdit(u)}
                                      className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                                      title="Edit user"
                                    >
                                      <Edit2 size={14} />
                                    </button>
                                    <button
                                      onClick={() => toggleDisable(u)}
                                      disabled={u.uid === user?.uid}
                                      className={`p-1.5 rounded-lg transition-colors ${
                                        u.disabled
                                          ? 'text-emerald-500 hover:bg-emerald-50'
                                          : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                                      } disabled:opacity-30 disabled:cursor-not-allowed`}
                                      title={u.disabled ? 'Enable user' : 'Disable user'}
                                    >
                                      <Ban size={14} />
                                    </button>
                                </>
                              )}
                            </div>
                          </td>
                        </motion.tr>

                        {/* Expanded businesses row */}
                        {isExpanded && userBiz.length > 0 && (
                          <tr>
                            <td colSpan={8} className="px-5 pb-4 bg-violet-50/50">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-2">
                                {userBiz.map((biz) => (
                                  <div
                                    key={biz.id}
                                    className="flex items-center gap-2.5 bg-white rounded-xl px-3 py-2.5 border border-violet-100"
                                  >
                                    <div
                                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                      style={{ backgroundColor: biz.brandColor }}
                                    >
                                      {biz.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-gray-900 truncate">
                                        {biz.name}
                                      </p>
                                      <p className="text-xs text-gray-400">
                                        {biz.category} · {biz.city}
                                      </p>
                                    </div>
                                    <Badge
                                      variant={biz.active ? 'success' : 'warning'}
                                    >
                                      {biz.active ? 'On' : 'Off'}
                                    </Badge>
                                    <a
                                      href={`/b/${biz.slug}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-gray-400 hover:text-violet-600 transition-colors"
                                    >
                                      <Eye size={13} />
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
