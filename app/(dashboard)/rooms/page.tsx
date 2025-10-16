'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, DollarSign, MoveHorizontal as MoreHorizontal, QrCode, Copy, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { db } from '@/lib/firebase';
import { collection, collectionGroup, doc, onSnapshot, query, where, or, serverTimestamp, setDoc, getDoc, getDocs, updateDoc, increment } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
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

export default function RoomsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [hasLimit, setHasLimit] = useState(true);
  const [limit, setLimit] = useState<number | ''>(10);
  const [currency] = useState('INR');
  const [category, setCategory] = useState('General');
  const [customCategory, setCustomCategory] = useState('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Listener for rooms created by the user
    const createdByQuery = query(collection(db, 'rooms'), where('createdBy', '==', user.uid));
    const unsubscribeCreated = onSnapshot(createdByQuery, (snapshot) => {
      const createdRooms: Room[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Room));
      setRooms((prev) => {
        const prevById = new Map(prev.map(r => [r.id, r]));
        createdRooms.forEach(r => prevById.set(r.id, r));
        return Array.from(prevById.values());
      });
      setLoading(false);
    }, (error) => {
      console.error('Error fetching created rooms:', error);
      setLoading(false);
    });

    // Listener for membership via subcollection rooms/{roomId}/members where uid == current user
    const membersQ = query(collectionGroup(db, 'members'), where('uid', '==', user.uid));
    const unsubscribeMembers = onSnapshot(membersQ, async (snapshot) => {
      try {
        const roomIds = Array.from(new Set(snapshot.docs.map(d => d.ref.parent.parent?.id).filter(Boolean))) as string[];
        // Fetch each room document
        const roomDocs = await Promise.all(roomIds.map(async (rid) => {
          const rref = doc(db, 'rooms', rid);
          const rsnap = await getDoc(rref);
          return rsnap.exists() ? ({ id: rsnap.id, ...rsnap.data() } as Room) : null;
        }));
        const memberRooms = roomDocs.filter(Boolean) as Room[];
        setRooms((prev) => {
          const byId = new Map(prev.map(r => [r.id, r]));
          memberRooms.forEach(r => byId.set(r.id, r));
          return Array.from(byId.values());
        });
        setLoading(false);
      } catch (err) {
        console.error('Error fetching member rooms:', err);
        setLoading(false);
      }
    }, (error) => {
      console.error('Error listening to memberships:', error);
      setLoading(false);
    });

    return () => {
      unsubscribeCreated();
      unsubscribeMembers();
    };
  }, [user]);

  const handleViewDetails = (roomId: string) => {
    router.push(`/rooms/${roomId}`);
  };

  const handleImagePick = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dfaeksnq0';
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'dropshipping';
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', 'splitlyfi/rooms');
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || 'Upload failed');
      setImageUrl(data.secure_url as string);
    } catch (e) {
      console.error('Room image upload failed:', e);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCreateRoom = async () => {
    if (!user) return;
    if (!title.trim()) return;
    try {
      setSaving(true);
      const roomsCol = collection(db, 'rooms');
      const roomRef = doc(roomsCol);
      const joinCode = roomRef.id;
      const selectedCategory = customCategory.trim() ? customCategory.trim() : category;
      const selectedUserLimit = hasLimit ? Math.max(1, Number(limit || 1)) : null;

      await setDoc(roomRef, {
        id: roomRef.id,
        title: title.trim(),
        description: description.trim(),
        imageUrl: imageUrl,
        hasLimit,
        userLimit: selectedUserLimit,
        currency,
        category: selectedCategory,
        joinCode,
        membersCount: 1,
        totalExpenses: 0,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Create member document for the creator
      const memberRef = doc(db, 'rooms', roomRef.id, 'members', user.uid);
      await setDoc(memberRef, {
        uid: user.uid,
        joinedAt: serverTimestamp(),
      });

      setTitle('');
      setDescription('');
      setImageUrl('');
      setHasLimit(true);
      setLimit(10);
      setCategory('General');
      setCustomCategory('');
      setIsCreateModalOpen(false);
    } catch (e) {
      console.error('Create room failed:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!user || !inviteCode.trim()) return;

    try {
      setJoining(true);

      // Fetch the room directly by ID (invite code equals document ID)
      const joinRoomId = inviteCode.trim();
      const roomRef = doc(db, 'rooms', joinRoomId);
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        alert('Invalid invite code. Please check and try again.');
        return;
      }

      const roomData = roomSnap.data() as Room;

      // Check if user is already a member
      const memberRef = doc(db, 'rooms', joinRoomId, 'members', user.uid);
      const memberSnap = await getDoc(memberRef);
      if (memberSnap.exists()) {
        alert('You are already a member of this room.');
        setInviteCode('');
        setIsJoinModalOpen(false);
        router.push(`/rooms/${joinRoomId}`);
        return;
      }

      // Check if room has a member limit
      if (roomData.hasLimit && roomData.membersCount >= (roomData.userLimit || 0)) {
        alert('This room is full and cannot accept new members.');
        return;
      }

      // Create member document for the joining user
      await setDoc(memberRef, {
        uid: user.uid,
        joinedAt: serverTimestamp(),
      });

      // Update room's member count
      await updateDoc(roomRef, {
        membersCount: roomData.membersCount + 1,
        updatedAt: serverTimestamp(),
      });

      // Reset form and close modal
      setInviteCode('');
      setIsJoinModalOpen(false);

      // Redirect to room page
      router.push(`/rooms/${joinRoomId}`);
    } catch (error) {
      console.error('Error joining room:', error);
      const firebaseError = error as { code?: string };
      if (firebaseError.code === 'permission-denied') {
        alert('You do not have permission to join this room. Please check the invite code or contact the room creator.');
      } else {
        alert('Failed to join room. Please try again.');
      }
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading rooms...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold">My Rooms</h1>
          <p className="text-muted-foreground">Manage your expense groups and collaborations</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-2xl" onClick={() => setIsJoinModalOpen(true)}>
            <QrCode className="h-4 w-4 mr-2" />
            Join Room
          </Button>
          <Dialog open={isJoinModalOpen} onOpenChange={setIsJoinModalOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Join Room</DialogTitle>
                <DialogDescription>
                  Enter the invite code to join an existing room.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="inviteCode">Invite Code</Label>
                  <Input
                    id="inviteCode"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Enter room invite code"
                    className="rounded-xl mt-1"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsJoinModalOpen(false);
                      setInviteCode('');
                    }}
                    className="flex-1 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={joining || !inviteCode.trim()}
                    onClick={handleJoinRoom}
                    className="flex-1 rounded-xl"
                  >
                    {joining ? 'Joining...' : 'Join Room'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-2xl">
                <Plus className="h-4 w-4 mr-2" />
                Create Room
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Room</DialogTitle>
                <DialogDescription>
                  Set up a new expense room to start collaborating with others.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pr-1 md:pr-2">
                <div>
                  <Label htmlFor="roomTitle">Room Title</Label>
                  <Input
                    id="roomTitle"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Family Expenses"
                    className="rounded-xl mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="roomDescription">Description (Optional)</Label>
                  <Textarea
                    id="roomDescription"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of the room"
                    className="rounded-xl mt-1"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Room Image</Label>
                    <div className="flex gap-2 items-center mt-1">
                      <Input type="file" ref={fileInputRef} accept="image/*" onChange={(e) => handleImagePick(e.target.files?.[0] || undefined)} />
                      <Button type="button" variant="outline" disabled={uploading} onClick={() => fileInputRef.current?.click()} className="rounded-xl">
                        {uploading ? 'Uploading...' : 'Upload'}
                      </Button>
                    </div>
                    {imageUrl && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">Uploaded</p>
                    )}
                  </div>
                  <div>
                    <Label>Users Limit</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="number"
                        min={1}
                        value={hasLimit ? (limit as number) : ''}
                        onChange={(e) => setLimit(e.target.value === '' ? '' : Number(e.target.value))}
                        className="rounded-xl"
                        disabled={!hasLimit}
                      />
                      <div className="flex items-center gap-2 text-sm">
                        <input id="noLimit" type="checkbox" checked={!hasLimit} onChange={(e) => setHasLimit(!e.target.checked)} />
                        <Label htmlFor="noLimit">No limit</Label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Currency</Label>
                    <Input value={currency} disabled className="rounded-xl mt-1" />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <select
                      className="rounded-xl mt-1 w-full border border-input bg-background px-3 py-2"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="General">General</option>
                      <option value="Family">Family</option>
                      <option value="Friends">Friends</option>
                      <option value="Travel">Travel</option>
                      <option value="Work">Work</option>
                      <option value="Custom">Custom...</option>
                    </select>
                    {category === 'Custom' && (
                      <Input
                        className="rounded-xl mt-2"
                        placeholder="Enter custom category"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                      />
                    )}
                  </div>
                </div>
                {/* Members are added by joining via code; no manual input here */}
                <div className="text-xs text-muted-foreground">
                  Join Code will be generated automatically.
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
                    disabled={saving || !title.trim()}
                    onClick={handleCreateRoom}
                    className="flex-1 rounded-xl"
                  >
                    {saving ? 'Creating...' : 'Create Room'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room, index) => (
          <motion.div
            key={room.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="group hover:shadow-2xl transition-all duration-500 cursor-pointer border-0 bg-gradient-to-br from-white via-gray-50/50 to-gray-100/50 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 overflow-hidden relative">
              {/* Image Banner */}
              <div className="relative h-32 bg-gradient-to-r from-primary/20 to-primary/10 overflow-hidden">
                {room.imageUrl ? (
                  <img
                    src={room.imageUrl}
                    alt={room.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
                    <div className="text-4xl font-bold text-primary/30">
                      {room.title[0]?.toUpperCase() || 'R'}
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <div className="absolute top-3 right-3">
                  <Badge variant="secondary" className="text-xs font-mono bg-white/90 backdrop-blur-sm">
                    {room.joinCode}
                  </Badge>
                </div>
              </div>

              <CardHeader className="pb-4 relative -mt-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                   
                    <div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {room.title}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {room.description}
                      </CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Share Invite</DropdownMenuItem>
                      <DropdownMenuItem>Room Settings</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {room.membersCount} members
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {room.category}
                  </Badge>
                </div>

                <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Expenses</span>
                    <span className="font-semibold">₹{room.totalExpenses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Your Balance</span>
                    <span className="font-semibold text-green-600">
                      ₹0 {/* Placeholder - calculate actual balance */}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1 rounded-xl" onClick={() => handleViewDetails(room.id)}>
                    View Details
                  </Button>
                  <Button size="sm" className="flex-1 rounded-xl">
                    Add Expense
                  </Button>
                </div>

                {/* Join Code Section */}
                <div className="pt-3 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Join Code:</span>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                        {room.joinCode}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(room.joinCode)}
                        className="h-6 w-6 p-0"
                      >
                        {copiedCode === room.joinCode ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {/* Create Room Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: rooms.length * 0.1 }}
        >
          <Card className="border-dashed border-2 hover:border-primary transition-colors cursor-pointer h-full min-h-[280px] flex items-center justify-center">
            <div className="text-center p-6">
              <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Create New Room</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start a new expense group with friends or family
              </p>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="rounded-xl"
              >
                Get Started
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}