import React from 'react';
import Card from '../../components/common/Card';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Button from '../../components/ui/Button';
import { Mail, Send } from 'lucide-react';

const Contact = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-black">Contact TripPilot AI Team</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Have feedback or questions regarding Module 1 foundation? Drop us a message.
        </p>
      </div>

      <Card className="p-8">
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <Input label="Your Name" placeholder="John Doe" />
          <Input label="Email Address" type="email" placeholder="john@example.com" icon={Mail} />
          <Textarea label="Message" placeholder="How can we help you?" rows={5} />
          <Button variant="primary" size="md" icon={Send} className="w-full">
            Send Message
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default Contact;
