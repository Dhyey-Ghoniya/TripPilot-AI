import React from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/ui/Badge';
import { BookOpen, AlertCircle, CheckCircle, Scale, RefreshCw } from 'lucide-react';

const TermsAndConditions = () => {
  const lastUpdated = 'October 25, 2026';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <Badge variant="primary" size="sm">Legal</Badge>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Terms and Conditions
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Last updated: {lastUpdated}
        </p>
      </div>

      <Card className="p-6 sm:p-8 space-y-8 text-sm text-slate-700 dark:text-slate-300 leading-relaxed border border-slate-200 dark:border-slate-800">
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <BookOpen className="w-5 h-5 text-secondary-600" />
            <h2>1. Agreement to Terms</h2>
          </div>
          <p>
            By accessing or using TripPilot ("the Platform"), you agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree to all terms, you must not access or use the services.
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <CheckCircle className="w-5 h-5 text-secondary-600" />
            <h2>2. User Accounts and Responsibilities</h2>
          </div>
          <p>
            When registering an account, you agree to provide accurate, current, and complete information. You are solely responsible for maintaining the confidentiality of your credentials and for all activities occurring under your account. You must notify us immediately of any unauthorized access.
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <AlertCircle className="w-5 h-5 text-secondary-600" />
            <h2>3. Informational Nature of Generated Itineraries</h2>
          </div>
          <p>
            TripPilot provides travel research, itinerary pacing suggestions, and aggregation of public travel intelligence. While our algorithms calculate practical schedules and geographic proximity:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
            <li>Attraction opening hours, entry fees, visa requirements, and transit schedules are subject to change by third parties without notice.</li>
            <li>Users are responsible for confirming operating times, official entry rules, and safety advisories before embarking on travel.</li>
            <li>TripPilot is not an airline or hotel carrier and does not directly sell flight tickets or hotel rooms. Bookings completed via external provider links are agreements made directly between the user and the external vendor.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <Scale className="w-5 h-5 text-secondary-600" />
            <h2>4. Limitation of Liability</h2>
          </div>
          <p>
            To the maximum extent permitted by law, TripPilot and its developers shall not be liable for any direct, indirect, incidental, or consequential damages resulting from travel delays, cancellations, price adjustments made by third-party carriers, or personal injuries incurred during travel activities.
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <RefreshCw className="w-5 h-5 text-secondary-600" />
            <h2>5. Service Modifications and Termination</h2>
          </div>
          <p>
            We reserve the right to modify, suspend, or discontinue any feature of the platform at our discretion. We may suspend or terminate user accounts that violate our security standards, engage in automated data scraping, or submit abusive content.
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <h2>6. Governing Law and Inquiries</h2>
          </div>
          <p>
            These terms are governed by the applicable laws of the jurisdiction in which the service operates. For inquiries regarding legal terms, contact us at legal@trippilot.ai.
          </p>
        </section>
      </Card>
    </div>
  );
};

export default TermsAndConditions;
