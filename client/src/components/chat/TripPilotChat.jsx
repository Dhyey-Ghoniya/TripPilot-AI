import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Send,
  Bot,
  RefreshCw,
  MapPin,
  Calendar,
  Users,
  Wallet,
  ArrowRight,
  ExternalLink,
  Plus,
  Compass,
  AlertCircle,
  LogIn,
  UserPlus,
} from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import aiService from '../../services/aiService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { savePendingTripSession, getPendingTripSession } from '../../utils/pendingTripStorage';

const DEFAULT_SUGGESTED_PROMPTS = [
  'Plan a 5-day trip to Delhi from Ahmedabad for 2 people',
  'Plan a 7-day trip to Japan with a budget of ₹80,000 for 2',
  'Plan a 4-day trip to Reykjavik',
  'Plan a road trip from Mumbai to Goa',
  'Make my Tokyo trip cheaper',
  'Keep my Goa trip under ₹50,000',
];

const TripPilotChat = ({
  initialPrompt = '',
  initialTripId = null,
  onTripGenerated = null,
  compact = false,
  className = '',
  title = 'AI Travel Copilot Workspace',
}) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const chatBottomRef = useRef(null);

  const [promptInput, setPromptInput] = useState(initialPrompt);
  const [isExecuting, setIsExecuting] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [activeTrip, setActiveTrip] = useState(null);
  const [activeItinerary, setActiveItinerary] = useState(null);
  const [handoffModalItem, setHandoffModalItem] = useState(null);

  const [chatLog, setChatLog] = useState([
    {
      sender: 'assistant',
      text: 'Hello! I am your TripPilot AI Travel Copilot. Tell me where you want to go or what kind of trip you are planning, and I will research, plan, and organize everything for you.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // Restore pending session if exists
  useEffect(() => {
    const pending = getPendingTripSession();
    if (pending && pending.chatLog && pending.chatLog.length > 0) {
      setChatLog(pending.chatLog);
      if (pending.sessionId) setSessionId(pending.sessionId);
      if (pending.activeTrip) setActiveTrip(pending.activeTrip);
    }
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatLog.length > 1) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatLog, isExecuting]);

  // Handle prompt execution
  const handleSendMessage = async (textToRun = null) => {
    const text = textToRun || promptInput;
    if (!text || !text.trim() || isExecuting) return;

    const userMsg = text.trim();
    if (!textToRun) setPromptInput('');

    const newChatLog = [
      ...chatLog,
      {
        sender: 'user',
        text: userMsg,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
    setChatLog(newChatLog);
    setIsExecuting(true);

    try {
      // Create or retrieve backend session
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        const sessionRes = await aiService.createOrGetSession();
        currentSessionId =
          sessionRes?.data?.session?.sessionId ||
          sessionRes?.session?.sessionId ||
          `session_${Date.now()}`;
        setSessionId(currentSessionId);
      }

      // Send payload to backend travel orchestrator via aiService
      const response = await aiService.sendMessage(currentSessionId, userMsg);
      const orchestratorResult = response?.data?.result || response?.result || response?.data || response;

      const summary =
        orchestratorResult?.copilotMessage ||
        orchestratorResult?.message ||
        'Updated trip blueprint based on your prompt.';
      const tripData = orchestratorResult?.trip;
      const itinData = orchestratorResult?.itinerary;

      if (tripData) setActiveTrip(tripData);
      if (itinData) setActiveItinerary(itinData);

      if (tripData && onTripGenerated) {
        onTripGenerated(tripData);
      }

      const updatedLog = [
        ...newChatLog,
        {
          sender: 'assistant',
          text: summary,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          metadata: orchestratorResult,
        },
      ];
      setChatLog(updatedLog);

      // Save unauthenticated pending state to localStorage if guest
      if (!isAuthenticated) {
        savePendingTripSession({
          chatLog: updatedLog,
          sessionId: currentSessionId,
          activeTrip: tripData || activeTrip,
          lastPrompt: userMsg,
        });
      }
    } catch (err) {
      console.error('[TripPilotChat Error]:', err);
      const errorLog = [
        ...newChatLog,
        {
          sender: 'assistant',
          text: 'I ran into a temporary issue researching your request. Please retry or adjust your prompt.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true,
        },
      ];
      setChatLog(errorLog);
      addToast('AI research request failed. Check server connection.', 'error');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div
      className={`bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-4 sm:p-6 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white max-w-4xl mx-auto text-left transition-all space-y-4 ${className}`}
    >
      {/* Workspace Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-secondary-500/10 text-secondary-500">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {title}
            </h3>
            <p className="text-[11px] text-slate-400">Ask anything, plan routes, or modify active trips</p>
          </div>
        </div>

        {!isAuthenticated && (
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-[10px] text-amber-500 font-semibold flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
              <LogIn className="w-3 h-3" /> Guest Mode (State Auto-Saved)
            </span>
          </div>
        )}
      </div>

      {/* Suggested Prompts Strip */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          Suggested Prompts — Click to launch AI planning:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {DEFAULT_SUGGESTED_PROMPTS.map((promptText, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(promptText)}
              disabled={isExecuting}
              className="px-2.5 py-1 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-secondary-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 transition flex items-center gap-1 text-left"
            >
              <Sparkles className="w-3 h-3 text-secondary-500 shrink-0" />
              <span>{promptText}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Stream History */}
      <div
        className={`bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 overflow-y-auto space-y-4 text-xs ${
          compact ? 'max-h-[280px]' : 'max-h-[380px]'
        }`}
      >
        {chatLog.map((msg, idx) => {
          const isUser = msg.sender === 'user';
          const meta = msg.metadata;
          const sData = meta?.structuredData;

          return (
            <div key={idx} className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs ${
                  isUser ? 'bg-secondary-600' : 'bg-gradient-to-tr from-primary-900 to-secondary-600'
                }`}
              >
                {isUser ? 'U' : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`p-4 rounded-2xl max-w-[88%] leading-relaxed ${
                  isUser
                    ? 'bg-secondary-600 text-white rounded-tr-none'
                    : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-800 shadow-sm'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* ACTIVE TRIP GENERATED BADGE & WORKSPACE LINK */}
                {meta?.trip && (
                  <div className="mt-3 p-3 rounded-xl bg-secondary-500/10 border border-secondary-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-bold text-secondary-600 dark:text-secondary-400 block">
                        🎉 Active Trip Blueprint: {meta.trip.title}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {meta.trip.destinations?.[0]?.name} · {meta.trip.dates?.durationDays || 5} Days ·{' '}
                        {meta.trip.travelers?.count || 2} Travelers
                      </span>
                    </div>
                    <Link to={`/trips/${meta.trip._id}`}>
                      <Button variant="primary" size="sm" icon={ArrowRight}>
                        Open Full Workspace
                      </Button>
                    </Link>
                  </div>
                )}

                {/* INLINE FLIGHT CARDS */}
                {sData?.flights?.length > 0 && (
                  <div className="mt-3 space-y-2 w-full">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Flight Options Matrix
                    </p>
                    {sData.flights.slice(0, 2).map((fl, fIdx) => (
                      <div
                        key={fIdx}
                        className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center text-[11px]"
                      >
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white">✈️ {fl.airline}</span>
                          <span className="text-[9px] text-slate-400 block">
                            {fl.departureAirport} → {fl.arrivalAirport} ({fl.cabinClass || 'Economy'})
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                            ₹{(fl.price?.amount || fl.price || 14500).toLocaleString()}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setHandoffModalItem({
                                type: 'Flight',
                                title: `${fl.airline} Flight`,
                                provider: fl.providerName || 'Skyscanner / Cleartrip',
                                price: `₹${(fl.price?.amount || fl.price || 14500).toLocaleString()}`,
                              })
                            }
                            className="text-[9px] text-secondary-600 dark:text-secondary-400 font-bold hover:underline"
                          >
                            Book Option
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* INLINE HOTEL CARDS */}
                {sData?.hotels?.length > 0 && (
                  <div className="mt-3 space-y-2 w-full">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Neighborhood Hotel Fit Score
                    </p>
                    {sData.hotels.slice(0, 2).map((ht, hIdx) => (
                      <div
                        key={hIdx}
                        className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center text-[11px]"
                      >
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white">🏨 {ht.name}</span>
                          <span className="text-[9px] text-slate-400 block">{ht.neighborhood || ht.address}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                            ₹{(ht.pricePerNight?.amount || ht.pricePerNight || 4500).toLocaleString()}/nt
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setHandoffModalItem({
                                type: 'Hotel',
                                title: ht.name,
                                provider: ht.providerName || 'Booking.com',
                                price: `₹${(ht.pricePerNight?.amount || ht.pricePerNight || 4500).toLocaleString()}/nt`,
                              })
                            }
                            className="text-[9px] text-secondary-600 dark:text-secondary-400 font-bold hover:underline"
                          >
                            Book Stay
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* INLINE ROAD TRIP CARD */}
                {sData?.isRoadTrip && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] space-y-1">
                    <span className="font-bold text-amber-600 dark:text-amber-400 block">
                      🚗 Road Trip Route Overview
                    </span>
                    <span>
                      Total Distance: {sData.totalDistanceKm} km · Driving Time: ~{sData.totalDrivingHours} hrs ·
                      Daily Cap: 350 km
                    </span>
                  </div>
                )}

                <span className="text-[9px] opacity-60 block text-right mt-1.5">{msg.time}</span>
              </div>
            </div>
          );
        })}

        {isExecuting && (
          <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
            <RefreshCw className="w-4 h-4 animate-spin text-secondary-500" />
            <span>TripPilot AI is researching destinations, flight corridors & hotel fit...</span>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Prominent Chat Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center gap-2 pt-1"
      >
        <input
          type="text"
          value={promptInput}
          onChange={(e) => setPromptInput(e.target.value)}
          placeholder="Ask TripPilot anything... e.g. 'Plan 5 days in Delhi' or 'Make it cheaper'..."
          className="flex-1 px-4 py-3 text-sm rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-secondary-500 transition font-medium"
        />
        <Button
          type="submit"
          variant="primary"
          size="md"
          icon={Send}
          disabled={isExecuting || !promptInput.trim()}
          className="px-5 py-3 shadow-lg shadow-secondary-900/30"
        >
          Send
        </Button>
      </form>

      {/* Guest Mode Auth Prompt Strip */}
      {!isAuthenticated && chatLog.length > 2 && (
        <div className="p-3 rounded-2xl bg-gradient-to-r from-secondary-900 to-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border border-secondary-500/30">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
            <span>
              Your conversation & trip requirements are automatically preserved. Sign in or register to permanently sync to your account!
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link to="/login">
              <Button variant="accent" size="sm" icon={LogIn}>
                Log In
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="outline" size="sm" icon={UserPlus} className="text-white border-white/40 hover:bg-white/10">
                Register
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Provider Handoff Modal */}
      {handoffModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase text-secondary-600 flex items-center gap-1">
                <ExternalLink className="w-4 h-4" /> Live Provider Handoff
              </span>
              <button onClick={() => setHandoffModalItem(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{handoffModalItem.title}</h3>
              <p className="text-xs text-slate-500">Live price verification via provider partner</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Provider Partner:</span>
                <span className="font-bold text-slate-900 dark:text-white">{handoffModalItem.provider}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Estimated Price:</span>
                <span className="font-bold text-emerald-600">{handoffModalItem.price}</span>
              </div>
            </div>
            <div className="space-y-2">
              <a
                href="https://www.booking.com"
                target="_blank"
                rel="noreferrer"
                onClick={() => setHandoffModalItem(null)}
                className="w-full py-2.5 rounded-xl bg-secondary-600 hover:bg-secondary-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition"
              >
                <span>Proceed to {handoffModalItem.provider}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => setHandoffModalItem(null)}
                className="w-full py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                Return to Conversation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripPilotChat;
