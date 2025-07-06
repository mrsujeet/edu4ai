'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, MessageSquare, Shield, Sparkles } from 'lucide-react';
import ChatInterface from '@/components/chat/ChatInterface';
import Header from '@/components/layout/Header';

export default function HomePage() {
  const [showChat, setShowChat] = useState(false);

  if (showChat) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header onBackToHome={() => setShowChat(false)} />
        <main className="flex-1">
          <ChatInterface />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-teal-600/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
              <span className="text-gray-900">Learn Smarter with</span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent">
                AI-Powered Tutoring
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              Get personalized, safe, and intelligent tutoring assistance powered by advanced AI. 
              Ask questions, solve problems, and accelerate your learning journey.
            </p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowChat(true)}
              className="btn-primary text-lg px-8 py-4 mb-16 shadow-lg"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              Start Learning
            </motion.button>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <FeatureCard
                icon={<Shield className="w-8 h-8 text-blue-600" />}
                title="Safe & Secure"
                description="Built-in safety filters ensure appropriate and educational interactions"
                delay={0.2}
              />
              <FeatureCard
                icon={<Sparkles className="w-8 h-8 text-purple-600" />}
                title="AI-Powered"
                description="Advanced AI models provide intelligent, contextual responses"
                delay={0.4}
              />
              <FeatureCard
                icon={<BookOpen className="w-8 h-8 text-teal-600" />}
                title="Personalized Learning"
                description="Adaptive tutoring that adjusts to your learning style and pace"
                delay={0.6}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How Edu4.AI Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our intelligent tutoring system follows a carefully designed process to ensure 
              safe, effective, and personalized learning experiences.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            <ProcessStep
              number="1"
              title="Ask Your Question"
              description="Type your question or problem in natural language"
              delay={0.2}
            />
            <ProcessStep
              number="2"
              title="AI Validation"
              description="Our system validates and ensures the query is educational"
              delay={0.4}
            />
            <ProcessStep
              number="3"
              title="Smart Planning"
              description="AI plans the best approach to address your learning needs"
              delay={0.6}
            />
            <ProcessStep
              number="4"
              title="Personalized Response"
              description="Receive detailed, safe, and educational assistance"
              delay={0.8}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Transform Your Learning?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of students who are already learning smarter with Edu4.AI
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowChat(true)}
              className="bg-white text-blue-600 hover:bg-gray-50 font-semibold py-4 px-8 rounded-lg text-lg shadow-lg"
            >
              Get Started for Free
            </motion.button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}

function FeatureCard({ icon, title, description, delay }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay }}
      className="card p-8 text-center hover:shadow-lg transition-shadow"
    >
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </motion.div>
  );
}

interface ProcessStepProps {
  number: string;
  title: string;
  description: string;
  delay: number;
}

function ProcessStep({ number, title, description, delay }: ProcessStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay }}
      viewport={{ once: true }}
      className="text-center"
    >
      <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </motion.div>
  );
}