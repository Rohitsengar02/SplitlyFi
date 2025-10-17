'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown, Calendar, Filter, Search, ArrowUpRight, ArrowDownRight, Users, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useAuth } from '@/components/auth-provider';

interface Expense {
  id: string;
  title: string;
  amount: number;
  totalAmount?: number;
  category: string;
  date: string;
  type: 'personal' | 'group' | 'income';
  roomTitle?: string;
  roomId?: string;
  addedBy: string;
  addedByName: string;
  note?: string;
  splitType?: string;
  selectedMembers?: string[];
  customSplits?: Record<string, number>;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Food & Groceries': '#10B981',
  'Cafe & Restaurants': '#3B82F6',
  'Rent': '#8B5CF6',
  'Education': '#F59E0B',
  'Money transfer': '#EC4899',
  'Transport': '#EF4444',
  'Entertainment': '#14B8A6',
  'Utilities': '#F97316',
  'Shopping': '#6366F1',
  'Others': '#94A3B8',
  'Income': '#10B981',
};

export default function ExpensesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'personal' | 'group' | 'income'>('all');
  
  // Stats
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [personalExpenses, setPersonalExpenses] = useState(0);
  const [groupExpenses, setGroupExpenses] = useState(0);
  const [transactionCount, setTransactionCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchExpenses = async () => {
      try {
        // Fetch from allexpenses
        const expensesQuery = query(
          collection(db, 'allexpenses'),
          where('addedBy', '==', user.uid),
          orderBy('date', 'desc')
        );

        const expensesSnap = await getDocs(expensesQuery);
        const allExpenses: Expense[] = expensesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Expense));

        // Fetch personal expenses from users/{uid}/personalexpence
        const personalExpensesQuery = query(
          collection(db, 'users', user.uid, 'personalexpence'),
          orderBy('date', 'desc')
        );

        const personalExpensesSnap = await getDocs(personalExpensesQuery);
        const personalExpenses: Expense[] = personalExpensesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          type: 'personal'
        } as Expense));

        // Combine all expenses
        const fetchedExpenses = [...allExpenses, ...personalExpenses].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        setExpenses(fetchedExpenses);
        setFilteredExpenses(fetchedExpenses);

        // Calculate stats
        let totalExp = 0;
        let totalInc = 0;
        let personalExp = 0;
        let groupExp = 0;

        fetchedExpenses.forEach(expense => {
          const amount = expense.totalAmount || expense.amount || 0;
          if (expense.type === 'income') {
            totalInc += amount;
          } else if (expense.type === 'personal') {
            personalExp += amount;
            totalExp += amount;
          } else if (expense.type === 'group') {
            groupExp += amount;
            totalExp += amount;
          }
        });

        setTotalExpenses(totalExp);
        setTotalIncome(totalInc);
        setPersonalExpenses(personalExp);
        setGroupExpenses(groupExp);
        setTransactionCount(fetchedExpenses.length);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching expenses:', error);
        setLoading(false);
      }
    };

    fetchExpenses();
  }, [user]);

  // Filter expenses based on tab and search
  useEffect(() => {
    let filtered = expenses;

    // Filter by tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(exp => exp.type === activeTab);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(exp =>
        exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (exp.roomTitle && exp.roomTitle.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredExpenses(filtered);
  }, [activeTab, searchQuery, expenses]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getCategoryColor = (category: string) => {
    return CATEGORY_COLORS[category] || '#94A3B8';
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading expenses...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold">My Expenses</h1>
        <p className="text-muted-foreground">Track all your transactions in one place</p>
      </motion.div>

      {/* Stats Carousel */}
      <div className="relative -mx-6 px-6">
        <div className="overflow-x-auto scrollbar-hide pb-4">
          <div 
            className="flex gap-4 snap-x snap-mandatory"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {/* Total Balance */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="w-[280px] shrink-0 snap-start"
            >
              <Card className="h-full bg-gradient-to-br from-purple-50/60 to-pink-100/50 dark:from-purple-900/20 dark:to-pink-950/30 backdrop-blur-xl hover:shadow-xl hover:-translate-y-1 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-12 w-12 bg-purple-500/10 rounded-2xl flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className={`flex items-center gap-1 text-sm ${
                      totalIncome - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {totalIncome - totalExpenses >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      <span className="font-semibold">Balance</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">Total Balance</p>
                  <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                    ₹{(totalIncome - totalExpenses).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Total Income */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="w-[280px] shrink-0 snap-start"
            >
              <Card className="h-full bg-gradient-to-br from-green-50/60 to-emerald-100/50 dark:from-green-900/20 dark:to-emerald-950/30 backdrop-blur-xl hover:shadow-xl hover:-translate-y-1 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-12 w-12 bg-green-500/10 rounded-2xl flex items-center justify-center">
                      <ArrowDownRight className="h-6 w-6 text-green-600" />
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      Income
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">Total Income</p>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                    ₹{totalIncome.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Total Expenses */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="w-[280px] shrink-0 snap-start"
            >
              <Card className="h-full bg-gradient-to-br from-red-50/60 to-orange-100/50 dark:from-red-900/20 dark:to-orange-950/30 backdrop-blur-xl hover:shadow-xl hover:-translate-y-1 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-12 w-12 bg-red-500/10 rounded-2xl flex items-center justify-center">
                      <ArrowUpRight className="h-6 w-6 text-red-600" />
                    </div>
                    <Badge variant="secondary" className="bg-red-100 text-red-700">
                      Expense
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">Total Expenses</p>
                  <p className="text-3xl font-bold text-red-700 dark:text-red-300">
                    ₹{totalExpenses.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Personal Expenses */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="w-[280px] shrink-0 snap-start"
            >
              <Card className="h-full bg-gradient-to-br from-blue-50/60 to-cyan-100/50 dark:from-blue-900/20 dark:to-cyan-950/30 backdrop-blur-xl hover:shadow-xl hover:-translate-y-1 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-12 w-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      Personal
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">Personal Expenses</p>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                    ₹{personalExpenses.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Group Expenses */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="w-[280px] shrink-0 snap-start"
            >
              <Card className="h-full bg-gradient-to-br from-amber-50/60 to-yellow-100/50 dark:from-amber-900/20 dark:to-yellow-950/30 backdrop-blur-xl hover:shadow-xl hover:-translate-y-1 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-12 w-12 bg-amber-500/10 rounded-2xl flex items-center justify-center">
                      <Users className="h-6 w-6 text-amber-600" />
                    </div>
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                      Group
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">Group Expenses</p>
                  <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">
                    ₹{groupExpenses.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Total Transactions */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="w-[280px] shrink-0 snap-start"
            >
              <Card className="h-full bg-gradient-to-br from-indigo-50/60 to-purple-100/50 dark:from-indigo-900/20 dark:to-purple-950/30 backdrop-blur-xl hover:shadow-xl hover:-translate-y-1 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-12 w-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-indigo-600" />
                    </div>
                    <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
                      All Time
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">Total Transactions</p>
                  <p className="text-3xl font-bold text-indigo-700 dark:text-indigo-300">
                    {transactionCount}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-2xl"
          />
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
          <TabsList className="grid w-full grid-cols-4 rounded-2xl">
            <TabsTrigger value="all" className="rounded-xl">All</TabsTrigger>
            <TabsTrigger value="personal" className="rounded-xl">Personal</TabsTrigger>
            <TabsTrigger value="group" className="rounded-xl">Group</TabsTrigger>
            <TabsTrigger value="income" className="rounded-xl">Income</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <div className="space-y-3">
              {filteredExpenses.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-muted-foreground">No transactions found</p>
                  </CardContent>
                </Card>
              ) : (
                filteredExpenses.map((expense, index) => (
                  <motion.div
                    key={expense.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {/* Category Icon */}
                          <div 
                            className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${getCategoryColor(expense.category)}20` }}
                          >
                            <DollarSign 
                              className="h-6 w-6" 
                              style={{ color: getCategoryColor(expense.category) }}
                            />
                          </div>

                          {/* Transaction Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold truncate">{expense.title}</h4>
                              {expense.type === 'group' && expense.roomTitle && (
                                <Badge variant="outline" className="text-xs">
                                  <Users className="h-3 w-3 mr-1" />
                                  {expense.roomTitle}
                                </Badge>
                              )}
                              {expense.type === 'personal' && (
                                <Badge variant="outline" className="text-xs">
                                  <User className="h-3 w-3 mr-1" />
                                  Personal
                                </Badge>
                              )}
                              {expense.type === 'income' && (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                  <TrendingDown className="h-3 w-3 mr-1" />
                                  Income
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                              <Badge 
                                variant="secondary" 
                                className="text-xs"
                                style={{ 
                                  backgroundColor: `${getCategoryColor(expense.category)}20`,
                                  color: getCategoryColor(expense.category)
                                }}
                              >
                                {expense.category}
                              </Badge>
                              <span>•</span>
                              <span>{formatDate(expense.date)}</span>
                            </div>

                            {/* Split Details for Group Expenses */}
                            {expense.type === 'group' && expense.splitType && (
                              <div className="mt-2 p-2 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-2 text-xs mb-1">
                                  <span className="font-semibold text-muted-foreground">Split Type:</span>
                                  <Badge variant="secondary" className="text-xs capitalize">
                                    {expense.splitType}
                                  </Badge>
                                  {expense.selectedMembers && (
                                    <>
                                      <span className="text-muted-foreground">•</span>
                                      <span className="text-muted-foreground">
                                        {expense.selectedMembers.length} member{expense.selectedMembers.length > 1 ? 's' : ''}
                                      </span>
                                    </>
                                  )}
                                </div>
                                {expense.splitType === 'custom' && expense.customSplits && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    <span className="font-semibold">Your share: </span>
                                    ₹{(expense.customSplits[user?.uid || ''] || 0).toLocaleString()}
                                  </div>
                                )}
                                {expense.splitType === 'equal' && expense.selectedMembers && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    <span className="font-semibold">Your share: </span>
                                    ₹{((expense.totalAmount || expense.amount) / expense.selectedMembers.length).toLocaleString()}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Note */}
                            {expense.note && expense.note !== 'Income entry' && (
                              <p className="text-xs text-muted-foreground mt-2 italic">
                                "{expense.note}"
                              </p>
                            )}
                          </div>

                          {/* Amount */}
                          <div className="text-right">
                            <p className={`text-lg font-bold ${
                              expense.type === 'income' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {expense.type === 'income' ? '+' : '-'}₹{(expense.totalAmount || expense.amount).toLocaleString()}
                            </p>
                            {expense.type === 'group' && expense.splitType === 'equal' && expense.selectedMembers && (
                              <p className="text-xs text-muted-foreground mt-1">
                                (₹{((expense.totalAmount || expense.amount) / expense.selectedMembers.length).toLocaleString()} each)
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
