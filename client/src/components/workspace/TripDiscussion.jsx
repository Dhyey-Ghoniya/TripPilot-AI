import React, { useCallback, useEffect, useState } from 'react';
import { Bot, MessageCircle, Send, Users } from 'lucide-react';
import Card from '../common/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import tripService from '../../services/tripService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const TripDiscussion = ({ trip, onTripChanged }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [conversationResponse, collaboratorsResponse] = await Promise.all([
        tripService.getConversation(trip._id),
        tripService.getCollaborators(trip._id),
      ]);
      setMessages(conversationResponse?.data?.conversation || []);
      setMembers(collaboratorsResponse?.data?.collaborators || []);
    } catch (error) {
      addToast(error.customMessage || 'Could not load the trip discussion.', 'error');
    } finally {
      setLoading(false);
    }
  }, [trip._id, addToast]);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 15000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const send = async (event) => {
    event.preventDefault();
    if (!draft.trim() || sending || trip.isReadOnly) return;
    const content = draft.trim();
    setDraft('');
    setSending(true);
    try {
      const response = await tripService.postConversationMessage(trip._id, content);
      setMessages(response?.data?.conversation || []);
      if (/@vani\b/i.test(content)) onTripChanged?.();
    } catch (error) {
      setDraft(content);
      addToast(error.customMessage || 'Could not send your message.', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
      <Card className="flex min-h-[560px] flex-col p-5">
        <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white"><MessageCircle className="h-5 w-5 text-teal-700" /> Trip discussion</h2>
          <p className="mt-1 text-sm text-slate-500">Collaborators can discuss plans here. Mention <strong>@vani</strong> when you want the assistant to respond or change the itinerary.</p>
        </div>
        <div className="my-4 flex-1 space-y-3 overflow-y-auto" aria-live="polite">
          {loading ? <div className="flex justify-center py-10"><Spinner /></div> : messages.length === 0 ? <p className="py-10 text-center text-sm text-slate-500">No messages yet. Invite a collaborator from My Trips to start planning together.</p> : messages.map((message) => {
            const isCurrentUser = String(message.authorUserId?._id || message.authorUserId || '') === String(user?._id || user?.id || '');
            const isAssistant = message.sender === 'ai';
            return <div key={message._id || `${message.timestamp}-${message.message}`} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[88%] rounded-xl border px-4 py-3 ${isAssistant ? 'border-teal-200 bg-teal-50 dark:border-teal-900 dark:bg-teal-950/30' : isCurrentUser ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'}`}>
                <p className={`mb-1 flex items-center gap-1.5 text-[11px] font-bold ${isCurrentUser ? 'text-slate-200' : 'text-slate-500'}`}>{isAssistant && <Bot className="h-3.5 w-3.5" />}{message.authorName || (isAssistant ? 'Vani' : 'Trip member')}</p>
                <p className="whitespace-pre-wrap text-sm">{message.message}</p>
                <time className={`mt-2 block text-right text-[10px] ${isCurrentUser ? 'text-slate-300' : 'text-slate-400'}`}>{message.timestamp ? new Date(message.timestamp).toLocaleString() : ''}</time>
              </div>
            </div>;
          })}
        </div>
        {trip.isReadOnly ? <p className="rounded-lg bg-slate-100 p-3 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">You have view-only access to this trip.</p> : <form onSubmit={send} className="flex gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
          <input value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={2000} placeholder="Message collaborators, or start with @vani" className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950" />
          <Button type="submit" variant="primary" icon={Send} disabled={sending || !draft.trim()}>{sending ? 'Sending' : 'Send'}</Button>
        </form>}
      </Card>
      <Card className="h-fit p-5">
        <h3 className="flex items-center gap-2 font-bold text-slate-900 dark:text-white"><Users className="h-4 w-4 text-teal-700" /> Collaborators</h3>
        <p className="mb-3 mt-1 text-xs text-slate-500">Invite or change access from My Trips.</p>
        {members.length === 0 ? <p className="text-sm text-slate-500">Only you have access so far.</p> : <ul className="space-y-3">{members.map((member) => <li key={member.id} className="flex items-center justify-between gap-2 text-sm"><span className="truncate text-slate-700 dark:text-slate-200">{member.name || member.email}</span><span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-[10px] uppercase text-slate-500 dark:bg-slate-800">{member.role}</span></li>)}</ul>}
      </Card>
    </div>
  );
};

export default TripDiscussion;
