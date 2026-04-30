'use client';

import React, { useState, useEffect } from 'react';
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
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getAllUsers, adminUpdateUser } from '@/services/authService';
import { User, UserRole } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';

export default function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState('');
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    role: UserRole;
    businessLimit: number;
    plan: string;
    disabled: boolean;
  }>({ role: 'owner', businessLimit: 1, plan: 'free', disabled: false });
  const [saving, setSaving] = useState(false);

  // Guard: redirect non-admins
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push('/dashboard');
    }
  }, [user, isAdmin, loading, router]);

  const fetchUsers = async () => {
    setFetching(true);
    try {
      const all = await getAllUsers();
      setUsers(all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch {
      toast.error('Failed to load users');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

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
    });
  };

  const cancelEdit = () => setEditingUid(null);

  const saveEdit = async (uid: string) => {
    // Prevent admin from editing their own role
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
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.uid === uid
            ? { ...u, role: editForm.role, businessLimit: editForm.businessLimit, plan: editForm.plan as User['plan'], disabled: editForm.disabled }
            : u
        )
      );
      toast.success('User updated');
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

  if (loading || !isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
            <Shield size={20} className="text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-500 text-sm mt-0.5">{users.length} total users</p>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchUsers}>
          <RefreshCw size={14} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: users.length, color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'Admins', value: users.filter((u) => u.role === 'admin').length, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Disabled', value: users.filter((u) => u.disabled).length, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Pro+ Plans', value: users.filter((u) => u.plan === 'pro' || u.plan === 'agency').length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.bg} rounded-2xl p-4`}>
            <p className="text-xs font-medium text-gray-500">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <Input
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        leftIcon={<Search size={15} />}
      />

      {/* Users table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 font-semibold text-gray-600">User</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Role</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Plan</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Biz Limit</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Joined</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {fetching ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                    <Users size={32} className="mx-auto mb-2 text-gray-200" />
                    No users found
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <motion.tr
                    key={u.uid}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`hover:bg-gray-50 transition-colors ${u.disabled ? 'opacity-50' : ''}`}
                  >
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{u.name}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-5 py-4">
                      {editingUid === u.uid ? (
                        <select
                          value={editForm.role}
                          onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
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
                          onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                          className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                        >
                          {['free', 'starter', 'pro', 'agency'].map((p) => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="capitalize text-gray-700">{u.plan}</span>
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
                            setEditForm({ ...editForm, businessLimit: parseInt(e.target.value) || 0 })
                          }
                          className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                      ) : (
                        <span className="font-mono text-gray-700">{u.businessLimit}</span>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
