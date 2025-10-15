'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, CircleCheck as CheckCircle, Clock, CircleAlert as AlertCircle, Calendar as CalendarIcon, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';

const tasks = [
  {
    id: 1,
    title: 'Submit grocery receipts',
    description: 'Upload receipts for last week\'s grocery shopping',
    status: 'pending',
    priority: 'high',
    dueDate: '2025-01-20',
    assignedTo: 'You',
    room: 'Family Expenses',
    relatedExpense: 'Grocery Shopping - ₹2,500',
  },
  {
    id: 2,
    title: 'Review electricity bill split',
    description: 'Check if the electricity bill split is correct',
    status: 'completed',
    priority: 'medium',
    dueDate: '2025-01-18',
    assignedTo: 'Sarah',
    room: 'Family Expenses',
    relatedExpense: 'Electricity Bill - ₹1,800',
  },
  {
    id: 3,
    title: 'Plan weekend trip budget',
    description: 'Create budget breakdown for the upcoming weekend trip',
    status: 'pending',
    priority: 'low',
    dueDate: '2025-01-25',
    assignedTo: 'You',
    room: 'Friends Trip',
    relatedExpense: null,
  },
  {
    id: 4,
    title: 'Collect restaurant bill',
    description: 'Get the receipt from yesterday\'s team lunch',
    status: 'overdue',
    priority: 'high',
    dueDate: '2025-01-16',
    assignedTo: 'Mike',
    room: 'Work Lunch',
    relatedExpense: 'Team Lunch - ₹3,200',
  },
];

const rooms = [
  { id: '1', name: 'Family Expenses', avatar: '👨‍👩‍👧‍👦' },
  { id: '2', name: 'Friends Trip', avatar: '🏖️' },
  { id: '3', name: 'Work Lunch', avatar: '🍽️' },
];

const members = [
  { id: '1', name: 'You', avatar: '' },
  { id: '2', name: 'Sarah', avatar: '' },
  { id: '3', name: 'Dad', avatar: '' },
  { id: '4', name: 'Mom', avatar: '' },
  { id: '5', name: 'Mike', avatar: '' },
];

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [dueDate, setDueDate] = useState<Date>();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-orange-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300';
      case 'overdue':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300';
      default:
        return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return task.status === 'pending';
    if (activeTab === 'completed') return task.status === 'completed';
    if (activeTab === 'overdue') return task.status === 'overdue';
    return true;
  });

  const taskCounts = {
    all: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    overdue: tasks.filter(t => t.status === 'overdue').length,
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
          <h1 className="text-3xl font-bold">Tasks & Reminders</h1>
          <p className="text-muted-foreground">Manage expense-related tasks and stay organized</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl">
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>
                Add a new task or reminder for expense management.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="taskTitle">Task Title</Label>
                <Input
                  id="taskTitle"
                  placeholder="e.g., Submit grocery receipts"
                  className="rounded-xl mt-1"
                />
              </div>
              <div>
                <Label htmlFor="taskDescription">Description</Label>
                <Textarea
                  id="taskDescription"
                  placeholder="Add task details..."
                  className="rounded-xl mt-1"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Priority</Label>
                  <Select>
                    <SelectTrigger className="rounded-xl mt-1">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Assign To</Label>
                  <Select>
                    <SelectTrigger className="rounded-xl mt-1">
                      <SelectValue placeholder="Select member" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal rounded-xl mt-1"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Related Room</Label>
                <Select>
                  <SelectTrigger className="rounded-xl mt-1">
                    <SelectValue placeholder="Select room" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        <div className="flex items-center gap-2">
                          <span>{room.avatar}</span>
                          <span>{room.name}</span>
                        </div>
                      </SelectItem>
                    ))}
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
                  Create Task
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { key: 'all', label: 'Total Tasks', count: taskCounts.all, icon: Clock, color: 'bg-blue-50 dark:bg-blue-950' },
          { key: 'pending', label: 'Pending', count: taskCounts.pending, icon: Clock, color: 'bg-orange-50 dark:bg-orange-950' },
          { key: 'completed', label: 'Completed', count: taskCounts.completed, icon: CheckCircle, color: 'bg-green-50 dark:bg-green-950' },
          { key: 'overdue', label: 'Overdue', count: taskCounts.overdue, icon: AlertCircle, color: 'bg-red-50 dark:bg-red-950' },
        ].map((stat, index) => (
          <motion.div
            key={stat.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab(stat.key)}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-2xl flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="h-5 w-5 text-current" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filter Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 rounded-2xl">
            <TabsTrigger value="all" className="rounded-xl">All ({taskCounts.all})</TabsTrigger>
            <TabsTrigger value="pending" className="rounded-xl">Pending ({taskCounts.pending})</TabsTrigger>
            <TabsTrigger value="completed" className="rounded-xl">Done ({taskCounts.completed})</TabsTrigger>
            <TabsTrigger value="overdue" className="rounded-xl">Overdue ({taskCounts.overdue})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <div className="space-y-4">
              {filteredTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3">
                          {getStatusIcon(task.status)}
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">{task.title}</h3>
                            <p className="text-muted-foreground text-sm mb-3">{task.description}</p>
                            
                            <div className="flex flex-wrap gap-2 mb-3">
                              <Badge className={getStatusColor(task.status)}>
                                {task.status}
                              </Badge>
                              <Badge variant="outline" className={getPriorityColor(task.priority)}>
                                {task.priority} priority
                              </Badge>
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <CalendarIcon className="h-3 w-3" />
                                Due: {new Date(task.dueDate).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {task.assignedTo}
                              </div>
                              <div className="flex items-center gap-1">
                                <span>📍</span>
                                {task.room}
                              </div>
                            </div>

                            {task.relatedExpense && (
                              <div className="mt-3 p-3 bg-muted/50 rounded-xl">
                                <p className="text-sm font-medium">Related Expense</p>
                                <p className="text-sm text-muted-foreground">{task.relatedExpense}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {task.status !== 'completed' && (
                          <Button size="sm" className="rounded-xl">
                            Mark Complete
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="rounded-xl">
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-xl">
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {filteredTasks.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="h-20 w-20 bg-muted rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No tasks found</h3>
                <p className="text-muted-foreground mb-6">
                  {activeTab === 'all' 
                    ? "You don't have any tasks yet. Create your first task to get started!"
                    : `No ${activeTab} tasks found. Try switching to a different filter.`
                  }
                </p>
                {activeTab === 'all' && (
                  <Button onClick={() => setIsCreateModalOpen(true)} className="rounded-2xl">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Task
                  </Button>
                )}
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}