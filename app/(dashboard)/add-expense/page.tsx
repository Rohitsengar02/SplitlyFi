'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Upload, Camera, Calendar as CalendarIcon, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';

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

const userRooms = [
  { id: '1', name: 'Family Expenses', avatar: '👨‍👩‍👧‍👦' },
  { id: '2', name: 'Friends Trip', avatar: '🏖️' },
  { id: '3', name: 'Work Lunch', avatar: '🍽️' },
];

export default function AddExpensePage() {
  const [activeTab, setActiveTab] = useState('personal');
  const [date, setDate] = useState<Date>(new Date());
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold mb-2">Add New Expense</h1>
        <p className="text-muted-foreground">Record your personal or group expenses</p>
      </motion.div>

      {/* Expense Type Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="personal-amount">Amount (₹)</Label>
                    <Input
                      id="personal-amount"
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="rounded-xl text-2xl font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={category} onValueChange={setCategory}>
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
                            {date ? format(date, 'PPP') : 'Pick a date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={date}
                            onSelect={(date) => date && setDate(date)}
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
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="rounded-xl"
                      rows={3}
                    />
                  </div>

                  {/* Receipt Upload */}
                  <div className="space-y-2">
                    <Label>Receipt (Optional)</Label>
                    <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center">
                      <div className="space-y-4">
                        <div className="h-12 w-12 bg-muted rounded-2xl flex items-center justify-center mx-auto">
                          <Upload className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium mb-2">Upload Receipt</p>
                          <p className="text-sm text-muted-foreground mb-4">
                            Drag and drop or click to upload
                          </p>
                          <div className="flex justify-center gap-2">
                            <Button variant="outline" size="sm" className="rounded-xl">
                              <Upload className="h-4 w-4 mr-2" />
                              Browse Files
                            </Button>
                            <Button variant="outline" size="sm" className="rounded-xl">
                              <Camera className="h-4 w-4 mr-2" />
                              Take Photo
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" className="flex-1 rounded-xl">
                      Save as Draft
                    </Button>
                    <Button className="flex-1 rounded-xl">
                      Add Expense
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
              className="max-w-2xl mx-auto"
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
                        {userRooms.map((room) => (
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

                  {selectedRoom && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="group-title">Expense Title</Label>
                        <Input
                          id="group-title"
                          placeholder="e.g., Dinner at Pizza Palace"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="rounded-xl"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="group-amount">Amount (₹)</Label>
                        <Input
                          id="group-amount"
                          type="number"
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="rounded-xl text-2xl font-bold"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Select value={category} onValueChange={setCategory}>
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
                                {date ? format(date, 'PPP') : 'Pick a date'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={date}
                                onSelect={(date) => date && setDate(date)}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      <div className="bg-primary/5 rounded-2xl p-4">
                        <p className="text-sm font-medium text-primary mb-2">
                          💡 Quick Add
                        </p>
                        <p className="text-sm text-muted-foreground">
                          This will add the expense to the selected room. You can customize the split details on the next page.
                        </p>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button variant="outline" className="flex-1 rounded-xl">
                          Cancel
                        </Button>
                        <Button className="flex-1 rounded-xl">
                          Continue to Split
                        </Button>
                      </div>
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