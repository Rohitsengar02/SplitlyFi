'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Users, DollarSign, Target, FileText, Settings, Share2, QrCode, Copy, CheckCircle, ArrowUpRight, ArrowDownRight, Wallet, User, Filter, Calendar as CalendarIcon, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/calender/calender';
import { DateRange } from 'react-day-picker';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, onSnapshot, orderBy, limit, addDoc, updateDoc, increment, arrayUnion } from 'firebase/firestore';
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
  contributorAmounts?: Record<string, number>; // Track individual contributions
}

interface Note {
  id: string;
  title: string;
  content: string;
  author: string;
  authorId: string;
  createdAt: string;
}

interface Member {
  id: string;
  uid: string;
  joinedAt: any;
  displayName?: string;
  photoURL?: string;
}

interface UserProfile {
  displayName?: string;
  photoURL?: string;
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
  const [members, setMembers] = useState<Member[]>([]);
  const [memberTotals, setMemberTotals] = useState<Record<string, number>>({});
  const [memberPaidTotals, setMemberPaidTotals] = useState<Record<string, number>>({});
  const [memberOwedTotals, setMemberOwedTotals] = useState<Record<string, number>>({});
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  // Filter states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  
  // Goal dialog states
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalDueDate, setGoalDueDate] = useState('');
  
  // Note dialog states
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  
  // Goal contribution states
  const [isContributeDialogOpen, setIsContributeDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');

  const stickerList = ['🍕','🎟️','🧾','🍔','🚗','🛒','🎉','🧃','☕','🍽️','🎁','🚌','🏖️','🧼','🔧'];
  const pickSticker = (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return stickerList[h % stickerList.length];
  };

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
        const expensesUnsubscribe = onSnapshot(expensesQuery, async (snapshot) => {
          const fetchedExpenses: Expense[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Expense));
          setExpenses(fetchedExpenses);

          // Collect unique UIDs involved in these expenses (payer + selected members)
          const uids = new Set<string>();
          fetchedExpenses.forEach((e) => {
            if (e.addedBy) uids.add(e.addedBy);
            (e.selectedMembers || []).forEach((u) => uids.add(u));
          });

          // Fetch profiles for those UIDs
          const entries = await Promise.all(Array.from(uids).map(async (uid) => {
            try {
              const uref = doc(db, 'users', uid);
              const usnap = await getDoc(uref);
              if (usnap.exists()) {
                const u = usnap.data() as UserProfile;
                return [uid, { displayName: u.displayName, photoURL: u.photoURL }] as const;
              }
            } catch {}
            return [uid, {}] as const;
          }));
          setProfiles((prev) => {
            const next = { ...prev };
            entries.forEach(([uid, p]) => { next[uid] = { ...next[uid], ...p }; });
            return next;
          });

          // Aggregate per-member paid and owed from room expenses
          const paid: Record<string, number> = {};
          const owed: Record<string, number> = {};
          fetchedExpenses.forEach((e) => {
            const total = (e.totalAmount ?? e.amount ?? 0) as number;
            const payer = e.addedBy;
            if (payer) paid[payer] = (paid[payer] || 0) + total;
            const members = e.selectedMembers || [];
            if (members.length > 0) {
              if (e.splitType === 'custom' && e.customSplits) {
                members.forEach((uid) => {
                  const share = Number((e.customSplits as Record<string, number>)[uid] || 0);
                  owed[uid] = (owed[uid] || 0) + share;
                });
              } else {
                const share = total / members.length;
                members.forEach((uid) => {
                  owed[uid] = (owed[uid] || 0) + share;
                });
              }
            }
          });
          setMemberPaidTotals(paid);
          setMemberOwedTotals(owed);
          // Maintain legacy memberTotals as 'paid' for backward compatibility in UI
          setMemberTotals(paid);
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
          orderBy('createdAt', 'desc')
        );
        const notesUnsubscribe = onSnapshot(notesQuery, (snapshot) => {
          const fetchedNotes: Note[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Note));
          setNotes(fetchedNotes);
        });

        // Fetch members + hydrate with user profiles
        const membersQuery = query(
          collection(db, 'rooms', roomId, 'members'),
          orderBy('joinedAt', 'asc')
        );
        const membersUnsubscribe = onSnapshot(membersQuery, async (snapshot) => {
          const baseMembers: Member[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
          // load user profiles for each member
          const enriched = await Promise.all(
            baseMembers.map(async (m) => {
              try {
                const uref = doc(db, 'users', m.uid);
                const usnap = await getDoc(uref);
                if (usnap.exists()) {
                  const u = usnap.data() as { displayName?: string; photoURL?: string };
                  return { ...m, displayName: u.displayName, photoURL: u.photoURL } as Member;
                }
              } catch (_) {}
              return m;
            })
          );
          setMembers(enriched);
        });

        

        setLoading(false);

        return () => {
          expensesUnsubscribe();
          goalsUnsubscribe();
          notesUnsubscribe();
          membersUnsubscribe();
        };
      } catch (err) {
        console.error('Error fetching room data:', err);
        setError('Failed to load room data');
        setLoading(false);
      }
    };

    fetchRoomData();
  }, [roomId, user]);

  // Filter expenses by date range
  useEffect(() => {
    if (!dateRange?.from) {
      setFilteredExpenses(expenses);
      return;
    }

    const filtered = expenses.filter((expense) => {
      if (!dateRange.from) return true;
      
      const expenseDate = new Date(expense.date);
      const from = dateRange.from;
      const to = dateRange.to || dateRange.from;

      // Reset time to start of day for accurate comparison
      const expenseDateOnly = new Date(expenseDate.getFullYear(), expenseDate.getMonth(), expenseDate.getDate());
      const fromDateOnly = new Date(from.getFullYear(), from.getMonth(), from.getDate());
      const toDateOnly = new Date(to.getFullYear(), to.getMonth(), to.getDate());

      return expenseDateOnly >= fromDateOnly && expenseDateOnly <= toDateOnly;
    });

    setFilteredExpenses(filtered);
  }, [expenses, dateRange]);

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const clearDateFilter = () => {
    setDateRange(undefined);
    setFilteredExpenses(expenses);
  };

  const applyDateFilter = () => {
    setIsCalendarOpen(false);
  };

  const setPresetRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setDateRange({ from: start, to: end });
  };

  const setPresetWeek = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    setDateRange({ from: start, to: end });
  };

  const setPresetMonth = () => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 1);
    setDateRange({ from: start, to: end });
  };

  const setPresetThisMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setDateRange({ from: start, to: end });
  };

  const setPresetLastMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    setDateRange({ from: start, to: end });
  };

  const handleCreateGoal = async () => {
    if (!goalName || !goalTarget || !goalDueDate || !user) return;
    
    try {
      const newGoal = {
        name: goalName,
        target: parseFloat(goalTarget),
        saved: 0,
        dueDate: goalDueDate,
        contributors: [],
        contributorAmounts: {},
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'rooms', roomId, 'goals'), newGoal);
      
      // Reset form
      setGoalName('');
      setGoalTarget('');
      setGoalDueDate('');
      setIsGoalDialogOpen(false);
    } catch (error) {
      console.error('Error creating goal:', error);
    }
  };

  const handleCreateNote = async () => {
    if (!noteTitle || !noteContent || !user) return;
    
    try {
      const newNote = {
        title: noteTitle,
        content: noteContent,
        author: user.displayName || user.email || 'Anonymous',
        authorId: user.uid,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'rooms', roomId, 'notes'), newNote);
      
      // Reset form
      setNoteTitle('');
      setNoteContent('');
      setIsNoteDialogOpen(false);
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const handleContributeToGoal = async () => {
    if (!selectedGoal || !contributionAmount || !user) return;
    
    const amount = parseFloat(contributionAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    try {
      const goalRef = doc(db, 'rooms', roomId, 'goals', selectedGoal.id);
      const contributorName = user.displayName || user.email || 'Anonymous';
      
      // Get current contributor amount and add new contribution
      const currentAmount = selectedGoal.contributorAmounts?.[contributorName] || 0;
      const newAmount = currentAmount + amount;
      
      await updateDoc(goalRef, {
        saved: increment(amount),
        contributors: arrayUnion(contributorName),
        [`contributorAmounts.${contributorName}`]: newAmount
      });
      
      // Reset form
      setContributionAmount('');
      setSelectedGoal(null);
      setIsContributeDialogOpen(false);
    } catch (error) {
      console.error('Error contributing to goal:', error);
    }
  };

  const openContributeDialog = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsContributeDialogOpen(true);
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
        className="flex flex-col gap-4"
      >
        {/* Top Row - Back button, Room info, and Actions */}
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="h-10 w-10 p-0 rounded-2xl shrink-0 mt-1"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 sm:h-16 sm:w-16 shrink-0">
                <AvatarImage src={room.imageUrl || ''} />
                <AvatarFallback className="text-lg sm:text-2xl">
                  {room.title[0]?.toUpperCase() || 'R'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl font-bold truncate">{room.title}</h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{room.description}</p>
              </div>
            </div>
          </div>

          <div className="hidden sm:flex gap-2 items-center shrink-0">
            <Button variant="outline" size="sm" className="rounded-2xl">
              <Share2 className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Share</span>
            </Button>
            <Button variant="outline" size="sm" className="rounded-2xl">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

      {/* Stats Cards Carousel */}
      <div className="relative">
  <div className="overflow-x-auto pb-6 -mx-2 px-2">
    <div className="flex gap-6 snap-x snap-mandatory">
      
      {/* Room Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="min-w-[280px] h-[200px] snap-start"
      >
        <Card className="bg-gradient-to-br from-blue-50/60 to-indigo-100/50 dark:from-blue-900/20 dark:to-indigo-950/30 backdrop-blur-xl border border-white/10 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-6 space-y-2">
            <div className="text-sm text-muted-foreground">🏷️ Room Info</div>
            <div className="mt-1 font-semibold text-lg truncate">{room.title}</div>
            <div className="text-xs text-muted-foreground truncate">{room.description}</div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-muted-foreground">Category</div>
                <Badge variant="secondary" className="mt-1 rounded-full bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300">
                  {room.category}
                </Badge>
              </div>
              <div>
                <div className="text-muted-foreground">Currency</div>
                <div className="font-medium mt-1">{room.currency}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* See Full Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="min-w-[280px] h-[200px] snap-start"
      >
        <Card className="bg-gradient-to-br from-sky-50/60 to-blue-100/50 dark:from-blue-900/20 dark:to-indigo-950/30 backdrop-blur-xl hover:shadow-2xl transition-all hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">⚡ Actions</div>
            <div className="mt-1 font-semibold text-lg">See full details</div>
            <div className="text-xs text-muted-foreground">Open all transactions & analytics</div>
            <div className="mt-4">
              <Button
                className="w-full rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:scale-[1.02] transition-transform shadow-md"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                Open Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Cards Carousel */}
      <div className="relative -mx-6 px-6">
        <div className="overflow-x-auto scrollbar-hide pb-4">
          <div 
            className="flex gap-4 snap-x snap-mandatory"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {/* Total Expenses */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="w-[280px] h-[140px] shrink-0 snap-start"
            >
              <Card className="h-full bg-gradient-to-br from-amber-50/60 to-orange-100/50 dark:from-amber-900/20 dark:to-orange-950/30 backdrop-blur-xl hover:shadow-xl hover:-translate-y-1 transition-all">
                <CardContent className="p-5 h-full flex items-center gap-4">
                  <div className="h-14 w-14 bg-amber-500/10 rounded-2xl flex items-center justify-center shrink-0">
                    <DollarSign className="h-7 w-7 text-amber-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Total Expenses</p>
                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 truncate">
                      ₹{filteredExpenses.reduce((sum, exp) => sum + (exp.totalAmount || exp.amount), 0).toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Members Count */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-[280px] h-[140px] shrink-0 snap-start"
            >
              <Card className="h-full bg-gradient-to-br from-blue-50/60 to-cyan-100/50 dark:from-blue-900/20 dark:to-cyan-950/30 backdrop-blur-xl hover:shadow-xl hover:-translate-y-1 transition-all">
                <CardContent className="p-5 h-full flex items-center gap-4">
                  <div className="h-14 w-14 bg-blue-500/10 rounded-2xl flex items-center justify-center shrink-0">
                    <Users className="h-7 w-7 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Members</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 truncate">{room.membersCount}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Active Goals */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="w-[280px] h-[140px] shrink-0 snap-start"
            >
              <Card className="h-full bg-gradient-to-br from-green-50/60 to-emerald-100/50 dark:from-green-900/20 dark:to-emerald-950/30 backdrop-blur-xl hover:shadow-xl hover:-translate-y-1 transition-all">
                <CardContent className="p-5 h-full flex items-center gap-4">
                  <div className="h-14 w-14 bg-green-500/10 rounded-2xl flex items-center justify-center shrink-0">
                    <Target className="h-7 w-7 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Active Goals</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300 truncate">{goals.length}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Your Balance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="w-[280px] h-[140px] shrink-0 snap-start"
            >
              <Card className="h-full bg-gradient-to-br from-purple-50/60 to-pink-100/50 dark:from-purple-900/20 dark:to-pink-950/30 backdrop-blur-xl hover:shadow-xl hover:-translate-y-1 transition-all">
                <CardContent className="p-5 h-full flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-muted-foreground">Your Balance</p>
                    {(() => {
                      const net = (memberPaidTotals[user?.uid || ""] || 0) - (memberOwedTotals[user?.uid || ""] || 0);
                      return (
                        <div className={`text-2xl font-bold ${net >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {net >= 0 ? "+" : "-"}₹{Math.abs(net).toLocaleString()}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-muted-foreground mb-1">You Paid</div>
                      <div className="font-semibold text-green-600">₹{(memberPaidTotals[user?.uid || ""] || 0).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">Your Share</div>
                      <div className="font-semibold text-red-600">₹{(memberOwedTotals[user?.uid || ""] || 0).toLocaleString()}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
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
              {filteredExpenses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {dateRange?.from ? 'No expenses found in selected date range' : 'No expenses yet'}
                  </p>
                  {dateRange?.from && (
                    <Button variant="link" onClick={clearDateFilter} className="mt-2">
                      Clear filter to see all expenses
                    </Button>
                  )}
                </div>
              ) : (
                filteredExpenses.map((expense, index) => (
                  <motion.div
                    key={expense.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-xl">
                              {pickSticker(expense.id)}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-semibold truncate">{expense.title}</h4>
                              <p className="text-sm text-muted-foreground truncate">
                                {new Date(expense.date).toLocaleDateString()} • {expense.category}
                              </p>
                              {expense.selectedMembers && expense.selectedMembers.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {expense.selectedMembers.slice(0, 6).map((uid) => {
                                    const isCustom = expense.splitType === 'custom';
                                    const share = isCustom
                                      ? Number((expense.customSplits as any)?.[uid] || 0)
                                      : ((expense.totalAmount || expense.amount || 0) / (expense.selectedMembers?.length || 1));
                                    return (
                                      <div key={uid} className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-xs">
                                        <Avatar className="h-5 w-5">
                                          {profiles[uid]?.photoURL ? <AvatarImage src={profiles[uid]?.photoURL as string} /> : null}
                                          <AvatarFallback>{(profiles[uid]?.displayName || uid)[0]?.toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <span className="max-w-[120px] truncate">{profiles[uid]?.displayName || `User ${uid.slice(0, 6)}`}</span>
                                        <Badge variant="secondary" className="ml-1">₹{share.toFixed(2)}</Badge>
                                      </div>
                                    );
                                  })}
                                  {expense.selectedMembers.length > 6 && (
                                    <Badge variant="outline" className="text-xs">+{expense.selectedMembers.length - 6} more</Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-bold text-lg">₹{(expense.totalAmount || expense.amount).toLocaleString()}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <h3 className="text-lg font-semibold">Room Members</h3>
                <p className="text-sm text-muted-foreground">Track who paid, owes, and balances in this room.</p>
              </div>

              <Button
                variant="outline"
                onClick={() => copyToClipboard(room.joinCode)}
                className="flex items-center gap-2"
              >
                {copiedCode === room.joinCode ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Invite Code: {room.joinCode}
                  </>
                )}
              </Button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member, index) => {
          const paid = memberPaidTotals[member.uid] || 0;
          const owes = memberOwedTotals[member.uid] || 0;
          const net = paid - owes;
          const name = member.uid === user?.uid ? "You" : member.displayName || `User ${member.uid.slice(0, 8)}`;
          const isPositive = net >= 0;

          return (
            <motion.div
              key={member.uid}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="shadow-md border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all bg-white dark:bg-gray-900">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    {member.photoURL ? (
                      <img
                        src={member.photoURL}
                        alt={name}
                        className="w-12 h-12 rounded-full object-cover border border-gray-300"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white text-lg font-semibold">
                        {member.uid[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">{name}</CardTitle>
                      <p className="text-xs text-gray-500">{member.uid}</p>
                    </div>
                  </div>
                  
                </CardHeader>

                <CardContent className="space-y-3 mt-2">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Paid</span>
                    <span className="font-medium text-green-600">₹{paid.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Share</span>
                    <span className="font-medium text-red-500">₹{owes.toLocaleString()}</span>
                  </div>

                  <div
                    className={`flex justify-between items-center text-sm font-semibold rounded-lg p-2 ${
                      isPositive
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                        : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {isPositive ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                      Net
                    </span>
                    <span>
                      {isPositive ? "+" : "-"}₹{Math.abs(net).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Shared Goals</h3>
              <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-2xl">
                    <Plus className="h-4 w-4 mr-2" />
                    New Goal
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Create New Goal</DialogTitle>
                    <DialogDescription>
                      Set a savings goal for your room. Track progress together!
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label htmlFor="goalName" className="text-sm font-medium">
                        Goal Name
                      </label>
                      <input
                        id="goalName"
                        type="text"
                        placeholder="e.g., Trip to Goa, New Laptop"
                        value={goalName}
                        onChange={(e) => setGoalName(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="goalTarget" className="text-sm font-medium">
                        Target Amount (₹)
                      </label>
                      <input
                        id="goalTarget"
                        type="number"
                        placeholder="10000"
                        value={goalTarget}
                        onChange={(e) => setGoalTarget(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="goalDueDate" className="text-sm font-medium">
                        Due Date
                      </label>
                      <input
                        id="goalDueDate"
                        type="date"
                        value={goalDueDate}
                        onChange={(e) => setGoalDueDate(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setIsGoalDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateGoal} disabled={!goalName || !goalTarget || !goalDueDate}>
                      Create Goal
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
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
                              {goal.target > 0 ? Math.round((goal.saved / goal.target) * 100) : 0}%
                            </Badge>
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span>Progress</span>
                              <span>₹{goal.saved.toLocaleString()} / ₹{goal.target.toLocaleString()}</span>
                            </div>
                            <Progress value={goal.target > 0 ? (goal.saved / goal.target) * 100 : 0} className="h-3" />
                          </div>
                          <div>
                            <p className="text-sm font-medium mb-2">Contributors ({goal.contributors.length})</p>
                            <div className="space-y-2">
                              {goal.contributors.map((contributor, idx) => {
                                const contributorAmount = goal.contributorAmounts?.[contributor] || 0;
                                return (
                                  <div key={`${contributor}-${idx}`} className="flex items-center justify-between bg-muted/50 px-3 py-2 rounded-lg">
                                    <span className="text-sm font-medium">{contributor}</span>
                                    <span className="text-sm font-semibold text-primary">₹{contributorAmount.toLocaleString()}</span>
                                  </div>
                                );
                              })}
                              {goal.contributors.length === 0 && (
                                <p className="text-xs text-muted-foreground italic">No contributions yet</p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button 
                              onClick={() => openContributeDialog(goal)}
                              className="flex-1 rounded-xl"
                              size="sm"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Contribute
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Contribute to Goal Dialog */}
          <Dialog open={isContributeDialogOpen} onOpenChange={setIsContributeDialogOpen}>
            <DialogContent className="sm:max-w-[450px]">
              <DialogHeader>
                <DialogTitle>Contribute to Goal</DialogTitle>
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
                  <label htmlFor="contributionAmount" className="text-sm font-medium">
                    Contribution Amount (₹)
                  </label>
                  <input
                    id="contributionAmount"
                    type="number"
                    placeholder="Enter amount"
                    value={contributionAmount}
                    onChange={(e) => setContributionAmount(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    min="1"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsContributeDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleContributeToGoal} disabled={!contributionAmount || parseFloat(contributionAmount) <= 0}>
                  Add Contribution
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Room Notes</h3>
              <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-2xl">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Note
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Add New Note</DialogTitle>
                    <DialogDescription>
                      Share important information with your room members
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label htmlFor="noteTitle" className="text-sm font-medium">
                        Note Title
                      </label>
                      <input
                        id="noteTitle"
                        type="text"
                        placeholder="e.g., Payment Reminder, House Rules"
                        value={noteTitle}
                        onChange={(e) => setNoteTitle(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="noteContent" className="text-sm font-medium">
                        Content
                      </label>
                      <textarea
                        id="noteContent"
                        placeholder="Write your note here..."
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        rows={6}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setIsNoteDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateNote} disabled={!noteTitle || !noteContent}>
                      Add Note
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
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
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <div className="h-10 w-10 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-base mb-2">{note.title}</h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{note.content}</p>
                            <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                              <span className="font-medium">{note.author}</span>
                              <span>•</span>
                              <span>{new Date(note.createdAt).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}</span>
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
        </Tabs>
      </motion.div>
    </div>
  );
}
