'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Users, DollarSign, Target, FileText, Settings, Share2, QrCode } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const roomData = {
  id: 'family-room',
  name: 'Family Expenses',
  description: 'Household and family related expenses',
  avatar: '👨‍👩‍👧‍👦',
  code: 'FAM123',
  totalExpenses: 25400,
  members: [
    { id: '1', name: 'You', email: 'john@example.com', avatar: '', balance: -850, role: 'admin' },
    { id: '2', name: 'Sarah', email: 'sarah@example.com', avatar: '', balance: 420, role: 'member' },
    { id: '3', name: 'Dad', email: 'dad@example.com', avatar: '', balance: 200, role: 'member' },
    { id: '4', name: 'Mom', email: 'mom@example.com', avatar: '', balance: 230, role: 'member' },
  ],
};

const expenses = [
  {
    id: 1,
    title: 'Grocery Shopping',
    amount: 2500,
    paidBy: 'You',
    date: '2025-01-15',
    category: 'Food',
    splitWith: ['Sarah', 'Dad', 'Mom'],
    receipt: true,
  },
  {
    id: 2,
    title: 'Electricity Bill',
    amount: 1800,
    paidBy: 'Dad',
    date: '2025-01-14',
    category: 'Utilities',
    splitWith: ['You', 'Sarah', 'Mom'],
    receipt: false,
  },
  {
    id: 3,
    title: 'Internet Bill',
    amount: 999,
    paidBy: 'You',
    date: '2025-01-13',
    category: 'Utilities',
    splitWith: ['Sarah', 'Dad', 'Mom'],
    receipt: true,
  },
];

const goals = [
  {
    id: 1,
    name: 'Family Vacation',
    target: 100000,
    saved: 45000,
    dueDate: '2025-08-15',
    contributors: ['You', 'Sarah', 'Dad', 'Mom'],
  },
  {
    id: 2,
    name: 'Home Renovation',
    target: 200000,
    saved: 85000,
    dueDate: '2025-12-31',
    contributors: ['You', 'Dad', 'Mom'],
  },
];

const notes = [
  {
    id: 1,
    content: 'Remember to keep receipts for all grocery purchases',
    author: 'Mom',
    date: '2025-01-15',
  },
  {
    id: 2,
    content: 'Planning to buy new furniture next month',
    author: 'Dad',
    date: '2025-01-14',
  },
];

export default function RoomDetailPage({ params }: { params: { roomId: string } }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('expenses');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="h-10 w-10 p-0 rounded-2xl"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-3xl">{roomData.avatar}</div>
            <div>
              <h1 className="text-2xl font-bold">{roomData.name}</h1>
              <p className="text-muted-foreground">{roomData.description}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-2xl">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm" className="rounded-2xl">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                  <p className="text-2xl font-bold">₹{roomData.totalExpenses.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-50 dark:bg-blue-950 rounded-2xl flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Members</p>
                  <p className="text-2xl font-bold">{roomData.members.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-green-50 dark:bg-green-950 rounded-2xl flex items-center justify-center">
                  <Target className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Goals</p>
                  <p className="text-2xl font-bold">{goals.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 rounded-2xl">
            <TabsTrigger value="expenses" className="rounded-xl">Expenses</TabsTrigger>
            <TabsTrigger value="members" className="rounded-xl">Members</TabsTrigger>
            <TabsTrigger value="goals" className="rounded-xl">Goals</TabsTrigger>
            <TabsTrigger value="notes" className="rounded-xl">Notes</TabsTrigger>
          </TabsList>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Recent Expenses</h3>
              <Link href={`/rooms/${params.roomId}/add-expense`}>
                <Button className="rounded-2xl">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {expenses.map((expense, index) => (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-primary/10 rounded-2xl flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{expense.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              Paid by {expense.paidBy} • {expense.date}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">₹{expense.amount}</p>
                          <Badge variant="secondary" className="text-xs">
                            {expense.category}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-sm text-muted-foreground">
                          Split with: {expense.splitWith.join(', ')}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Room Members</h3>
              <Button variant="outline" className="rounded-2xl">
                <QrCode className="h-4 w-4 mr-2" />
                Invite Code: {roomData.code}
              </Button>
            </div>
            <div className="grid gap-4">
              {roomData.members.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback>{member.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-semibold">{member.name}</h4>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${
                            member.balance < 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {member.balance < 0 ? '-' : '+'}₹{Math.abs(member.balance)}
                          </p>
                          <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                            {member.role}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Shared Goals</h3>
              <Button className="rounded-2xl">
                <Plus className="h-4 w-4 mr-2" />
                New Goal
              </Button>
            </div>
            <div className="grid gap-4">
              {goals.map((goal, index) => (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-lg">{goal.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Due: {new Date(goal.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {Math.round((goal.saved / goal.target) * 100)}%
                          </Badge>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Progress</span>
                            <span>₹{goal.saved.toLocaleString()} / ₹{goal.target.toLocaleString()}</span>
                          </div>
                          <Progress value={(goal.saved / goal.target) * 100} className="h-3" />
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-2">Contributors</p>
                          <div className="flex flex-wrap gap-2">
                            {goal.contributors.map((contributor) => (
                              <Badge key={contributor} variant="secondary" className="text-xs">
                                {contributor}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Room Notes</h3>
              <Button className="rounded-2xl">
                <Plus className="h-4 w-4 mr-2" />
                Add Note
              </Button>
            </div>
            <div className="space-y-3">
              {notes.map((note, index) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 bg-primary/10 rounded-2xl flex items-center justify-center">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{note.content}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            By {note.author} • {note.date}
                          </p>
                        </div>
                      </div>
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