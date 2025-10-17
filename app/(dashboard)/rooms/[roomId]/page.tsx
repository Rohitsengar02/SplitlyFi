'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Users, DollarSign, Target, FileText, Settings, Share2, QrCode, Copy, CheckCircle, ArrowUpRight, ArrowDownRight, Wallet, User } from 'lucide-react';
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

      {/* Stats Cards Carousel */}
      <div className="relative">
  <div className="overflow-x-auto pb-6 -mx-2 px-2">
    <div className="flex gap-6 snap-x snap-mandatory">
      


      {/* Total Expenses */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="min-w-[280px] h-[200px] snap-start"
      >
        <Card className="bg-gradient-to-br from-amber-50/60 to-orange-100/50 dark:from-amber-900/20 dark:to-orange-950/30 backdrop-blur-xl hover:shadow-2xl hover:-translate-y-1 transition-all">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 bg-amber-500/10 rounded-2xl flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">₹{room.totalExpenses.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Members Count */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="min-w-[280px] min-h-[200px] snap-start"
      >
        <Card className="bg-gradient-to-br from-blue-50/60 to-cyan-100/50 dark:from-blue-900/20 dark:to-cyan-950/30 backdrop-blur-xl hover:shadow-2xl hover:-translate-y-1 transition-all">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Members</p>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{room.membersCount}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Active Goals */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="min-w-[280px] min-h-[200px] snap-start"
      >
        <Card className="bg-gradient-to-br from-green-50/60 to-emerald-100/50 dark:from-green-900/20 dark:to-emerald-950/30 backdrop-blur-xl hover:shadow-2xl hover:-translate-y-1 transition-all">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 bg-green-500/10 rounded-2xl flex items-center justify-center">
              <Target className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Goals</p>
              <p className="text-3xl font-bold text-green-700 dark:text-green-300">{goals.length}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Member Avatars */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="min-w-[280px] min-h-[200px] snap-start"
      >
        <Card className="bg-gradient-to-br from-purple-50/60 to-pink-100/50 dark:from-purple-900/20 dark:to-pink-950/30 backdrop-blur-xl hover:shadow-2xl hover:-translate-y-1 transition-all">
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">👥 Members</div>
            <div className="flex -space-x-2 mt-3">
              {members.slice(0, 8).map(m => (
                <Avatar key={m.id} className="h-10 w-10 ring-2 ring-background border border-white shadow-md hover:scale-105 transition-transform">
                  {m.photoURL ? <AvatarImage src={m.photoURL} /> : null}
                  <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    {m.uid[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {members.length > 8 && (
                <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center text-xs ring-2 ring-background">+{members.length - 8}</div>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-3">Total {members.length} members</div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Your Expense */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="min-w-[280px] min-h-[200px] snap-start"
      >
        <Card className="bg-gradient-to-br from-pink-50/60 to-rose-100/50 dark:from-pink-900/20 dark:to-rose-950/30 backdrop-blur-xl hover:shadow-2xl hover:-translate-y-1 transition-all">
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">💰 Your Expense in Group</div>
            <div className="mt-1 text-3xl font-bold text-pink-700 dark:text-pink-300">
              ₹{(memberPaidTotals[user?.uid || ""] || 0).toLocaleString()}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-muted-foreground">Your Share</div>
                <div className="font-medium">₹{(memberOwedTotals[user?.uid || ""] || 0).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Net</div>
                {(() => {
                  const net = (memberPaidTotals[user?.uid || ""] || 0) - (memberOwedTotals[user?.uid || ""] || 0);
                  return (
                    <div className={`font-medium ${net >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {net >= 0 ? "+" : "-"}₹{Math.abs(net).toLocaleString()}
                    </div>
                  );
                })()}
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





    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-3xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            <User className="w-6 h-6 text-blue-500" /> Room Members
          </h2>
          <p className="text-gray-500 text-sm">Track who paid, owes, and balances in this room.</p>
        </div>

        <Button
          variant="outline"
          onClick={() => copyToClipboard(room.joinCode)}
          className="flex items-center gap-2 border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 dark:border-blue-400"
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

      {/* Members Grid */}
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
    </div>
  );

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
