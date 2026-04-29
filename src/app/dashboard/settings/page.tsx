'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Lock,
  Bell,
  CreditCard,
  Shield,
  Eye,
  EyeOff,
  Check,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { PRICING_PLANS } from '@/data/mock';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user } = useAuth();

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    newPass: '',
    confirm: '',
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [notifications, setNotifications] = useState({
    newScan: true,
    reviewClick: true,
    weeklyReport: true,
    productUpdates: false,
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const currentPlan = PRICING_PLANS.find((p) => p.id === (user?.plan || 'free'));

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    await new Promise((r) => setTimeout(r, 800));
    toast.success('Profile updated successfully');
    setSavingProfile(false);
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPass !== passwordForm.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordForm.newPass.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setSavingPassword(true);
    await new Promise((r) => setTimeout(r, 800));
    toast.success('Password changed successfully');
    setPasswordForm({ current: '', newPass: '', confirm: '' });
    setSavingPassword(false);
  };

  const sections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'password', label: 'Password', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <User size={16} className="text-violet-600" />
          <h2 className="font-bold text-gray-900">Profile</h2>
        </div>
        <div className="p-6">
          {/* Avatar section */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
            <Avatar name={user?.name || 'User'} size="xl" />
            <div>
              <p className="font-semibold text-gray-900">{user?.name}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <button className="mt-2 text-xs text-violet-600 hover:text-violet-700 font-medium">
                Change avatar
              </button>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <Input
              label="Full Name"
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              leftIcon={<User size={14} />}
            />
            <Input
              label="Email Address"
              type="email"
              value={profileForm.email}
              onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
            />
            <Button type="submit" loading={savingProfile} size="sm">
              <Check size={14} />
              Save Changes
            </Button>
          </form>
        </div>
      </motion.div>

      {/* Password */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Lock size={16} className="text-violet-600" />
          <h2 className="font-bold text-gray-900">Change Password</h2>
        </div>
        <div className="p-6">
          <form onSubmit={handleSavePassword} className="space-y-4">
            <div className="relative">
              <Input
                label="Current Password"
                type={showPasswords ? 'text' : 'password'}
                value={passwordForm.current}
                onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                placeholder="••••••••"
                leftIcon={<Lock size={14} />}
              />
            </div>
            <Input
              label="New Password"
              type={showPasswords ? 'text' : 'password'}
              value={passwordForm.newPass}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPass: e.target.value })}
              placeholder="••••••••"
              leftIcon={<Lock size={14} />}
            />
            <Input
              label="Confirm New Password"
              type={showPasswords ? 'text' : 'password'}
              value={passwordForm.confirm}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
              placeholder="••••••••"
              leftIcon={<Lock size={14} />}
            />
            <div className="flex items-center justify-between">
              <Toggle
                checked={showPasswords}
                onChange={setShowPasswords}
                label="Show passwords"
              />
              <Button type="submit" loading={savingPassword} size="sm">
                Update Password
              </Button>
            </div>
          </form>
        </div>
      </motion.div>

      {/* Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Bell size={16} className="text-violet-600" />
          <h2 className="font-bold text-gray-900">Notifications</h2>
        </div>
        <div className="p-6 space-y-5">
          {[
            { key: 'newScan', label: 'New QR Scan', desc: 'Get notified when someone scans your QR code' },
            { key: 'reviewClick', label: 'Review Click', desc: 'Get notified when a customer clicks to review' },
            { key: 'weeklyReport', label: 'Weekly Report', desc: 'Receive a weekly analytics summary' },
            { key: 'productUpdates', label: 'Product Updates', desc: 'News about new features and improvements' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
              <Toggle
                checked={notifications[item.key as keyof typeof notifications]}
                onChange={(v) => setNotifications({ ...notifications, [item.key]: v })}
              />
            </div>
          ))}
          <Button
            size="sm"
            onClick={() => toast.success('Notification preferences saved')}
          >
            <Check size={14} />
            Save Preferences
          </Button>
        </div>
      </motion.div>

      {/* Billing */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <CreditCard size={16} className="text-violet-600" />
          <h2 className="font-bold text-gray-900">Billing & Plan</h2>
        </div>
        <div className="p-6 space-y-5">
          {/* Current plan */}
          <div className="flex items-center justify-between p-4 bg-violet-50 rounded-2xl border border-violet-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                <Sparkles size={18} className="text-violet-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{currentPlan?.name} Plan</p>
                <p className="text-xs text-gray-500">
                  {currentPlan?.price === 0 ? 'Free forever' : `₹${currentPlan?.price?.toLocaleString()}/month`}
                </p>
              </div>
            </div>
            <Badge variant="purple">Current</Badge>
          </div>

          {/* Plan features */}
          <div className="space-y-2">
            {currentPlan?.features.map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                <Check size={14} className="text-emerald-500 flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <Button className="flex-1">Upgrade Plan</Button>
            <Button variant="secondary" className="flex-1">
              Manage Billing
            </Button>
          </div>

          <p className="text-xs text-gray-400 text-center">
            Billing is managed securely. Cancel anytime.
          </p>
        </div>
      </motion.div>

      {/* Danger zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-red-100 flex items-center gap-2">
          <Shield size={16} className="text-red-500" />
          <h2 className="font-bold text-gray-900">Danger Zone</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Delete Account</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Permanently delete your account and all data. This cannot be undone.
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => toast.error('Please contact support to delete your account.')}
            >
              Delete Account
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
