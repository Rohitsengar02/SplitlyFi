'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, DollarSign, MoveHorizontal as MoreHorizontal, QrCode } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const rooms = [
  {
    id: 1,
    name: 'Family Expenses',
    description: 'Household and family related expenses',
    members: 4,
    totalExpenses: 25400,
    yourBalance: -850,
    avatar: '👨‍👩‍👧‍👦',
    code: 'FAM123',
  },
  {
    id: 2,
    name: 'Friends Trip',
    description: 'Weekend getaway to Goa',
    members: 6,
    totalExpenses: 18750,
    yourBalance: 420,
    avatar: '🏖️',
    code: 'TRIP456',
  },
  {
    id: 3,
    name: 'Work Lunch',
    description: 'Office team lunch expenses',
    members: 8,
    totalExpenses: 3200,
    yourBalance: -125,
    avatar: '🍽️',
    code: 'WORK789',
  },
];

export default function RoomsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
          <Button variant="outline" className="rounded-2xl">
            <QrCode className="h-4 w-4 mr-2" />
            Join Room
          </Button>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-2xl">
                <Plus className="h-4 w-4 mr-2" />
                Create Room
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Room</DialogTitle>
                <DialogDescription>
                  Set up a new expense room to start collaborating with others.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="roomName">Room Name</Label>
                  <Input
                    id="roomName"
                    placeholder="e.g., Family Expenses"
                    className="rounded-xl mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="roomDescription">Description (Optional)</Label>
                  <Input
                    id="roomDescription"
                    placeholder="Brief description of the room"
                    className="rounded-xl mt-1"
                  />
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
                    Create Room
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
            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{room.avatar}</div>
                    <div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {room.name}
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
                    {room.members} members
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {room.code}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Expenses</span>
                    <span className="font-semibold">₹{room.totalExpenses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Your Balance</span>
                    <span className={`font-semibold ${
                      room.yourBalance < 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {room.yourBalance < 0 ? '-' : '+'}₹{Math.abs(room.yourBalance)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1 rounded-xl">
                    View Details
                  </Button>
                  <Button size="sm" className="flex-1 rounded-xl">
                    Add Expense
                  </Button>
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