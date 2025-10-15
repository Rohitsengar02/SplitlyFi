'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { ArrowRight, DollarSign, Users, Target, TrendingUp, Shield, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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