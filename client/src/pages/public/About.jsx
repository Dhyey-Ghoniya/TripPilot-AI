import React from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/ui/Badge';
import { Plane, Code, Cpu, Sparkles } from 'lucide-react';

const About = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-center space-y-4">
        <Badge variant="primary" size="md">Project Overview</Badge>
        <h1 className="text-3xl sm:text-5xl font-black">About TripPilot AI</h1>
        <p className="text-slate-500 dark:text-slate-400 text-base max-w-2xl mx-auto">
          AI-Powered Personalized Travel Planning and Itinerary Optimization System created as a CSE Capstone Project foundation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-8 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-secondary-100 dark:bg-slate-700 text-secondary-600 dark:text-secondary-400 flex items-center justify-center">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold">System Vision</h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            TripPilot AI addresses fragmented travel research by combining AI itinerary planning, geographic route optimization, real-time budgeting, and group collaboration into one unified travel platform.
          </p>
        </Card>

        <Card className="p-8 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-slate-700 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Code className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold">Technology Stack</h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Built with React, Vite, Tailwind CSS, React Router, Node.js, Express.js, and MongoDB Mongoose following industry-standard clean monorepo architecture.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default About;
