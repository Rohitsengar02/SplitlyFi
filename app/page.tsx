'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { ArrowRight, DollarSign, Users, Target, TrendingUp, Shield, Smartphone, CheckCircle, Zap, BarChart3, Bell, Lock, Globe } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function LandingPage() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, -50]);
  const y2 = useTransform(scrollY, [0, 300], [0, -100]);
  
  const [heroRef, heroInView] = useInView({ threshold: 0.3, triggerOnce: true });
  const [featuresRef, featuresInView] = useInView({ threshold: 0.1, triggerOnce: true });

  const features = [
    {
      icon: Users,
      title: 'Collaborative Rooms',
      description: 'Create rooms with friends and family to track shared expenses effortlessly',
    },
    {
      icon: DollarSign,
      title: 'Smart Expense Splitting',
      description: 'Automatically calculate who owes what with intelligent splitting algorithms',
    },
    {
      icon: Target,
      title: 'Financial Goals',
      description: 'Set and achieve savings goals together with visual progress tracking',
    },
    {
      icon: TrendingUp,
      title: 'Insightful Analytics',
      description: 'Understand spending patterns with beautiful charts and insights',
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your financial data is encrypted and protected with bank-level security',
    },
    {
      icon: Smartphone,
      title: 'Mobile First',
      description: 'Designed for mobile with offline support and real-time synchronization',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <motion.div
                whileHover={{ rotate: 180 }}
                className="h-8 w-8 rounded-2xl bg-primary flex items-center justify-center"
              >
                <DollarSign className="h-4 w-4 text-primary-foreground" />
              </motion.div>
              <span className="font-bold text-xl">SplitlyFi</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/auth/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/auth/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section ref={heroRef} className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 50 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="text-4xl sm:text-6xl lg:text-7xl font-bold text-balance mb-6"
            >
              Split expenses,{' '}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                achieve goals
              </span>
              <br />
              together
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
            >
              The collaborative expense management platform that helps friends, families, and roommates 
              track spending and achieve financial goals together.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link href="/auth/signup">
                <Button size="lg" className="text-lg px-8 py-6 rounded-2xl group">
                  Start for Free
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 rounded-2xl">
                Watch Demo
              </Button>
            </motion.div>
          </div>

          {/* Floating Elements */}
          <div className="relative mt-20">
            <motion.div
              style={{ y: y1 }}
              className="absolute -top-10 left-1/4 w-20 h-20 bg-primary/10 rounded-3xl animate-float"
            />
            <motion.div
              style={{ y: y2 }}
              className="absolute top-10 right-1/4 w-16 h-16 bg-primary/20 rounded-2xl animate-float-delayed"
            />
            
            {/* Hero Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotateX: 20 }}
              animate={heroInView ? { opacity: 1, scale: 1, rotateX: 0 } : {}}
              transition={{ duration: 1, delay: 0.6 }}
              className="relative"
            >
              <div className="glass-card rounded-3xl p-8 max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-2">Total Expenses</h3>
                      <p className="text-3xl font-bold">₹12,450</p>
                      <p className="text-sm opacity-80">This month</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-2">Active Rooms</h3>
                      <p className="text-3xl font-bold">3</p>
                      <p className="text-sm text-muted-foreground">Family, Friends, Work</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-2">Goals Progress</h3>
                      <p className="text-3xl font-bold">78%</p>
                      <p className="text-sm text-muted-foreground">Vacation fund</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-5xl font-bold mb-6">
              Everything you need to manage{' '}
              <span className="text-primary">finances together</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to make collaborative expense management simple and enjoyable
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 50 }}
                animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-8">
                    <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 rounded-full px-4 py-1">Simple Process</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get started in minutes with our simple 3-step process
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Create a Room',
                description: 'Set up a new expense room and invite your friends or family members',
                icon: Users,
                color: 'from-purple-500 to-pink-500',
              },
              {
                step: '02',
                title: 'Add Expenses',
                description: 'Log expenses as they happen and split them automatically',
                icon: DollarSign,
                color: 'from-blue-500 to-cyan-500',
              },
              {
                step: '03',
                title: 'Settle Up',
                description: 'See who owes what and settle balances with one tap',
                icon: CheckCircle,
                color: 'from-green-500 to-emerald-500',
              },
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <Card className="relative overflow-hidden h-full hover:shadow-xl transition-all duration-300 group">
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${step.color}`} />
                  <CardContent className="p-8">
                    <div className="flex items-start gap-4 mb-6">
                      <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                        <step.icon className="h-8 w-8 text-white" />
                      </div>
                      <div className="text-6xl font-bold text-muted-foreground/20">{step.step}</div>
                    </div>
                    <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { value: '50K+', label: 'Active Users', icon: Users },
              { value: '₹10M+', label: 'Expenses Tracked', icon: TrendingUp },
              { value: '100K+', label: 'Rooms Created', icon: Target },
              { value: '99.9%', label: 'Uptime', icon: Zap },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-8">
                    <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                      <stat.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                    <p className="text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 rounded-full px-4 py-1">Testimonials</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">What Our Users Say</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join thousands of satisfied users managing their finances better
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Priya Sharma',
                role: 'College Student',
                content: 'SplitlyFi made managing hostel expenses with my roommates so easy! No more awkward conversations about who owes what.',
                avatar: '👩‍🎓',
              },
              {
                name: 'Rahul Verma',
                role: 'Travel Enthusiast',
                content: 'Perfect for group trips! We used it during our Goa trip and settling up was a breeze. Highly recommended!',
                avatar: '🧳',
              },
              {
                name: 'Anjali Patel',
                role: 'Working Professional',
                content: 'The goal tracking feature helped me save for my dream vacation. The insights are incredibly helpful!',
                avatar: '💼',
              },
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-xl transition-shadow">
                  <CardContent className="p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="text-4xl">{testimonial.avatar}</div>
                      <div>
                        <h4 className="font-semibold">{testimonial.name}</h4>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                    <p className="text-muted-foreground italic leading-relaxed">
                      "{testimonial.content}"
                    </p>
                    <div className="flex gap-1 mt-4">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="text-yellow-500">★</span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 rounded-full px-4 py-1 bg-green-500/10 text-green-700 dark:text-green-400">
              100% Free
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              All features, forever free. No hidden charges, no premium tiers.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <Card className="relative overflow-hidden border-2 border-primary">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 text-sm font-semibold rounded-bl-lg">
                Popular
              </div>
              <CardContent className="p-12">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-4">Free Forever</h3>
                  <div className="mb-6">
                    <span className="text-6xl font-bold">₹0</span>
                    <span className="text-muted-foreground ml-2">/ forever</span>
                  </div>
                  <p className="text-muted-foreground">Everything you need, completely free</p>
                </div>

                <div className="space-y-4 mb-8">
                  {[
                    'Unlimited rooms and members',
                    'Unlimited expense tracking',
                    'Smart expense splitting',
                    'Goal tracking & analytics',
                    'Real-time synchronization',
                    'Mobile & desktop apps',
                    'Bank-level security',
                    'Priority support',
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <Link href="/auth/signup" className="block">
                  <Button size="lg" className="w-full rounded-2xl text-lg py-6">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 rounded-full px-4 py-1">FAQ</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to know about SplitlyFi
            </p>
          </motion.div>

          <div className="space-y-4">
            {[
              {
                question: 'Is SplitlyFi really free?',
                answer: 'Yes! SplitlyFi is 100% free with no hidden charges. All features are available to everyone, forever.',
              },
              {
                question: 'How secure is my financial data?',
                answer: 'We use bank-level encryption and security measures to protect your data. Your information is encrypted both in transit and at rest.',
              },
              {
                question: 'Can I use SplitlyFi offline?',
                answer: 'Yes! Our mobile app works offline and automatically syncs when you\'re back online.',
              },
              {
                question: 'How many people can join a room?',
                answer: 'There\'s no limit! You can add as many members as you need to any room.',
              },
              {
                question: 'Can I track multiple currencies?',
                answer: 'Yes, each room can have its own currency, and we support all major currencies.',
              },
              {
                question: 'How do I settle up with someone?',
                answer: 'SplitlyFi automatically calculates who owes what. You can then settle up using any payment method and mark it as paid in the app.',
              },
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-2">{faq.question}</h3>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
              <CardContent className="p-12">
                <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                  Ready to start your financial journey?
                </h2>
                <p className="text-xl mb-8 opacity-90">
                  Join thousands of users who are already managing their expenses smarter, together.
                </p>
                <Link href="/auth/signup">
                  <Button size="lg" variant="secondary" className="text-lg px-8 py-6 rounded-2xl">
                    Create Free Account
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-2xl bg-primary flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">SplitlyFi</span>
            </div>
            <p className="text-muted-foreground text-center md:text-right">
              © 2025 SplitlyFi. Free for everyone, forever.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}