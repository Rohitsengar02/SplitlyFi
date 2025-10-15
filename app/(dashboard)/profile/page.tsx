'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, CreditCard as Edit, Settings, TrendingUp, Target, Users, DollarSign, Award, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/components/auth-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { useRouter } from 'next/navigation';

const userStats = {
  totalExpenses: 0,
  activeRooms: 0,
  completedGoals: 0,
  totalSavings: 0,
  joinedDate: new Date().toISOString().slice(0, 10),
  expenseCategories: [
    { name: 'Food', amount: 0, percentage: 0 },
    { name: 'Transport', amount: 0, percentage: 0 },
    { name: 'Entertainment', amount: 0, percentage: 0 },
    { name: 'Utilities', amount: 0, percentage: 0 },
    { name: 'Others', amount: 0, percentage: 0 },
  ],
  monthlyTrend: [
    { month: 'Jan', amount: 0 },
    { month: 'Feb', amount: 0 },
    { month: 'Mar', amount: 0 },
    { month: 'Apr', amount: 0 },
    { month: 'May', amount: 0 },
  ],
  achievements: [
    { id: 1, title: 'First Goal Completed', description: 'Completed your first savings goal', icon: '🎯', earned: false },
    { id: 2, title: 'Expense Tracker', description: 'Logged 100+ expenses', icon: '📊', earned: false },
    { id: 3, title: 'Team Player', description: 'Joined 3+ rooms', icon: '👥', earned: false },
    { id: 4, title: 'Budget Master', description: 'Stayed under budget for 3 months', icon: '💰', earned: false },
    { id: 5, title: 'Savings Champion', description: 'Saved ₹1,00,000+', icon: '🏆', earned: false },
  ],
};

