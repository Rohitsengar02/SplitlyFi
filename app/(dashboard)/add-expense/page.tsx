'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Upload, Camera, Users, Calculator, Calendar as CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { db } from '@/lib/firebase';
import { collection, collectionGroup, doc, onSnapshot, query, where, serverTimestamp, setDoc, addDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/components/auth-provider';

interface Room {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  membersCount: number;
  joinCode: string;
  totalExpenses: number;
  createdBy?: string;
}

interface Member {
  id: string;
  uid: string;
  displayName?: string;
  photoURL?: string;
}

const categories = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Travel',
  'Education',
  'Others'
];

export default function AddExpensePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  // Personal expense state
  const [personalDate, setPersonalDate] = useState<Date>(new Date());
  const [personalAmount, setPersonalAmount] = useState('');
  const [personalTitle, setPersonalTitle] = useState('');
  const [personalCategory, setPersonalCategory] = useState('');
  const [personalNote, setPersonalNote] = useState('');

  // Group expense state
  const [groupDate, setGroupDate] = useState<Date>(new Date());
  const [groupAmount, setGroupAmount] = useState('');
  const [groupTitle, setGroupTitle] = useState('');
  const [groupCategory, setGroupCategory] = useState('');
  const [groupNote, setGroupNote] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [customSplits, setCustomSplits] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Rooms created by the user
    const createdQ = query(collection(db, 'rooms'), where('createdBy', '==', user.uid));
    const unsubCreated = onSnapshot(createdQ, (snapshot) => {
      const createdRooms: Room[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Room));
      setRooms((prev) => {
        const byId = new Map(prev.map(r => [r.id, r]));
        createdRooms.forEach(r => byId.set(r.id, r));
        return Array.from(byId.values());
      });
      setLoading(false);
    }, (error) => {
      console.error('Error fetching created rooms:', error);
      setLoading(false);
    });

    // Rooms where the user is a member via subcollection
    const membersQ = query(collectionGroup(db, 'members'), where('uid', '==', user.uid));
    const unsubMembers = onSnapshot(membersQ, async (snapshot) => {
      try {
        const roomIds = Array.from(new Set(snapshot.docs.map(d => d.ref.parent.parent?.id).filter(Boolean))) as string[];
        const roomDocs = await Promise.all(roomIds.map(async (rid) => {
          const rref = doc(db, 'rooms', rid);
          const rsnap = await getDoc(rref);
          return rsnap.exists() ? ({ id: rsnap.id, ...rsnap.data() } as Room) : null;
        }));
        const joinedRooms = roomDocs.filter(Boolean) as Room[];
        setRooms((prev) => {
          const byId = new Map(prev.map(r => [r.id, r]));
          joinedRooms.forEach(r => byId.set(r.id, r));
          return Array.from(byId.values());
        });
        setLoading(false);
      } catch (err) {
        console.error('Error fetching joined rooms:', err);
        setLoading(false);
      }
    }, (error) => {
      console.error('Error listening memberships:', error);
      setLoading(false);
    });

    return () => {
      unsubCreated();
      unsubMembers();
    };
  }, [user]);

  // Load members for selected room for splitting
  const [roomMembers, setRoomMembers] = useState<Member[]>([]);
  useEffect(() => {
    if (!selectedRoom) {
      setRoomMembers([]);
      return;
    }
    const q = collection(db, 'rooms', selectedRoom, 'members');
    const unsub = onSnapshot(q, async (snapshot) => {
      const base: Member[] = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      // Optionally hydrate with profiles
      const enriched = await Promise.all(base.map(async (m) => {
        try {
          const uref = doc(db, 'users', m.uid);
          const usnap = await getDoc(uref);
          if (usnap.exists()) {
            const u = usnap.data() as { displayName?: string; photoURL?: string };
            return { ...m, displayName: u.displayName, photoURL: u.photoURL } as Member;
          }
        } catch {}
        return m;
      }));
      setRoomMembers(enriched);
    }, (error) => {
      console.error('Error loading room members:', error);
    });
    return () => unsub();
  }, [selectedRoom]);

  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleCustomSplitChange = (memberId: string, value: number[]) => {
    setCustomSplits(prev => ({
      ...prev,
      [memberId]: value[0]
    }));
  };

  const totalAmount = parseFloat(groupAmount) || 0;
  const equalSplit = totalAmount / selectedMembers.length;
  const customTotal = Object.values(customSplits).reduce((sum, val) => sum + val, 0);

  const handlePersonalSubmit = async () => {
    if (!user || !personalTitle || !personalAmount) return;

    try {
      const expenseData = {
        title: personalTitle.trim(),
        amount: parseFloat(personalAmount),
        category: personalCategory,
        date: personalDate.toISOString(),
        note: personalNote.trim(),
        type: 'personal',
        addedBy: user.uid,
        addedByName: user.displayName || 'User',
        addedByEmail: user.email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save to users/{uid}/personalexpence subcollection
      await addDoc(collection(db, 'users', user.uid, 'personalexpence'), expenseData);

      // Reset form
      setPersonalTitle('');
      setPersonalAmount('');
      setPersonalCategory('');
      setPersonalNote('');
      setPersonalDate(new Date());

      router.push('/dashboard');
    } catch (error) {
      console.error('Error adding personal expense:', error);
    }
  };

  const handleGroupSubmit = async () => {
    if (!user || !selectedRoom || !groupTitle || !groupAmount || selectedMembers.length === 0) return;

    try {
      const roomRef = doc(db, 'rooms', selectedRoom);
      const roomSnap = await getDoc(roomRef);
      if (!roomSnap.exists()) {
        alert('Room not found');
        return;
      }

      const roomData = roomSnap.data() as Room;

      const expenseData = {
        title: groupTitle.trim(),
        amount: parseFloat(groupAmount),
        category: groupCategory,
        date: groupDate.toISOString(),
        note: groupNote.trim(),
        type: 'group',
        roomId: selectedRoom,
        roomTitle: roomData.title,
        addedBy: user.uid,
        addedByName: user.displayName || 'User',
        addedByEmail: user.email,
        splitType,
        selectedMembers,
        customSplits: splitType === 'custom' ? customSplits : {},
        totalAmount,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Save to allexpenses collection
      await addDoc(collection(db, 'allexpenses'), expenseData);

      // Also save to room's expenses subcollection
      await addDoc(collection(db, 'rooms', selectedRoom, 'expenses'), {
        ...expenseData,
        roomId: selectedRoom,
      });

      // Update room's total expenses
      await setDoc(roomRef, {
        totalExpenses: roomData.totalExpenses + totalAmount,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // Reset form
      setGroupTitle('');
      setGroupAmount('');
      setGroupCategory('');
      setGroupNote('');
      setGroupDate(new Date());
      setSelectedRoom('');
      setSplitType('equal');
      setSelectedMembers([]);
      setCustomSplits({});

      router.push('/dashboard');
    } catch (error) {
      console.error('Error adding group expense:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading...</p>
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
        <div>
          <h1 className="text-3xl font-bold">Add New Expense</h1>
          <p className="text-muted-foreground">Record your personal or group expenses</p>
        </div>
      </motion.div>

      {/* Expense Type Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 rounded-2xl">
            <TabsTrigger value="personal" className="rounded-xl">Personal Expense</TabsTrigger>
            <TabsTrigger value="group" className="rounded-xl">Group Expense</TabsTrigger>
          </TabsList>

          {/* Personal Expense */}
          <TabsContent value="personal">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Personal Expense</CardTitle>
                  <CardDescription>Add an expense that's just for you</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="personal-title">Expense Title</Label>
                    <Input
                      id="personal-title"
                      placeholder="e.g., Coffee at Starbucks"
                      value={personalTitle}
                      onChange={(e) => setPersonalTitle(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="personal-amount">Amount (₹)</Label>
                    <Input
                      id="personal-amount"
                      type="number"
                      placeholder="0.00"
                      value={personalAmount}
                      onChange={(e) => setPersonalAmount(e.target.value)}
                      className="rounded-xl text-2xl font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={personalCategory} onValueChange={setPersonalCategory}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal rounded-xl"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {personalDate ? format(personalDate, 'PPP') : 'Pick a date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={personalDate}
                            onSelect={(date) => date && setPersonalDate(date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="personal-note">Note (Optional)</Label>
                    <Textarea
                      id="personal-note"
                      placeholder="Add any additional details..."
                      value={personalNote}
                      onChange={(e) => setPersonalNote(e.target.value)}
                      className="rounded-xl"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" className="flex-1 rounded-xl" onClick={() => router.back()}>
                      Cancel
                    </Button>
                    <Button className="flex-1 rounded-xl" onClick={handlePersonalSubmit} disabled={!personalTitle || !personalAmount}>
                      Add Personal Expense
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Group Expense */}
          <TabsContent value="group">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Group Expense
                  </CardTitle>
                  <CardDescription>Add an expense to share with a room</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Select Room</Label>
                    <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Choose a room" />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={room.imageUrl || ''} />
                                <AvatarFallback>{room.title[0]?.toUpperCase() || 'R'}</AvatarFallback>
                              </Avatar>
                              <span>{room.title}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedRoom && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="group-title">Expense Title</Label>
                        <Input
                          id="group-title"
                          placeholder="e.g., Dinner at Pizza Palace"
                          value={groupTitle}
                          onChange={(e) => setGroupTitle(e.target.value)}
                          className="rounded-xl"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="group-amount">Amount (₹)</Label>
                        <Input
                          id="group-amount"
                          type="number"
                          placeholder="0.00"
                          value={groupAmount}
                          onChange={(e) => setGroupAmount(e.target.value)}
                          className="rounded-xl text-2xl font-bold"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Select value={groupCategory} onValueChange={setGroupCategory}>
                            <SelectTrigger className="rounded-xl">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal rounded-xl"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {groupDate ? format(groupDate, 'PPP') : 'Pick a date'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={groupDate}
                                onSelect={(date) => date && setGroupDate(date)}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="group-note">Note (Optional)</Label>
                        <Textarea
                          id="group-note"
                          placeholder="Add any additional details..."
                          value={groupNote}
                          onChange={(e) => setGroupNote(e.target.value)}
                          className="rounded-xl"
                          rows={3}
                        />
                      </div>

                      {/* Split Details */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Calculator className="h-5 w-5" />
                            Split Details
                          </CardTitle>
                          <CardDescription>Choose how to split this expense</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {/* Split Type Toggle */}
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <Label>Split Type</Label>
                              <p className="text-sm text-muted-foreground">
                                {splitType === 'equal' ? 'Split equally among selected members' : 'Set custom amounts'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Label htmlFor="split-type" className="text-sm">Equal</Label>
                              <Switch
                                id="split-type"
                                checked={splitType === 'custom'}
                                onCheckedChange={(checked) => setSplitType(checked ? 'custom' : 'equal')}
                              />
                              <Label htmlFor="split-type" className="text-sm">Custom</Label>
                            </div>
                          </div>

                          {/* Member Selection */}
                          <div className="space-y-3">
                            <Label>Select Members</Label>
                            <div className="space-y-3">
                              {roomMembers.map((m) => {
                                const uid = m.uid;
                                const isSelected = selectedMembers.includes(uid);
                                const memberSplit = splitType === 'equal' ? equalSplit : (customSplits[uid] || 0);
                                return (
                                  <div
                                    key={m.id}
                                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                                    onClick={() => handleMemberToggle(uid)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                          {m.photoURL ? <AvatarImage src={m.photoURL} /> : null}
                                          <AvatarFallback>{uid[0].toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <p className="font-medium">{uid === user?.uid ? 'You' : (m.displayName || `User ${uid.slice(0, 8)}`)}</p>
                                          <p className="text-sm text-muted-foreground">{uid}</p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        {isSelected && (
                                          <Badge variant="secondary">₹{memberSplit.toFixed(2)}</Badge>
                                        )}
                                      </div>
                                    </div>
                                    {isSelected && splitType === 'custom' && (
                                      <div className="mt-4 space-y-2">
                                        <div className="flex justify-between text-sm">
                                          <span>Amount</span>
                                          <span>₹{(customSplits[uid] || 0).toFixed(2)}</span>
                                        </div>
                                        <Slider
                                          value={[customSplits[uid] || 0]}
                                          onValueChange={(value) => handleCustomSplitChange(uid, value)}
                                          max={totalAmount}
                                          step={0.01}
                                          className="w-full"
                                        />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Split Summary */}
                          <div className="bg-muted/50 rounded-2xl p-4 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">Total Amount</span>
                              <span className="font-bold text-lg">₹{totalAmount.toFixed(2)}</span>
                            </div>
                            {splitType === 'custom' && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Allocated</span>
                                <span className={`text-sm font-medium ${
                                  Math.abs(customTotal - totalAmount) < 0.01
                                    ? 'text-green-600'
                                    : 'text-red-600'
                                }`}>
                                  ₹{customTotal.toFixed(2)}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Selected Members</span>
                              <span className="text-sm font-medium">{selectedMembers.length}</span>
                            </div>
                          </div>

                          <div className="flex gap-3 pt-4">
                            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => router.back()}>
                              Cancel
                            </Button>
                            <Button className="flex-1 rounded-xl" onClick={handleGroupSubmit} disabled={!groupTitle || !groupAmount || selectedMembers.length === 0}>
                              Add Group Expense
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}