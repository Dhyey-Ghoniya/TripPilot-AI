import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Send,
  Bot,
  RefreshCw,
  ArrowRight,
  ExternalLink,
  LogIn,
  UserPlus,
  X,
} from 'lucide-react';
import Button from '../ui/Button';
import aiService from '../../services/aiService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { clearPendingTripSession, savePendingTripSession, getPendingTripSession } from '../../utils/pendingTripStorage';

const DEFAULT_SUGGESTED_PROMPTS = [
  'Plan a 5-day trip to Delhi from Ahmedabad for 2 people',
  'Plan a 7-day trip to Japan with a budget of ₹80,000 for 2',
  'Plan a 4-day trip to Reykjavik',
  'Plan a road trip from Mumbai to Goa',
  'Make my Tokyo trip cheaper',
  'Keep my Goa trip under ₹50,000',
];

const LANDING_PROMPTS = [
  'Plan 5 days in Japan',
  'Plan a long weekend in Goa',
  'Make my trip more affordable',
];

const STARTER_ACTIONS = [
  { label: 'Plan a trip', prompt: 'Help me plan a complete trip. Ask for the destination, dates, travelers, origin, and budget.' },
  { label: 'Flights', prompt: 'Find flight options for my trip and compare available providers, times, and prices.' },
  { label: 'Hotels', prompt: 'Find hotel options for my trip with neighborhood fit, availability, and prices.' },
  { label: 'Getting in', prompt: 'Find the best transport options for getting into my destination from the airport or station.' },
  { label: 'Local SIM', prompt: 'Recommend local SIM and eSIM options for my destination, including practical setup details.' },
  { label: 'Travel insurance', prompt: 'Compare suitable travel insurance considerations for my destination and trip length.' },
];

