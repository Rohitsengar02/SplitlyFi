'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Users, DollarSign, Target, FileText, Settings, Share2, QrCode, Copy, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '@/components/auth-provider';

interface Room {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  hasLimit: boolean;
  userLimit: number | null;
  currency: string;
  category: string;
  joinCode: string;
  members: string[];
  membersCount: number;
  totalExpenses: number;
  createdBy: string;
  createdAt: any;
  updatedAt: any;
}

interface Expense {
  id: string;
  title: string;
  amount: number;
  addedBy: string;
  date: string;
  category: string;
  selectedMembers: string[];
  splitType?: string;
  customSplits?: Record<string, number>;
  note?: string;
  type?: string;
  roomId?: string;
  roomTitle?: string;
  addedByName?: string;
  addedByEmail?: string;
  totalAmount?: number;
  createdAt?: any;
  updatedAt?: any;
}

interface Goal {
  id: string;
  name: string;
  target: number;
  saved: number;
  dueDate: string;
  contributors: string[];
}

interface Note {
  id: string;
  content: string;
  author: string;
  date: string;
}

export default function RoomDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const roomId = params.roomId as string;

  const [room, setRoom] = useState<Room | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId || !user) return;

    const fetchRoomData = async () => {
      try {
        // Fetch room details
        const roomRef = doc(db, 'rooms', roomId);
        const roomSnap = await getDoc(roomRef);

        if (!roomSnap.exists()) {
          setError('Room not found');
          return;
        }

        const roomData = roomSnap.data() as Room;
        setRoom(roomData);

        // Fetch expenses
        const expensesQuery = query(
          collection(db, 'rooms', roomId, 'expenses'),
          orderBy('date', 'desc'),
          limit(10)
        );
        const expensesUnsubscribe = onSnapshot(expensesQuery, (snapshot) => {
          const fetchedExpenses: Expense[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Expense));
          setExpenses(fetchedExpenses);
        });

        // Fetch goals
        const goalsQuery = query(
          collection(db, 'rooms', roomId, 'goals'),
          orderBy('createdAt', 'desc')
        );
        const goalsUnsubscribe = onSnapshot(goalsQuery, (snapshot) => {
          const fetchedGoals: Goal[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Goal));
          setGoals(fetchedGoals);
        });

        // Fetch notes
        const notesQuery = query(
          collection(db, 'rooms', roomId, 'notes'),
          orderBy('date', 'desc')
        );
        const notesUnsubscribe = onSnapshot(notesQuery, (snapshot) => {
          const fetchedNotes: Note[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Note));
          setNotes(fetchedNotes);
        });

        setLoading(false);

        return () => {
          expensesUnsubscribe();
          goalsUnsubscribe();
          notesUnsubscribe();
        };
      } catch (err) {
        console.error('Error fetching room data:', err);
        setError('Failed to load room data');
        setLoading(false);
      }
    };

    fetchRoomData();
  }, [roomId, user]);

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading room...</p>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error || 'Room not found'}</p>
      </div>
    );
  }

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
            <Avatar className="h-16 w-16">
              <AvatarImage src={room.imageUrl || ''} />
              <AvatarFallback className="text-2xl">
                {room.title[0]?.toUpperCase() || 'R'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{room.title}</h1>
              <p className="text-muted-foreground">{room.description}</p>
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
                  <p className="text-2xl font-bold">₹{room.totalExpenses.toLocaleString()}</p>
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
                  <p className="text-2xl font-bold">{room.membersCount}</p>
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
        <Tabs defaultValue="expenses" className="space-y-6">
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
              <Link href={`/rooms/${roomId}/add-expense`}>
                <Button className="rounded-2xl">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {expenses.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No expenses yet</p>
              ) : (
                expenses.map((expense, index) => (
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
                                Paid by {expense.addedByName || expense.addedBy} • {expense.date}
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
                            Split with: {expense.selectedMembers?.join(', ') || 'No splits'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Room Members</h3>
              <Button variant="outline" className="rounded-2xl" onClick={() => copyToClipboard(room.joinCode)}>
                {copiedCode === room.joinCode ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <QrCode className="h-4 w-4 mr-2" />
                    Invite Code: {room.joinCode}
                  </>
                )}
              </Button>
            </div>
            <div className="grid gap-4">
              {Array.isArray(room.members)
                ? room.members.map((uid, index) => (
                    <motion.div
                      key={uid}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-12 w-12">
                                <AvatarFallback>{uid[0].toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="font-semibold">{uid === user?.uid ? 'You' : `User ${uid.slice(0, 8)}`}</h4>
                                <p className="text-sm text-muted-foreground">{uid}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-green-600">₹0</p>
                              <Badge variant="secondary">Member</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                : Object.keys(room.members || {}).map((uid, index) => (
                    <motion.div
                      key={uid}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-12 w-12">
                                <AvatarFallback>{uid[0].toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="font-semibold">{uid === user?.uid ? 'You' : `User ${uid.slice(0, 8)}`}</h4>
                                <p className="text-sm text-muted-foreground">{uid}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-green-600">₹0</p>
                              <Badge variant="secondary">Member</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
              }
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
              {goals.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No goals yet</p>
              ) : (
                goals.map((goal, index) => (
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
                ))
              )}
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
              {notes.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No notes yet</p>
              ) : (
                notes.map((note, index) => (
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
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}