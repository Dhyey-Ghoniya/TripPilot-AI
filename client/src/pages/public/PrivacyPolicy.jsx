import React from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/ui/Badge';
import { Shield, Lock, Eye, Database, FileText, Mail } from 'lucide-react';

const PrivacyPolicy = () => {
  const lastUpdated = 'October 25, 2026';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <Badge variant="primary" size="sm">Legal</Badge>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Last updated: {lastUpdated}
        </p>
      </div>

      <Card className="p-6 sm:p-8 space-y-8 text-sm text-slate-700 dark:text-slate-300 leading-relaxed border border-slate-200 dark:border-slate-800">
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <Shield className="w-5 h-5 text-secondary-600" />
            <h2>1. Introduction</h2>
          </div>
          <p>
            TripPilot ("we", "our", or "us") operates the TripPilot travel planning and itinerary management platform. This Privacy Policy outlines our standards and procedures regarding the collection, use, and disclosure of personal data when you use our services, as well as your privacy rights under applicable data protection laws.
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <Database className="w-5 h-5 text-secondary-600" />
            <h2>2. Information We Collect</h2>
          </div>
          <p>We collect information that you provide directly to us when interacting with the platform:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
            <li><strong>Account Data:</strong> Name, email address, password hash, and optional profile avatar.</li>
            <li><strong>Travel Planning Inputs:</strong> Origin city, destination preferences, travel dates, passenger counts, budget allocations, and travel style filters.</li>
            <li><strong>Saved Blueprints:</strong> Custom day-by-day itineraries, attraction bookmarks, notes, and activity checklists.</li>
            <li><strong>Technical Telemetry:</strong> IP address, browser type, operating system, and session timestamps used solely for platform reliability and security monitoring.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <Eye className="w-5 h-5 text-secondary-600" />
            <h2>3. How We Use Your Information</h2>
          </div>
          <p>Your data is processed strictly for functional travel logistics, including:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
            <li>Synthesizing personalized travel schedules and route sequences.</li>
            <li>Querying real-time flight schedules and accommodation inventory from third-party travel aggregators.</li>
            <li>Maintaining account security, authentication sessions, and password recovery.</li>
            <li>Preventing automated abuse and securing application endpoints.</li>
          </ul>
          <p className="pt-2 text-xs text-slate-500 dark:text-slate-400">
            We do not sell, rent, or trade your personal information to third-party data brokers or advertisers.
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <Lock className="w-5 h-5 text-secondary-600" />
            <h2>4. Data Storage and Security</h2>
          </div>
          <p>
            All network communication is encrypted in transit using industry-standard Transport Layer Security (TLS 1.3). Account credentials and sensitive authentication tokens are hashed using bcrypt before database persistence. Access to production databases is restricted to authorized administrative personnel through encrypted key-pair authentication.
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <FileText className="w-5 h-5 text-secondary-600" />
            <h2>5. Third-Party Integrations and Handoffs</h2>
          </div>
          <p>
            When you select external booking options (such as flights or hotels), you may be redirected to third-party travel providers (e.g., airline ticketing systems or hotel inventory partners). Any transactions conducted on third-party sites are governed exclusively by their respective privacy policies and terms of service.
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <Mail className="w-5 h-5 text-secondary-600" />
            <h2>6. Your Rights and Contact Information</h2>
          </div>
          <p>
            You have the right to request access to, rectification of, or permanent deletion of your account data at any time through your Profile Settings or by contacting our administration team at:
          </p>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-700 dark:text-slate-300">
            TripPilot Privacy Office<br />
            Email: privacy@trippilot.ai<br />
            Address: CSE Dept, Technology Campus
          </div>
        </section>
      </Card>
    </div>
  );
};

export default PrivacyPolicy;