const TripPilotChat = ({
  initialPrompt = '',
  initialTripId = null,
  onTripGenerated = null,
  compact = false,
  className = '',
  title = 'AI Travel Copilot Workspace',
  variant = 'standard',
}) => {
  const isLanding = variant === 'landing';
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const chatContainerRef = useRef(null);
  const pendingResumeStarted = useRef(false);

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

  // Restore the guest conversation and finish it under the signed-in user's account.
  useEffect(() => {
    // A destination-card launch starts a new plan. Do not hydrate an unrelated
    // unfinished guest conversation into that fresh destination context.
    if (initialPrompt.trim()) return;

    const pending = getPendingTripSession();
    if (!pending) return;

    if (pending.chatLog?.length > 0) {
      setChatLog(pending.chatLog.map((message) => ({
        ...message,
        text: message.text ?? message.content ?? '',
        time: message.time || (message.timestamp
          ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : ''),
      })));
    }
    if (pending.sessionId) setSessionId(pending.sessionId);
    if (pending.activeTrip && !isAuthenticated) setActiveTrip(pending.activeTrip);

    if (!isAuthenticated || !pending.lastPrompt || pendingResumeStarted.current) return;
    pendingResumeStarted.current = true;
    setIsExecuting(true);

    const resumePendingPlan = async () => {
      try {
        let currentSessionId = pending.sessionId;
        if (!currentSessionId) {
          const sessionResponse = await aiService.createOrGetSession();
          currentSessionId = sessionResponse?.data?.session?.sessionId;
        }
        if (!currentSessionId) throw new Error('Could not restore the planner session.');

        setSessionId(currentSessionId);
        const response = await aiService.sendMessage(currentSessionId, pending.lastPrompt);
        const result = response?.data?.result || response?.result || response?.data || {};
        const summary = result.copilotMessage || result.message || 'Your trip plan has been updated.';

        if (result.trip) {
          setActiveTrip(result.trip);
          clearPendingTripSession();
        }
        if (result.itinerary) setActiveItinerary(result.itinerary);
        setChatLog((previous) => [
          ...previous,
          {
            sender: 'assistant',
            text: result.trip ? `${summary} Your trip is saved to your account.` : summary,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            metadata: result,
          },
        ]);
      } catch (error) {
        console.error('[TripPilotChat Resume Error]:', error);
        setPromptInput(pending.lastPrompt);
        addToast('Your saved trip details are still here. Please send the prompt again to finish planning.', 'error');
      } finally {
        setIsExecuting(false);
      }
    };

    resumePendingPlan();
  }, [isAuthenticated, addToast, initialPrompt]);

  // Auto-scroll chat transcript internally (never scrolls window)
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
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
    <div className={`bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl shadow-soft border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white max-w-4xl mx-auto text-left space-y-4 ${className}`}>
      {/* Workspace Header */}
      {isLanding ? (
        <div className="border-b border-slate-100 pb-4 dark:border-slate-800">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-800 dark:text-teal-300">TripPilot planner</p>
          <h2 className="planner-prompt-title mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Where would you like to go?</h2>
          <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">Start with a destination, a few dates, or a question.</p>
        </div>
      ) : (
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-secondary-500/10 text-secondary-500">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {title}
            </h3>
            <p className="text-[11px] text-slate-400">Ask for a destination, adjust dates, or change an active trip</p>
          </div>
        </div>

        {!isAuthenticated && (
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
              <LogIn className="w-3 h-3" /> Guest session saved locally
            </span>
          </div>
        )}
      </div>
      )}

      {/* Suggested Prompts Strip */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
          {isLanding ? 'Try a prompt' : 'Suggested prompts'}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {(isLanding ? LANDING_PROMPTS : DEFAULT_SUGGESTED_PROMPTS).map((promptText, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(promptText)}
              disabled={isExecuting}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#f5f6f2] dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 transition-colors duration-200 flex items-center gap-1 text-left"
            >
              <span>{promptText}</span>
            </button>
          ))}
        </div>
      </div>

      {/* One-step planning entry points, matching the reference workflow */}
      {!isLanding && <div className="space-y-1.5">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
          Start with one thing
        </span>
        <div className="flex flex-wrap gap-1.5">
          {STARTER_ACTIONS.map(({ label, prompt }) => (
            <button
              key={label}
              type="button"
              onClick={() => handleSendMessage(prompt)}
              disabled={isExecuting}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 hover:bg-secondary-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors duration-200 disabled:opacity-50"
            >
              {label}
            </button>
          ))}
          <Link
            to="/contact"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-secondary-700 dark:text-secondary-300 border border-secondary-200 dark:border-secondary-800 hover:bg-secondary-50 dark:hover:bg-secondary-950/30 transition-colors duration-200"
          >
            Talk to an expert
          </Link>
        </div>
      </div>}

      {/* Chat Stream History */}
      {(!isLanding || chatLog.length > 1) && <div
        ref={chatContainerRef}
        className={`bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 overflow-y-auto space-y-4 text-sm ${
          compact ? 'max-h-[280px]' : 'max-h-[380px]'
        }`}
      >
        {chatLog.map((msg, idx) => {
          if (isLanding && idx === 0) return null;
          const isUser = msg.sender === 'user';
          const meta = msg.metadata;
          const sData = meta?.structuredData;

          return (
            <div key={idx} className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                  isUser ? 'bg-secondary-600 text-white' : 'bg-slate-900 text-secondary-400 border border-slate-700/80 shadow-sm'
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
                        Active Trip Blueprint: {meta.trip.title}
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
                      Illustrative flight examples, not live inventory
                    </p>
                    {sData.flights.slice(0, 2).map((fl, fIdx) => (
                      <div
                        key={fIdx}
                        className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center text-[11px]"
                      >
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white">{fl.airline}</span>
                          <span className="text-[9px] text-slate-400 block">
                            {fl.departureAirport} → {fl.arrivalAirport} ({fl.cabinClass || 'Economy'})
                          </span>
                          <span className="text-[9px] text-amber-700 dark:text-amber-300 block">
                            Indicative estimate, not a live fare
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                            {fl.price?.amount || fl.price ? `₹${(fl.price?.amount || fl.price).toLocaleString()}` : 'Price unavailable'}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setHandoffModalItem({
                                type: 'Flight',
                                title: `${fl.airline} Flight`,
                                provider: fl.providerName || 'Skyscanner / Cleartrip',
                                price: fl.price?.amount || fl.price ? `₹${(fl.price?.amount || fl.price).toLocaleString()}` : 'Price unavailable',
                                bookingUrl: fl.bookingUrl || '',
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
                      Sample stay estimates, not live availability
                    </p>
                    {sData.hotels.slice(0, 2).map((ht, hIdx) => (
                      <div
                        key={hIdx}
                        className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center text-[11px]"
                      >
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white">{ht.name}</span>
                          <span className="text-[9px] text-slate-400 block">{ht.neighborhood || ht.address}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                            {ht.pricePerNight?.amount || ht.pricePerNight ? `₹${(ht.pricePerNight?.amount || ht.pricePerNight).toLocaleString()}/nt` : 'Price unavailable'}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setHandoffModalItem({
                                type: 'Hotel',
                                title: ht.name,
                                provider: ht.providerName || 'Booking.com',
                                price: ht.pricePerNight?.amount || ht.pricePerNight ? `₹${(ht.pricePerNight?.amount || ht.pricePerNight).toLocaleString()}/nt` : 'Price unavailable',
                                bookingUrl: ht.bookingUrl || '',
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
                      Road Trip Route Overview
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
            <span>Looking up destinations, flights, and stays...</span>
          </div>
        )}
      </div>}

      {/* Prominent Chat Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className={`${isLanding ? 'flex flex-col gap-2 border border-slate-200 bg-white p-2 focus-within:border-teal-700/60 dark:border-slate-700 dark:bg-slate-900' : 'flex items-center gap-2 pt-1'}`}
      >
        <textarea
          rows={isLanding ? 2 : 1}
          value={promptInput}
          onChange={(e) => setPromptInput(e.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder={isLanding ? 'Example: 5 days in Kyoto, flying from Mumbai, under ₹90,000' : "Ask TripPilot anything... e.g. 'Plan 5 days in Delhi' or 'Make it cheaper'..."}
          className={`${isLanding ? 'w-full resize-none border-0 bg-transparent px-3 py-2 text-sm leading-6' : 'flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium'} text-slate-900 dark:bg-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-0`}
        />
        <Button
          type="submit"
          variant="primary"
          size="md"
          icon={Send}
          disabled={isExecuting || !promptInput.trim()}
          className={`${isLanding ? 'self-end rounded-lg bg-teal-700 px-5 py-2.5 hover:bg-teal-800' : 'px-5 py-3'}`}
        >
          {isLanding ? 'Plan this trip' : 'Send'}
        </Button>
      </form>

      {/* Guest Mode Auth Prompt Strip */}
      {!isAuthenticated && chatLog.length > 2 && (
        <div className="p-3 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border border-slate-700">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
            <span>
              This conversation is stored on this device. Sign in to save it to your account.
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
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-modal space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase text-secondary-600 flex items-center gap-1">
                <ExternalLink className="w-4 h-4" /> Provider Booking Link
              </span>
              <button onClick={() => setHandoffModalItem(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{handoffModalItem.title}</h3>
              <p className="text-xs text-slate-500">Review the provider's current availability and final price before booking.</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Provider Partner:</span>
                <span className="font-bold text-slate-900 dark:text-white">{handoffModalItem.provider}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Price shown:</span>
                <span className="font-bold text-emerald-600">{handoffModalItem.price}</span>
              </div>
            </div>
            <div className="space-y-2">
              {handoffModalItem.bookingUrl ? (
                <a
                  href={handoffModalItem.bookingUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setHandoffModalItem(null)}
                  className="w-full py-2.5 rounded-xl bg-secondary-600 hover:bg-secondary-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition"
                >
                  <span>Continue to {handoffModalItem.provider}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <p className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                  A booking link is not available for this result. Search the provider directly and confirm its current price and availability.
                </p>
              )}
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
