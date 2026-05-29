import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Scale, Shield, Users, FileSearch, ArrowRight } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    icon: Users,
    title: 'Expert Lawyers',
    description: 'Discover verified lawyers and book consultations that fit your schedule.',
  },
  {
    icon: Shield,
    title: 'Secure Consultations',
    description: 'Private video sessions with end-to-end security for confidential legal advice.',
  },
  {
    icon: FileSearch,
    title: 'AI Document Analysis',
    description: 'Upload legal documents and get AI-powered insights powered by RAG technology.',
  },
];

const steps = [
  { step: '01', title: 'Create Account', desc: 'Sign up as a client or lawyer and complete your profile.' },
  { step: '02', title: 'Book a Lawyer', desc: 'Browse specialists, compare expertise, and schedule appointments.' },
  { step: '03', title: 'Consult Securely', desc: 'Join encrypted video calls and receive professional legal guidance.' },
];

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-[#1e3a5f] via-[#2d4a6f] to-[#1a3352] px-4 py-20 text-white sm:py-28">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-[var(--color-accent)] blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-blue-400 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm">
              <Scale className="h-4 w-4 text-[var(--color-accent)]" />
              AI-Powered Legal Platform
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Legal consultation,{' '}
              <span className="text-[var(--color-accent)]">reimagined</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/80">
              Connect with verified lawyers, book secure video consultations, and analyze legal
              documents with AI — all in one modern platform.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link to="/signup">
                <Button variant="accent" size="lg">
                  Get Started Free
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/30 bg-transparent text-white hover:bg-white/10"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="features" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-[var(--color-primary)]">Why LawMittr?</h2>
            <p className="mt-3 text-[var(--color-muted-foreground)]">
              Everything you need for modern legal services
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader>
                    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--color-primary)]/10">
                      <feature.icon className="h-6 w-6 text-[var(--color-primary)]" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-[var(--color-muted)] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-[var(--color-primary)]">How It Works</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <span className="text-5xl font-bold text-[var(--color-accent)]/40">{item.step}</span>
                <h3 className="mt-4 text-xl font-semibold">{item.title}</h3>
                <p className="mt-2 text-[var(--color-muted-foreground)]">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <Card className="border-[var(--color-primary)]/20 bg-gradient-to-br from-[var(--color-primary)] to-[#2d4a6f] p-8 text-white sm:p-12">
            <CardContent className="p-0">
              <h2 className="text-2xl font-bold sm:text-3xl">Ready to get legal help?</h2>
              <p className="mt-3 text-white/80">
                Join thousands of clients and lawyers on LawMittr today.
              </p>
              <Link to="/signup/role" className="mt-8 inline-block">
                <Button variant="accent" size="lg">Create Your Account</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="border-t border-[var(--color-border)] py-8 text-center text-sm text-[var(--color-muted-foreground)]">
        © {new Date().getFullYear()} LawMittr. All rights reserved.
      </footer>
    </div>
  );
}