export default function ProfilePage() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { profile, loading, updateProfile } = useAuth();
  const router = useRouter();
  const [profileData, setProfileData] = useState({
    displayName: '',
    email: '',
    bio: '',
    photoURL: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile) {
      setProfileData({
        displayName: profile.displayName || 'User',
        email: profile.email || '',
        bio: profile.bio || '',
        photoURL: profile.photoURL || '',
      });
    }
  }, [profile]);

  const earnedAchievements = userStats.achievements.filter(a => a.earned);
  const totalAchievements = userStats.achievements.length;

  if (loading || !profile) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="relative inline-block mb-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={profileData.photoURL} />
            <AvatarFallback className="text-2xl">{(profileData.displayName?.[0] || profileData.email?.[0] || 'U').toUpperCase()}</AvatarFallback>
          </Avatar>
          
          <Button
            size="sm"
            className="absolute -bottom-2 -right-2 h-8 w-8 p-0 rounded-full"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Camera className="h-4 w-4" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setUploading(true);
              try {
                const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dfaeksnq0';
                const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'dropshipping';
                const formData = new FormData();
                formData.append('file', file);
                formData.append('upload_preset', uploadPreset);
                formData.append('folder', 'splitlyfi/profiles');

                const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                  method: 'POST',
                  body: formData,
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data?.error?.message || 'Upload failed');
                const url = data.secure_url as string;
                setProfileData(prev => ({ ...prev, photoURL: url }));
                await updateProfile({ photoURL: url });
              } catch (err) {
                console.error('Image upload failed:', err);
              } finally {
                setUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }
            }}
          />
        </div>
        <h1 className="text-3xl font-bold mb-2">{profileData.displayName || 'User'}</h1>
        <p className="text-muted-foreground mb-4">{profileData.email || ''}</p>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
          {profileData.bio}
        </p>
        <div className="flex justify-center gap-3">
          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-2xl">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
                <DialogDescription>
                  Update your profile information and preferences.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={profileData.displayName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, displayName: e.target.value }))}
                    className="rounded-xl mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    className="rounded-xl mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                    className="rounded-xl mt-1"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={async () => {
                      await updateProfile({
                        displayName: profileData.displayName,
                        email: profileData.email,
                        bio: profileData.bio,
                        photoURL: profileData.photoURL,
                      });
                      setIsEditModalOpen(false);
                    }}
                    className="flex-1 rounded-xl"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" className="rounded-2xl" onClick={() => router.push('/settings')}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" className="rounded-2xl">
            
            <ThemeToggle/>
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Total Expenses',
            value: `₹${userStats.totalExpenses.toLocaleString()}`,
            icon: DollarSign,
            color: 'bg-red-50 dark:bg-red-950',
            textColor: 'text-red-600',
          },
          {
            title: 'Active Rooms',
            value: userStats.activeRooms.toString(),
            icon: Users,
            color: 'bg-blue-50 dark:bg-blue-950',
            textColor: 'text-blue-600',
          },
          {
            title: 'Goals Completed',
            value: userStats.completedGoals.toString(),
            icon: Target,
            color: 'bg-green-50 dark:bg-green-950',
            textColor: 'text-green-600',
          },
          {
            title: 'Total Savings',
            value: `₹${userStats.totalSavings.toLocaleString()}`,
            icon: TrendingUp,
            color: 'bg-primary/10',
            textColor: 'text-primary',
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-2xl flex items-center justify-center ${stat.color}`}>
                    <stat.icon className={`h-5 w-5 ${stat.textColor}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Profile Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 rounded-2xl">
            <TabsTrigger value="overview" className="rounded-xl">Overview</TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-xl">Analytics</TabsTrigger>
            <TabsTrigger value="achievements" className="rounded-xl">Achievements</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Account Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>Your basic account details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Member Since</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(userStats.joinedDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Plan</span>
                    <Badge variant="secondary">Free</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Verification Status</span>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Verified
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Two-Factor Auth</span>
                    <Badge variant="outline">Disabled</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Frequently used features</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start rounded-xl">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Add New Expense
                  </Button>
                  <Button variant="outline" className="w-full justify-start rounded-xl">
                    <Target className="h-4 w-4 mr-2" />
                    Create New Goal
                  </Button>
                  <Button variant="outline" className="w-full justify-start rounded-xl">
                    <Users className="h-4 w-4 mr-2" />
                    Join a Room
                  </Button>
                  <Button variant="outline" className="w-full justify-start rounded-xl">
                    <Settings className="h-4 w-4 mr-2" />
                    Account Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Expense Categories */}
              <Card>
                <CardHeader>
                  <CardTitle>Expense Categories</CardTitle>
                  <CardDescription>Your spending breakdown by category</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {userStats.expenseCategories.map((category) => (
                    <div key={category.name} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{category.name}</span>
                        <span className="text-muted-foreground">
                          ₹{category.amount.toLocaleString()} ({category.percentage}%)
                        </span>
                      </div>
                      <Progress value={category.percentage} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Monthly Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Spending</CardTitle>
                  <CardDescription>Your expense trend over the last 5 months</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userStats.monthlyTrend.map((month, index) => (
                      <div key={month.month} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{month.month}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-24 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-500"
                              style={{ 
                                width: `${(month.amount / Math.max(...userStats.monthlyTrend.map(m => m.amount))) * 100}%` 
                              }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-16 text-right">
                            ₹{month.amount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Your Achievements</h3>
              <p className="text-muted-foreground mb-4">
                You've earned {earnedAchievements.length} out of {totalAchievements} achievements
              </p>
              <div className="max-w-md mx-auto">
                <Progress value={(earnedAchievements.length / totalAchievements) * 100} className="h-3" />
                <p className="text-sm text-muted-foreground mt-2">
                  {Math.round((earnedAchievements.length / totalAchievements) * 100)}% Complete
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userStats.achievements.map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`${
                    achievement.earned 
                      ? 'border-primary bg-primary/5' 
                      : 'border-dashed opacity-60'
                  }`}>
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl mb-3">{achievement.icon}</div>
                      <h4 className="font-semibold mb-2">{achievement.title}</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        {achievement.description}
                      </p>
                      {achievement.earned ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          <Award className="h-3 w-3 mr-1" />
                          Earned
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          Locked
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}