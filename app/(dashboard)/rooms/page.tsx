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
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1, type: "spring" }}
            whileHover={{ y: -8 }}
            className="group"
          >
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-purple-950/20 dark:via-pink-950/20 dark:to-blue-950/20 hover:shadow-2xl transition-all duration-500 h-full">
              {/* Animated Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Image Banner with Overlay */}
              <div className="relative h-40 overflow-hidden">
                {room.imageUrl ? (
                  <>
                    <img
                      src={room.imageUrl}
                      alt={room.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  </>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />
                    <div className="text-6xl font-bold text-white/90 z-10 drop-shadow-lg">
                      {room.title[0]?.toUpperCase() || 'R'}
                    </div>
                  </div>
                )}
                
                {/* Floating Badge */}
              

                {/* Category Badge */}
                <div className="absolute bottom-3 left-3 z-10">
                  <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 shadow-lg">
                    {room.category}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-6 space-y-4 relative">
                {/* Title & Description */}
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent group-hover:from-purple-700 group-hover:to-pink-700 transition-all">
                      {room.title}
                    </h3>
                   
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {room.description}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                      <Users className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="font-medium">{room.membersCount}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <div className="h-8 w-8 rounded-full bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-pink-600" />
                    </div>
                    <span className="font-medium">₹{room.totalExpenses.toLocaleString()}</span>
                  </div>
                </div>

                {/* Expense Card */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-2xl p-4 space-y-3 border border-purple-100 dark:border-purple-900/30">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Spent</span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      ₹{room.totalExpenses.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 bg-white/50 dark:bg-black/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((room.totalExpenses / 10000) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 rounded-xl border-purple-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 dark:border-purple-800 dark:hover:bg-purple-950/30 transition-all"
                    onClick={() => handleViewDetails(room.id)}
                  >
                    View Details
                  </Button>
                 
                </div>

                {/* Join Code Footer */}
                <div className="pt-4 border-t border-purple-100 dark:border-purple-900/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium">Invite Code</span>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono bg-white dark:bg-black/20 px-3 py-1.5 rounded-lg border border-purple-100 dark:border-purple-900/30 font-semibold text-purple-700 dark:text-purple-300">
                        {room.joinCode}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(room.joinCode)}
                        className="h-8 w-8 p-0 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/20"
                      >
                        {copiedCode === room.joinCode ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4 text-purple-600" />
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
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: rooms.length * 0.1, type: "spring" }}
          whileHover={{ y: -8, scale: 1.02 }}
          className="group"
        >
          <Card 
            className="relative overflow-hidden border-2 border-dashed border-purple-300 dark:border-purple-700 hover:border-purple-500 dark:hover:border-purple-500 transition-all duration-300 h-full min-h-[400px] flex items-center justify-center bg-gradient-to-br from-purple-50/50 via-pink-50/50 to-blue-50/50 dark:from-purple-950/10 dark:via-pink-950/10 dark:to-blue-950/10 cursor-pointer"
            onClick={() => setIsCreateModalOpen(true)}
          >
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzhCNUNGNiIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
            
            <div className="text-center p-8 relative z-10">
              {/* Icon with Gradient Background */}
              <motion.div 
                className="relative mx-auto mb-6"
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.5 }}
              >
                <div className="h-20 w-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-purple-500/30 group-hover:shadow-xl group-hover:shadow-purple-500/40 transition-all">
                  <Plus className="h-10 w-10 text-white" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity" />
              </motion.div>

              {/* Text Content */}
              <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Create New Room
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                Start a new expense group and invite friends or family to split costs together
              </p>

              {/* Features List */}
              <div className="space-y-2 mb-6 text-left max-w-xs mx-auto">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                  <span>Track shared expenses</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="h-1.5 w-1.5 rounded-full bg-pink-500" />
                  <span>Split bills automatically</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  <span>Invite unlimited members</span>
                </div>
              </div>

              {/* Button */}
              <Button
                className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all px-8"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Get Started
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}