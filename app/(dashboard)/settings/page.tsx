'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Shield, Palette, Globe, CreditCard, Download, Trash2, LogOut } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ThemeToggle } from '@/components/theme-toggle';

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    expenseUpdates: true,
    goalMilestones: true,
    roomInvites: true,
    weeklyReports: false,
    taskReminders: true,
  });

  const [privacy, setPrivacy] = useState({
    profileVisibility: 'friends',
    expenseVisibility: 'room-members',
    allowDataExport: true,
  });

  const [preferences, setPreferences] = useState({
    currency: 'INR',
    language: 'en',
    dateFormat: 'dd/mm/yyyy',
    autoBackup: true,
  });

  const [budgetAlerts, setBudgetAlerts] = useState([80]);

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Customize your SplitlyFi experience</p>
      </motion.div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Manage how you receive notifications and updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {[
                  { key: 'expenseUpdates', label: 'Expense Updates', description: 'Get notified when expenses are added or modified' },
                  { key: 'goalMilestones', label: 'Goal Milestones', description: 'Celebrate when you reach savings milestones' },
                  { key: 'roomInvites', label: 'Room Invitations', description: 'Receive notifications for room invitations' },
                  { key: 'weeklyReports', label: 'Weekly Reports', description: 'Get weekly spending summaries via email' },
                  { key: 'taskReminders', label: 'Task Reminders', description: 'Reminders for pending tasks and deadlines' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor={item.key} className="font-medium">{item.label}</Label>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <Switch
                      id={item.key}
                      checked={notifications[item.key as keyof typeof notifications]}
                      onCheckedChange={(checked) => 
                        setNotifications(prev => ({ ...prev, [item.key]: checked }))
                      }
                    />
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Budget Alerts</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Alert when spending reaches</span>
                    <span className="font-medium">{budgetAlerts[0]}% of budget</span>
                  </div>
                  <Slider
                    value={budgetAlerts}
                    onValueChange={setBudgetAlerts}
                    max={100}
                    min={50}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    You'll receive an alert when your spending reaches {budgetAlerts[0]}% of your set budget
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Privacy & Security */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy & Security
              </CardTitle>
              <CardDescription>
                Control your privacy settings and account security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="font-medium">Profile Visibility</Label>
                    <p className="text-sm text-muted-foreground">Who can see your profile information</p>
                  </div>
                  <Select value={privacy.profileVisibility} onValueChange={(value) => 
                    setPrivacy(prev => ({ ...prev, profileVisibility: value }))
                  }>
                    <SelectTrigger className="w-40 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="friends">Friends Only</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="font-medium">Expense Visibility</Label>
                    <p className="text-sm text-muted-foreground">Who can see your expense details</p>
                  </div>
                  <Select value={privacy.expenseVisibility} onValueChange={(value) => 
                    setPrivacy(prev => ({ ...prev, expenseVisibility: value }))
                  }>
                    <SelectTrigger className="w-40 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="room-members">Room Members</SelectItem>
                      <SelectItem value="friends">Friends Only</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="font-medium">Allow Data Export</Label>
                    <p className="text-sm text-muted-foreground">Enable downloading your data</p>
                  </div>
                  <Switch
                    checked={privacy.allowDataExport}
                    onCheckedChange={(checked) => 
                      setPrivacy(prev => ({ ...prev, allowDataExport: checked }))
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium">Security Actions</h4>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" className="rounded-xl">
                    Change Password
                  </Button>
                  <Button variant="outline" className="rounded-xl">
                    Enable 2FA
                  </Button>
                  <Button variant="outline" className="rounded-xl">
                    View Login History
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Appearance & Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance & Preferences
              </CardTitle>
              <CardDescription>
                Customize the look and feel of your app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="font-medium">Theme</Label>
                    <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
                  </div>
                  <ThemeToggle />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="font-medium">Currency</Label>
                    <p className="text-sm text-muted-foreground">Default currency for expenses</p>
                  </div>
                  <Select value={preferences.currency} onValueChange={(value) => 
                    setPreferences(prev => ({ ...prev, currency: value }))
                  }>
                    <SelectTrigger className="w-32 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">₹ INR</SelectItem>
                      <SelectItem value="USD">$ USD</SelectItem>
                      <SelectItem value="EUR">€ EUR</SelectItem>
                      <SelectItem value="GBP">£ GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="font-medium">Language</Label>
                    <p className="text-sm text-muted-foreground">App display language</p>
                  </div>
                  <Select value={preferences.language} onValueChange={(value) => 
                    setPreferences(prev => ({ ...prev, language: value }))
                  }>
                    <SelectTrigger className="w-32 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">हिंदी</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="font-medium">Date Format</Label>
                    <p className="text-sm text-muted-foreground">How dates are displayed</p>
                  </div>
                  <Select value={preferences.dateFormat} onValueChange={(value) => 
                    setPreferences(prev => ({ ...prev, dateFormat: value }))
                  }>
                    <SelectTrigger className="w-40 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                      <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                      <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="font-medium">Auto Backup</Label>
                    <p className="text-sm text-muted-foreground">Automatically backup your data</p>
                  </div>
                  <Switch
                    checked={preferences.autoBackup}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({ ...prev, autoBackup: checked }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Data & Storage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Data & Storage
              </CardTitle>
              <CardDescription>
                Manage your data and storage preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-2xl">
                  <p className="text-2xl font-bold">2.4 MB</p>
                  <p className="text-sm text-muted-foreground">Data Used</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-2xl">
                  <p className="text-2xl font-bold">156</p>
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-2xl">
                  <p className="text-2xl font-bold">12</p>
                  <p className="text-sm text-muted-foreground">Receipts Stored</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Data Management</h4>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" className="rounded-xl">
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>
                  <Button variant="outline" className="rounded-xl">
                    Clear Cache
                  </Button>
                  <Button variant="outline" className="rounded-xl">
                    Sync Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Account Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible actions that affect your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" className="rounded-xl border-red-200 text-red-600 hover:bg-red-50">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out All Devices
                </Button>
                <Button variant="outline" className="rounded-xl border-red-200 text-red-600 hover:bg-red-50">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Deleting your account will permanently remove all your data, including expenses, goals, and room memberships. This action cannot be undone.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex justify-center pt-6"
        >
          <Button size="lg" className="rounded-2xl px-8">
            Save All Changes
          </Button>
        </motion.div>
      </div>
    </div>
  );
}