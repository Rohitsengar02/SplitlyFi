'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Calendar as CalendarIcon, ChevronDown, Bell, DollarSign, CreditCard, Wallet, PiggyBank, Receipt } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit, addDoc } from 'firebase/firestore';
import { useAuth } from '@/components/auth-provider';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';

const CATEGORY_COLORS: Record<string, string> = {
  'Food & Groceries': '#8B5CF6',
  'Cafe & Restaurants': '#6366F1',
  'Rent': '#3B82F6',
  'Education': '#14B8A6',
  'Money transfer': '#10B981',
  'Others': '#94A3B8',
  'Transport': '#F59E0B',
  'Entertainment': '#EC4899',
  'Utilities': '#EF4444',
  'Shopping': '#8B5CF6',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalBalance, setTotalBalance] = useState(0);
  const [expenseTransactions, setExpenseTransactions] = useState(0);
  const [incomeTransactions, setIncomeTransactions] = useState(0);
  const [expenseCategories, setExpenseCategories] = useState<Record<string, number>>({});
  const [incomeCategories, setIncomeCategories] = useState<Record<string, number>>({});
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [budgetData, setBudgetData] = useState<any[]>([]);
  const [previousMonthExpense, setPreviousMonthExpense] = useState(0);
  const [previousMonthIncome, setPreviousMonthIncome] = useState(0);
  
  // Income dialog states
  const [isIncomeDialogOpen, setIsIncomeDialogOpen] = useState(false);
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeSource, setIncomeSource] = useState('');
  const [incomeDate, setIncomeDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Date range filter states
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  
  // Notification states
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Recent transactions
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        // Use date range for filtering
        const firstDayOfMonth = dateRange.from;
        const lastDayOfMonth = dateRange.to;
        const firstDayOfPrevMonth = new Date(dateRange.from.getFullYear(), dateRange.from.getMonth() - 1, 1);
        const lastDayOfPrevMonth = new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), 0);

        // Fetch all expenses for current user from allexpenses
        const expensesQuery = query(
          collection(db, 'allexpenses'),
          where('addedBy', '==', user.uid),
          orderBy('date', 'desc'),
          limit(100)
        );

        const expensesSnap = await getDocs(expensesQuery);
        const allExpenses = expensesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Fetch personal expenses from users/{uid}/personalexpence
        const personalExpensesQuery = query(
          collection(db, 'users', user.uid, 'personalexpence'),
          orderBy('date', 'desc'),
          limit(100)
        );

        const personalExpensesSnap = await getDocs(personalExpensesQuery);
        const personalExpenses = personalExpensesSnap.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          type: 'personal' // Ensure type is set
        }));

        // Combine all expenses
        const expenses = [...allExpenses, ...personalExpenses];

        // Calculate current month expenses
        let currentExpenses = 0;
        let currentIncome = 0;
        let expenseCount = 0;
        let incomeCount = 0;
        const expenseCats: Record<string, number> = {};
        const incomeCats: Record<string, number> = {};
        let prevExpenses = 0;
        let prevIncome = 0;

        expenses.forEach((expense: any) => {
          const expenseDate = new Date(expense.date);
          const amount = expense.totalAmount || expense.amount || 0;
          const category = expense.category || 'Others';

          // Current month
          if (expenseDate >= firstDayOfMonth && expenseDate <= lastDayOfMonth) {
            if (expense.type === 'income') {
              currentIncome += amount;
              incomeCount++;
              incomeCats[category] = (incomeCats[category] || 0) + amount;
            } else {
              currentExpenses += amount;
              expenseCount++;
              expenseCats[category] = (expenseCats[category] || 0) + amount;
            }
          }

          // Previous month for comparison
          if (expenseDate >= firstDayOfPrevMonth && expenseDate <= lastDayOfPrevMonth) {
            if (expense.type === 'income') {
              prevIncome += amount;
            } else {
              prevExpenses += amount;
            }
          }
        });

        setTotalExpenses(currentExpenses);
        setTotalIncome(currentIncome);
        setTotalBalance(currentIncome - currentExpenses);
        setExpenseTransactions(expenseCount);
        setIncomeTransactions(incomeCount);
        setExpenseCategories(expenseCats);
        setIncomeCategories(incomeCats);
        setPreviousMonthExpense(prevExpenses);
        setPreviousMonthIncome(prevIncome);

        // Generate monthly data for last 6 months
        const monthlyExpenses: Record<string, number> = {};
        for (let i = 5; i >= 0; i--) {
          const monthDate = new Date(dateRange.from.getFullYear(), dateRange.from.getMonth() - i, 1);
          const monthKey = monthDate.toLocaleDateString('en-US', { month: 'short' });
          monthlyExpenses[monthKey] = 0;
        }

        expenses.forEach((expense: any) => {
          const expenseDate = new Date(expense.date);
          const monthKey = expenseDate.toLocaleDateString('en-US', { month: 'short' });
          if (monthKey in monthlyExpenses && expense.type !== 'income') {
            monthlyExpenses[monthKey] += expense.totalAmount || expense.amount || 0;
          }
        });

        const monthlyChartData = Object.entries(monthlyExpenses).map(([month, amount]) => ({
          month,
          amount: Math.round(amount),
        }));

        setMonthlyData(monthlyChartData);

        // Generate budget comparison data (last 7 months)
        const budgetComparison = [];
        for (let i = 6; i >= 0; i--) {
          const monthDate = new Date(dateRange.from.getFullYear(), dateRange.from.getMonth() - i, 1);
          const monthKey = monthDate.toLocaleDateString('en-US', { month: 'short' });
          const monthExpenses = expenses
            .filter((e: any) => {
              const eDate = new Date(e.date);
              return eDate.getMonth() === monthDate.getMonth() && 
                     eDate.getFullYear() === monthDate.getFullYear() &&
                     e.type !== 'income';
            })
            .reduce((sum: number, e: any) => sum + (e.totalAmount || e.amount || 0), 0);

          budgetComparison.push({
            month: monthKey,
            expense: Math.round(monthExpenses),
            budget: Math.round(monthExpenses * 1.2), // Budget is 20% more than actual
          });
        }

        setBudgetData(budgetComparison);
        
        // Set recent transactions (last 5)
        setRecentTransactions(expenses.slice(0, 5));
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, dateRange]);

  // Calculate percentage changes
  const expenseChange = previousMonthExpense > 0 
    ? ((totalExpenses - previousMonthExpense) / previousMonthExpense) * 100 
    : 0;
  const incomeChange = previousMonthIncome > 0 
    ? ((totalIncome - previousMonthIncome) / previousMonthIncome) * 100 
    : 0;
  const balanceChange = (previousMonthIncome - previousMonthExpense) > 0
    ? ((totalBalance - (previousMonthIncome - previousMonthExpense)) / (previousMonthIncome - previousMonthExpense)) * 100
    : 0;

  // Prepare pie chart data
  const pieChartData = Object.entries(expenseCategories)
    .map(([name, value]) => ({
      name,
      value: Math.round(value),
      color: CATEGORY_COLORS[name] || '#94A3B8',
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // Handle adding income
  const handleAddIncome = async () => {
    if (!user || !incomeAmount || !incomeSource) return;

    try {
      await addDoc(collection(db, 'allexpenses'), {
        title: incomeSource,
        amount: parseFloat(incomeAmount),
        totalAmount: parseFloat(incomeAmount),
        category: 'Income',
        date: incomeDate,
        note: 'Income entry',
        type: 'income',
        addedBy: user.uid,
        addedByName: user.displayName || user.email || 'User',
        addedByEmail: user.email || '',
        splitType: 'equal',
        selectedMembers: [user.uid],
        customSplits: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Reset form
      setIncomeAmount('');
      setIncomeSource('');
      setIncomeDate(new Date().toISOString().split('T')[0]);
      setIsIncomeDialogOpen(false);

      // Refresh data
      window.location.reload();
    } catch (error) {
      console.error('Error adding income:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div className="flex items-center gap-4">
          {/* Animated Greeting GIF */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="hidden sm:block"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl animate-bounce">
              👋
            </div>
          </motion.div>
          <div>
            <motion.h1 
              className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              {(() => {
                const hour = new Date().getHours();
                if (hour < 12) return 'Good Morning';
                if (hour < 17) return 'Good Afternoon';
                if (hour < 21) return 'Good Evening';
                return 'Good Night';
              })()}, {user?.displayName || user?.email?.split('@')[0] || 'User'}!
            </motion.h1>
            <motion.p 
              className="text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Here's your financial overview for today
            </motion.p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Date Range Picker */}
          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-xl">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d, yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-6 space-y-6">
                {/* Header */}
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">Select Date Range</h3>
                  <p className="text-sm text-muted-foreground">Choose a custom date range to filter your data</p>
                </div>

                {/* Date Range Display */}
                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Selected Range</p>
                      <p className="font-semibold">
                        {format(dateRange.from, 'MMM d, yyyy')} - {format(dateRange.to, 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))} days
                    </Badge>
                  </div>
                </div>

                {/* From Date */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">From Date</Label>
                    <Badge variant="outline" className="text-xs">
                      {format(dateRange.from, 'EEE, MMM d')}
                    </Badge>
                  </div>
                  <div className="border rounded-xl p-3">
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => date && setDateRange(prev => ({ ...prev, from: date }))}
                      initialFocus
                      className="rounded-xl"
                    />
                  </div>
                </div>

                {/* To Date */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">To Date</Label>
                    <Badge variant="outline" className="text-xs">
                      {format(dateRange.to, 'EEE, MMM d')}
                    </Badge>
                  </div>
                  <div className="border rounded-xl p-3">
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => date && setDateRange(prev => ({ ...prev, to: date }))}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                {/* Quick Filters */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Quick Filters</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => {
                        const now = new Date();
                        setDateRange({
                          from: new Date(now.getFullYear(), now.getMonth(), 1),
                          to: now
                        });
                      }}
                    >
                      This Month
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => {
                        const now = new Date();
                        setDateRange({
                          from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
                          to: new Date(now.getFullYear(), now.getMonth(), 0)
                        });
                      }}
                    >
                      Last Month
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => {
                        const now = new Date();
                        const last7Days = new Date(now);
                        last7Days.setDate(now.getDate() - 7);
                        setDateRange({
                          from: last7Days,
                          to: now
                        });
                      }}
                    >
                      Last 7 Days
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => {
                        const now = new Date();
                        const last30Days = new Date(now);
                        last30Days.setDate(now.getDate() - 30);
                        setDateRange({
                          from: last30Days,
                          to: now
                        });
                      }}
                    >
                      Last 30 Days
                    </Button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 rounded-xl"
                    onClick={() => {
                      const now = new Date();
                      setDateRange({
                        from: new Date(now.getFullYear(), now.getMonth(), 1),
                        to: now
                      });
                    }}
                  >
                    Clear Filter
                  </Button>
                  <Button 
                    className="flex-1 rounded-xl" 
                    onClick={() => setIsDatePickerOpen(false)}
                  >
                    Apply Filter
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Notification Button */}
          <Popover open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-xl relative">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Notifications</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No notifications</p>
                  </div>
                ) : (
                  notifications.map((notif, idx) => (
                    <div key={idx} className="p-4 border-b hover:bg-muted/50 transition-colors">
                      <p className="text-sm font-medium">{notif.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{notif.time}</p>
                    </div>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Add Income Button */}
          <Button 
            size="sm" 
            className="rounded-xl bg-green-600 hover:bg-green-700"
            onClick={() => setIsIncomeDialogOpen(true)}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Add Income</span>
          </Button>
        </div>
      </motion.div>

      {/* Top Stats Cards - Carousel */}
      <div className="relative -mx-6 px-6">
        <div className="overflow-x-auto scrollbar-hide pb-4">
          <div 
            className="flex gap-6 snap-x snap-mandatory"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
        {/* Total Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-[340px] md:w-[380px] shrink-0 snap-start"
        >
          <Card className="h-full bg-gradient-to-br from-purple-600 via-pink-600 to-purple-700 border-purple-400/30 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-purple-100 mb-1">Total balance</p>
                  <h2 className="text-3xl font-bold text-white">₹{totalBalance.toLocaleString()}<span className="text-purple-200 text-xl">.00</span></h2>
                </div>
               
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className={`flex items-center gap-1 ${balanceChange >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {balanceChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <span className="font-semibold">{Math.abs(balanceChange).toFixed(1)}%</span>
                </div>
                <div className="flex items-center gap-2 text-purple-100">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 bg-white rounded-full" />
                    <span className="text-xs">{expenseTransactions + incomeTransactions} transactions</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 bg-purple-300 rounded-full" />
                    <span className="text-xs">{Object.keys(expenseCategories).length + Object.keys(incomeCategories).length} categories</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-purple-100 mt-3">
                You have extra ₹{Math.abs(totalBalance - (previousMonthIncome - previousMonthExpense)).toLocaleString()} compared to last month
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Income */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-[340px] md:w-[380px] shrink-0 snap-start"
        >
          <Card className="h-full bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 border-green-400/30 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-green-100 mb-1">Income</p>
                  <h2 className="text-3xl font-bold text-white">₹{totalIncome.toLocaleString()}<span className="text-green-200 text-xl">.00</span></h2>
                </div>
               
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className={`flex items-center gap-1 ${incomeChange >= 0 ? 'text-green-200' : 'text-red-300'}`}>
                  {incomeChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <span className="font-semibold">{Math.abs(incomeChange).toFixed(1)}%</span>
                </div>
                <div className="flex items-center gap-2 text-green-100">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 bg-white rounded-full" />
                    <span className="text-xs">{incomeTransactions} transactions</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 bg-green-300 rounded-full" />
                    <span className="text-xs">{Object.keys(incomeCategories).length} categories</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-green-100 mt-3">
                You have extra ₹{Math.abs(totalIncome - previousMonthIncome).toLocaleString()} compared to last month
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Expense */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-[340px] md:w-[380px] shrink-0 snap-start"
        >
          <Card className="h-full bg-gradient-to-br from-red-600 via-orange-600 to-red-700 border-red-400/30 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-red-100 mb-1">Expense</p>
                  <h2 className="text-3xl font-bold text-white">₹{totalExpenses.toLocaleString()}<span className="text-red-200 text-xl">.00</span></h2>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className={`flex items-center gap-1 ${expenseChange <= 0 ? 'text-green-300' : 'text-red-200'}`}>
                  {expenseChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <span className="font-semibold">{Math.abs(expenseChange).toFixed(1)}%</span>
                </div>
                <div className="flex items-center gap-2 text-red-100">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 bg-white rounded-full" />
                    <span className="text-xs">{expenseTransactions} transactions</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 bg-orange-300 rounded-full" />
                    <span className="text-xs">{Object.keys(expenseCategories).length} categories</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-red-100 mt-3">
                You have extra ₹{Math.abs(totalExpenses - previousMonthExpense).toLocaleString()} compared to last month
              </p>
            </CardContent>
          </Card>
        </motion.div>
          </div>
        </div>
      </div>

      {/* Additional Info Cards - Carousel */}
      <div className="relative -mx-6 px-6">
        <div className="overflow-x-auto scrollbar-hide pb-4">
          <div 
            className="flex gap-4 snap-x snap-mandatory"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
        {/* Average Transaction */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="w-[200px] shrink-0 snap-start"
        >
          <Card className="h-full bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-blue-500/5 border-blue-200/50 dark:border-blue-800/50 hover:shadow-xl hover:-translate-y-1 transition-all backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">Avg</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-1">Avg Transaction</p>
              <p className="text-xl font-bold">₹{expenseTransactions > 0 ? Math.round(totalExpenses / expenseTransactions).toLocaleString() : 0}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Savings Rate */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="w-[200px] shrink-0 snap-start"
        >
          <Card className="h-full bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-green-500/5 border-green-200/50 dark:border-green-800/50 hover:shadow-xl hover:-translate-y-1 transition-all backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <PiggyBank className="h-5 w-5 text-green-600" />
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">Rate</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-1">Savings Rate</p>
              <p className="text-xl font-bold">{totalIncome > 0 ? Math.round((totalBalance / totalIncome) * 100) : 0}%</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Total Transactions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="w-[200px] shrink-0 snap-start"
        >
          <Card className="h-full bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-purple-500/5 border-purple-200/50 dark:border-purple-800/50 hover:shadow-xl hover:-translate-y-1 transition-all backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Receipt className="h-5 w-5 text-purple-600" />
                <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 border-purple-200">Count</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-1">Transactions</p>
              <p className="text-xl font-bold">{expenseTransactions + incomeTransactions}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Budget Status */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="w-[200px] shrink-0 snap-start"
        >
          <Card className="h-full bg-gradient-to-br from-orange-500/10 via-amber-500/10 to-orange-500/5 border-orange-200/50 dark:border-orange-800/50 hover:shadow-xl hover:-translate-y-1 transition-all backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Wallet className="h-5 w-5 text-orange-600" />
                <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700 border-orange-200">Budget</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-1">Budget Used</p>
              <p className="text-xl font-bold">{totalIncome > 0 ? Math.round((totalExpenses / totalIncome) * 100) : 0}%</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Categories */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
          className="w-[200px] shrink-0 snap-start"
        >
          <Card className="h-full bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-indigo-500/5 border-indigo-200/50 dark:border-indigo-800/50 hover:shadow-xl hover:-translate-y-1 transition-all backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="h-5 w-5 text-indigo-600" />
                <Badge variant="secondary" className="text-xs bg-indigo-100 text-indigo-700 border-indigo-200">Active</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-1">Categories</p>
              <p className="text-xl font-bold">{Object.keys(expenseCategories).length}</p>
            </CardContent>
          </Card>
        </motion.div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Total Balance Overview - Takes 2 columns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Total balance overview</CardTitle>
                <div className="flex items-center gap-2">
                 
                 
                 
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Balance']}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#8B5CF6"
                      strokeWidth={3}
                      dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 5 }}
                      fill="url(#colorBalance)"
                    />
                    <defs>
                      <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Statistics - Donut Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Statistics</CardTitle>
                <div className="flex items-center gap-2">
                 
                 
                </div>
              </div>
              <CardDescription className="text-xs">
                You have an increase of expenses in several categories this month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative h-48 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Amount']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-xs text-muted-foreground">This month expense</p>
                  <p className="text-2xl font-bold">₹{totalExpenses.toLocaleString()}<span className="text-muted-foreground text-sm">.00</span></p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-6">
                {pieChartData.map((category) => (
                  <div key={category.name} className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-xs truncate">{category.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Budget Comparison Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Comparing of budget and expense</CardTitle>
              <div className="flex items-center gap-4">
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: any) => [`₹${value.toLocaleString()}`, '']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                    cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
                  />
                  <Bar 
                    dataKey="expense" 
                    fill="#8B5CF6" 
                    radius={[8, 8, 0, 0]}
                    maxBarSize={40}
                  />
                  <Bar 
                    dataKey="budget" 
                    fill="#C4B5FD" 
                    radius={[8, 8, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest financial activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTransactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No recent transactions</p>
              ) : (
                recentTransactions.map((transaction: any, index) => (
                  <motion.div
                    key={transaction.id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                          transaction.type === 'income' ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
                        }`}
                      >
                        <DollarSign 
                          className={`h-5 w-5 ${
                            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{transaction.title}</p>
                        <p className="text-xs text-muted-foreground">{transaction.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}₹{(transaction.totalAmount || transaction.amount).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Add Income Dialog */}
      <Dialog open={isIncomeDialogOpen} onOpenChange={setIsIncomeDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Add Income</DialogTitle>
            <DialogDescription>
              Record your monthly income or earnings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="incomeSource">Income Source</Label>
              <Input
                id="incomeSource"
                placeholder="e.g., Salary, Freelance, Business"
                value={incomeSource}
                onChange={(e) => setIncomeSource(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="incomeAmount">Amount (₹)</Label>
              <Input
                id="incomeAmount"
                type="number"
                placeholder="Enter amount"
                value={incomeAmount}
                onChange={(e) => setIncomeAmount(e.target.value)}
                className="rounded-xl"
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="incomeDate">Date</Label>
              <Input
                id="incomeDate"
                type="date"
                value={incomeDate}
                onChange={(e) => setIncomeDate(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsIncomeDialogOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button 
              onClick={handleAddIncome} 
              disabled={!incomeAmount || !incomeSource} 
              className="rounded-xl bg-green-600 hover:bg-green-700"
            >
              Add Income
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}