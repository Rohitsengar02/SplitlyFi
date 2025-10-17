'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Target, TrendingUp, Calendar, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, increment, orderBy } from 'firebase/firestore';
import { useAuth } from '@/components/auth-provider';

interface Goal {
  id: string;
  name: string;
  target: number;
  saved: number;
  dueDate: string;
  type: 'personal' | 'shared';
  category: string;
  userId: string;
  createdAt: string;
}

export default function GoalsPage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [filter, setFilter] = useState<'all' | 'personal' | 'shared'>('all');
  
  // Form states
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [goalType, setGoalType] = useState<'personal' | 'shared'>('personal');
  const [category, setCategory] = useState('');
  const [addAmount, setAddAmount] = useState('');

  const filteredGoals = goals.filter(goal => 
    filter === 'all' || goal.type === filter
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getDaysRemaining = (dateString: string) => {
    const dueDate = new Date(dateString);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Fetch user's personal goals from users/{uid}/goals
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const goalsQuery = query(
      collection(db, 'users', user.uid, 'goals'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(goalsQuery, (snapshot) => {
      const fetchedGoals: Goal[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Goal));
      setGoals(fetchedGoals);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Create new goal
  const handleCreateGoal = async () => {
    if (!user || !goalName || !targetAmount || !dueDate || !category) return;

    try {
      // Save goal under users/{uid}/goals subcollection
      await addDoc(collection(db, 'users', user.uid, 'goals'), {
        name: goalName,
        target: parseFloat(targetAmount),
        saved: 0,
        dueDate,
        type: goalType,
        category,
        userId: user.uid,
        createdAt: new Date().toISOString(),
      });

      // Reset form
      setGoalName('');
      setTargetAmount('');
      setDueDate('');
      setCategory('');
      setGoalType('personal');
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Error creating goal:', error);
    }
  };

  // Add money to goal
  const handleAddMoney = async () => {
    if (!selectedGoal || !addAmount || !user) return;

    const amount = parseFloat(addAmount);
    if (isNaN(amount) || amount <= 0) return;

    try {
      // Update goal in users/{uid}/goals subcollection
      const goalRef = doc(db, 'users', user.uid, 'goals', selectedGoal.id);
      await updateDoc(goalRef, {
        saved: increment(amount)
      });

      setAddAmount('');
      setSelectedGoal(null);
      setIsAddMoneyOpen(false);
    } catch (error) {
      console.error('Error adding money:', error);
    }
  };

  const openAddMoneyDialog = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsAddMoneyOpen(true);
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold">Financial Goals</h1>
          <p className="text-muted-foreground">Track your personal and shared savings goals</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl">
              <Plus className="h-4 w-4 mr-2" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
              <DialogDescription>
                Set a new financial goal to start saving towards it.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="goalName">Goal Name</Label>
                <Input
                  id="goalName"
                  placeholder="e.g., Dream Vacation"
                  className="rounded-xl mt-1"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="rounded-xl mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Travel">Travel</SelectItem>
                    <SelectItem value="Savings">Savings</SelectItem>
                    <SelectItem value="Electronics">Electronics</SelectItem>
                    <SelectItem value="Home">Home</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Health">Health</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="targetAmount">Target Amount (₹)</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  placeholder="50000"
                  className="rounded-xl mt-1"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="dueDate">Target Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  className="rounded-xl mt-1"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="goalType">Goal Type</Label>
                <Select value={goalType} onValueChange={(value: 'personal' | 'shared') => setGoalType(value)}>
                  <SelectTrigger className="rounded-xl mt-1">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="shared">Shared with others</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateGoal}
                  className="flex-1 rounded-xl"
                  disabled={!goalName || !targetAmount || !dueDate || !category}
                >
                  Create Goal
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2"
      >
        {[
          { key: 'all', label: 'All Goals' },
          { key: 'personal', label: 'Personal' },
          { key: 'shared', label: 'Shared' },
        ].map((tab) => (
          <Button
            key={tab.key}
            variant={filter === tab.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(tab.key as any)}
            className="rounded-2xl"
          >
            {tab.label}
          </Button>
        ))}
      </motion.div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredGoals.map((goal, index) => {
          const progress = (goal.saved / goal.target) * 100;
          const daysRemaining = getDaysRemaining(goal.dueDate);
          
          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (index + 2) * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{goal.name}</CardTitle>
                        {goal.type === 'shared' && (
                          <Badge variant="secondary" className="text-xs">
                            <Users className="h-3 w-3 mr-1" />
                            Shared
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          {goal.category}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(goal.dueDate)}
                        </span>
                      </div>
                    </div>
                    <div className={`text-right ${
                      daysRemaining < 30 ? 'text-orange-600' : 'text-muted-foreground'
                    }`}>
                      <p className="text-sm font-medium">
                        {daysRemaining > 0 ? `${daysRemaining} days` : 'Overdue'}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Progress */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm font-bold">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-3" />
                    <div className="flex justify-between text-sm text-muted-foreground mt-2">
                      <span>₹{goal.saved.toLocaleString()}</span>
                      <span>₹{goal.target.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Amount Remaining */}
                  <div className="bg-muted/50 rounded-2xl p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Amount Remaining</span>
                      <span className="font-semibold text-primary">
                        ₹{(goal.target - goal.saved).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1 rounded-xl"
                      onClick={() => openAddMoneyDialog(goal)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Money
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredGoals.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="h-20 w-20 bg-muted rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Target className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No goals found</h3>
          <p className="text-muted-foreground mb-6">
            {filter === 'all' 
              ? "You haven't created any goals yet. Start by setting your first financial goal!"
              : `No ${filter} goals found. Try switching to a different filter.`
            }
          </p>
          {filter === 'all' && (
            <Button onClick={() => setIsCreateModalOpen(true)} className="rounded-2xl">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Goal
            </Button>
          )}
        </motion.div>
      )}

      {/* Add Money Dialog */}
      <Dialog open={isAddMoneyOpen} onOpenChange={setIsAddMoneyOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Add Money to Goal</DialogTitle>
            <DialogDescription>
              Add money to "{selectedGoal?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Progress</span>
                <span className="font-semibold">
                  ₹{selectedGoal?.saved.toLocaleString()} / ₹{selectedGoal?.target.toLocaleString()}
                </span>
              </div>
              <Progress 
                value={selectedGoal ? (selectedGoal.saved / selectedGoal.target) * 100 : 0} 
                className="h-2" 
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{selectedGoal ? Math.round((selectedGoal.saved / selectedGoal.target) * 100) : 0}% Complete</span>
                <span>₹{selectedGoal ? (selectedGoal.target - selectedGoal.saved).toLocaleString() : 0} remaining</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="addAmount">Amount to Add (₹)</Label>
              <Input
                id="addAmount"
                type="number"
                placeholder="Enter amount"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                className="rounded-xl"
                min="1"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsAddMoneyOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleAddMoney} disabled={!addAmount || parseFloat(addAmount) <= 0} className="rounded-xl">
              Add Money
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}