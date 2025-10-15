'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Users, Target, DollarSign, Plus, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

const expenseData = [
  { month: 'Jan', amount: 8000 },
  { month: 'Feb', amount: 12000 },
  { month: 'Mar', amount: 9500 },
  { month: 'Apr', amount: 15000 },
  { month: 'May', amount: 11000 },
  { month: 'Jun', amount: 13500 },
];

const categoryData = [
  { name: 'Food', value: 4500, color: '#00A991' },
  { name: 'Transport', value: 2000, color: '#10B981' },
  { name: 'Entertainment', value: 1500, color: '#3B82F6' },
  { name: 'Utilities', value: 800, color: '#F59E0B' },
  { name: 'Others', value: 700, color: '#EF4444' },
];

const recentActivities = [
  { id: 1, type: 'expense', title: 'Dinner at Pizza Palace', amount: -850, room: 'Friends' },
  { id: 2, type: 'goal', title: 'Vacation fund progress', amount: +2000, room: 'Family' },
  { id: 3, type: 'expense', title: 'Uber ride', amount: -250, room: 'Work' },
  { id: 4, type: 'expense', title: 'Grocery shopping', amount: -1200, room: 'Family' },
];

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold">Good morning, John! 👋</h1>
          <p className="text-muted-foreground">Here's your financial overview for June 2025</p>
        </div>
        <Button className="rounded-2xl">
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: 'Total Expenses',
            value: '₹13,450',
            change: '+12%',
            icon: DollarSign,
            positive: false,
          },
          {
            title: 'Active Rooms',
            value: '3',
            change: '+1',
            icon: Users,
            positive: true,
          },
          {
            title: 'Goals Progress',
            value: '78%',
            change: '+8%',
            icon: Target,
            positive: true,
          },
          {
            title: 'Monthly Savings',
            value: '₹5,200',
            change: '+15%',
            icon: TrendingUp,
            positive: true,
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-10 w-10 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${
                    stat.positive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <ArrowUpRight className="h-3 w-3" />
                    {stat.change}
                  </div>
                </div>
                <h3 className="font-semibold text-muted-foreground">{stat.title}</h3>
                <p className="text-2xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Trend */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Spending Trend</CardTitle>
              <CardDescription>Your expense pattern over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={expenseData}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`₹${value}`, 'Amount']} />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#00A991"
                      strokeWidth={3}
                      dot={{ fill: '#00A991', strokeWidth: 2, r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
              <CardDescription>Where your money goes this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`₹${value}`, 'Amount']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                {categoryData.map((category) => (
                  <div key={category.name} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm font-medium">{category.name}</span>
                    <span className="text-sm text-muted-foreground ml-auto">
                      ₹{category.value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Goals and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Goals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Financial Goals</CardTitle>
              <CardDescription>Track your savings progress</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold">Vacation Fund</h4>
                  <span className="text-sm text-muted-foreground">78%</span>
                </div>
                <Progress value={78} className="h-2" />
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <span>₹39,000 saved</span>
                  <span>₹50,000 goal</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold">Emergency Fund</h4>
                  <span className="text-sm text-muted-foreground">45%</span>
                </div>
                <Progress value={45} className="h-2" />
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <span>₹45,000 saved</span>
                  <span>₹1,00,000 goal</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold">New Laptop</h4>
                  <span className="text-sm text-muted-foreground">92%</span>
                </div>
                <Progress value={92} className="h-2" />
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <span>₹64,400 saved</span>
                  <span>₹70,000 goal</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest transactions and updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-muted/50 transition-colors">
                  <div className={`h-10 w-10 rounded-2xl flex items-center justify-center ${
                    activity.type === 'expense' ? 'bg-red-50 dark:bg-red-950' : 'bg-green-50 dark:bg-green-950'
                  }`}>
                    {activity.type === 'expense' ? (
                      <DollarSign className={`h-5 w-5 ${
                        activity.type === 'expense' ? 'text-red-600' : 'text-green-600'
                      }`} />
                    ) : (
                      <Target className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">{activity.room}</p>
                  </div>
                  <span className={`font-semibold ${
                    activity.amount < 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {activity.amount < 0 ? '-' : '+'}₹{Math.abs(activity.amount)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}