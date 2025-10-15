'use client';

import { useState } from 'react';
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

const goals = [
  {
    id: 1,
    name: 'Vacation Fund',
    target: 50000,
    saved: 39000,
    dueDate: '2025-08-15',
    type: 'personal',
    category: 'Travel',
    contributors: ['You'],
  },
  {
    id: 2,
    name: 'Emergency Fund',
    target: 100000,
    saved: 45000,
    dueDate: '2025-12-31',
    type: 'personal',
    category: 'Savings',
    contributors: ['You'],
  },
  {
    id: 3,
    name: 'New Laptop',
    target: 70000,
    saved: 64400,
    dueDate: '2025-07-01',
    type: 'personal',
    category: 'Electronics',
    contributors: ['You'],
  },
  {
    id: 4,
    name: 'Family Trip to Europe',
    target: 200000,
    saved: 85000,
    dueDate: '2025-10-15',
    type: 'shared',
    category: 'Travel',
    contributors: ['You', 'Sarah', 'Dad', 'Mom'],
  },
  {
    id: 5,
    name: 'Home Renovation',
    target: 150000,
    saved: 32000,
    dueDate: '2025-09-30',
    type: 'shared',
    category: 'Home',
    contributors: ['You', 'Partner'],
  },
];

export default function GoalsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'personal' | 'shared'>('all');

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
                />
              </div>
              <div>
                <Label htmlFor="targetAmount">Target Amount (₹)</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  placeholder="50000"
                  className="rounded-xl mt-1"
                />
              </div>
              <div>
                <Label htmlFor="dueDate">Target Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  className="rounded-xl mt-1"
                />
              </div>
              <div>
                <Label htmlFor="goalType">Goal Type</Label>
                <Select>
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
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 rounded-xl"
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

                  {/* Contributors */}
                  {goal.type === 'shared' && (
                    <div>
                      <p className="text-sm font-medium mb-2">Contributors</p>
                      <div className="flex flex-wrap gap-2">
                        {goal.contributors.map((contributor) => (
                          <Badge key={contributor} variant="outline" className="text-xs">
                            {contributor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

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
                    <Button size="sm" variant="outline" className="flex-1 rounded-xl">
                      View Details
                    </Button>
                    <Button size="sm" className="flex-1 rounded-xl">
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
      {filteredGoals.length === 0 && (
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
    </div>
  );
}