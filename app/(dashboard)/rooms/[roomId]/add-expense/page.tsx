'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Upload, Camera, Users, Calculator, Calendar as CalendarIcon } from 'lucide-react';
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
import { useRouter } from 'next/navigation';
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

const roomMembers = [
  { id: '1', name: 'You', avatar: '', email: 'john@example.com' },
  { id: '2', name: 'Sarah', avatar: '', email: 'sarah@example.com' },
  { id: '3', name: 'Dad', avatar: '', email: 'dad@example.com' },
  { id: '4', name: 'Mom', avatar: '', email: 'mom@example.com' },
];

export default function AddExpensePage({ params }: { params: { roomId: string } }) {
  const router = useRouter();
  const [date, setDate] = useState<Date>(new Date());
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');
  const [selectedMembers, setSelectedMembers] = useState<string[]>(['1']);
  const [customSplits, setCustomSplits] = useState<Record<string, number>>({});
  const [receipt, setReceipt] = useState<File | null>(null);

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

  const totalAmount = parseFloat(amount) || 0;
  const equalSplit = totalAmount / selectedMembers.length;
  const customTotal = Object.values(customSplits).reduce((sum, val) => sum + val, 0);

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
          <h1 className="text-2xl font-bold">Add Expense</h1>
          <p className="text-muted-foreground">Record a new expense for the room</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Details */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Expense Details</CardTitle>
              <CardDescription>Enter the basic information about the expense</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Expense Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Dinner at Pizza Palace"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="rounded-xl text-2xl font-bold"
                />
              </div>

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

              <div className="space-y-2">
                <Label htmlFor="note">Note (Optional)</Label>
                <Textarea
                  id="note"
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
                <div className="border-2 border-dashed border-border rounded-2xl p-6 text-center">
                  <div className="space-y-2">
                    <div className="flex justify-center gap-2">
                      <Button variant="outline" size="sm" className="rounded-xl">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-xl">
                        <Camera className="h-4 w-4 mr-2" />
                        Camera
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Upload receipt image or take a photo
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Split Details */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
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
                  {roomMembers.map((member) => {
                    const isSelected = selectedMembers.includes(member.id);
                    const memberSplit = splitType === 'equal' 
                      ? equalSplit 
                      : customSplits[member.id] || 0;

                    return (
                      <div
                        key={member.id}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                          isSelected 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => handleMemberToggle(member.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={member.avatar} />
                              <AvatarFallback>{member.name[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{member.name}</p>
                              <p className="text-sm text-muted-foreground">{member.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            {isSelected && (
                              <Badge variant="secondary">
                                ₹{memberSplit.toFixed(2)}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Custom Split Slider */}
                        {isSelected && splitType === 'custom' && (
                          <div className="mt-4 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Amount</span>
                              <span>₹{(customSplits[member.id] || 0).toFixed(2)}</span>
                            </div>
                            <Slider
                              value={[customSplits[member.id] || 0]}
                              onValueChange={(value) => handleCustomSplitChange(member.id, value)}
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

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 rounded-xl"
                  disabled={!title || !amount || selectedMembers.length === 0}
                >
                  Add Expense
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}