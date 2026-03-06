"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, MessageSquare, Headphones, Layers } from "lucide-react";

export default function Home() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex flex-col font-sans selection:bg-zinc-200 dark:selection:bg-zinc-800">
      <header className="flex items-center justify-between p-6 w-full max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-8 h-8 text-zinc-900 dark:text-zinc-50" />
          <span className="text-xl font-bold tracking-tight">DocuMind</span>
        </div>
        <ModeToggle />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-6xl mx-auto text-center">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-3xl space-y-8"
        >
          <motion.div variants={item} className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-tight">
              Your documents, <br className="hidden md:block" />
              <span className="text-zinc-500 dark:text-zinc-400">now with a brain.</span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
              Upload your sources and instantly get an AI expert that can answer questions, summarize content, and generate insights based exactly on your documents.
            </p>
          </motion.div>

          <motion.div variants={item}>
            <Link href="/dashboard" passHref>
              <Button size="lg" className="rounded-full px-8 py-6 text-lg font-medium shadow-xl hover:scale-105 transition-transform">
                Get Started
                <BrainCircuit className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>

          <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 text-left">
            <Card className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border-zinc-200 dark:border-zinc-800 shadow-sm rounded-2xl">
              <CardHeader>
                <MessageSquare className="w-8 h-8 mb-4 text-zinc-700 dark:text-zinc-300" />
                <CardTitle>Source-Grounded Chat</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-zinc-600 dark:text-zinc-400">
                  Ask questions and get answers with exact citations to your source material. Never lose track of where a fact came from.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border-zinc-200 dark:border-zinc-800 shadow-sm rounded-2xl">
              <CardHeader>
                <Headphones className="w-8 h-8 mb-4 text-zinc-700 dark:text-zinc-300" />
                <CardTitle>Audio Overviews</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-zinc-600 dark:text-zinc-400">
                  Turn your documents into an engaging AI-generated podcast discussion to learn on the go.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border-zinc-200 dark:border-zinc-800 shadow-sm rounded-2xl">
              <CardHeader>
                <Layers className="w-8 h-8 mb-4 text-zinc-700 dark:text-zinc-300" />
                <CardTitle>Interactive Studio</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-zinc-600 dark:text-zinc-400">
                  Access a suite of smart tools to generate summaries, study guides, FAQs, and structured tables from your content.
                </CardDescription>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
