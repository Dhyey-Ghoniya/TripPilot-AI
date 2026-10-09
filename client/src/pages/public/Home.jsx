import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Send,
  Bot,
  RefreshCw,
  Zap,
  MapPin,
  Calendar,
  Users,
  Wallet,
  ArrowRight,
  ShieldCheck,
  Building2,
  Plane,
  Utensils,
  Car,
  FileText,
  Package,
  ExternalLink,
  ChevronRight,
  Plus,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Card from '../../components/common/Card';
import aiService from '../../services/aiService';
import { useToast } from '../../context/ToastContext';

const SUGGESTED_PROMPTS = [
  'Plan a 5-day trip to Delhi from Ahmedabad for 2 people',
  'Plan a 10-day trip to Tokyo with food & tech museums',
  'Plan a honeymoon in Bali with beach resorts',
  'Plan a road trip from Mumbai to Goa',
  'Find flights to Tokyo from Ahmedabad',
  'Where should I go in November for warm weather?',
  'Keep my Goa trip under ₹50,000',
];

const Home = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const chatBottomRef = useRef(null);

  const [promptInput, setPromptInput] = useState('');
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

  // Scroll chat into view on update
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

    // Append user message
    setChatLog((prev) => [
      ...prev,
      {
        sender: 'user',
        text: userMsg,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    setIsExecuting(true);

    try {
      // Create or get session if not established
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        const sessionRes = await aiService.createOrGetSession();
        currentSessionId = sessionRes?.data?.session?.sessionId || sessionRes?.session?.sessionId || `session_${Date.now()}`;
        setSessionId(currentSessionId);
      }

      // Send prompt to backend agent
      const response = await aiService.sendMessage(currentSessionId, userMsg);
      const orchestratorResult = response?.data?.result || response?.result || response?.data || response;

      const summary = orchestratorResult?.copilotMessage || orchestratorResult?.message || 'Updated trip blueprint based on your prompt.';
      const tripData = orchestratorResult?.trip;
      const itinData = orchestratorResult?.itinerary;

      if (tripData) setActiveTrip(tripData);
      if (itinData) setActiveItinerary(itinData);

      setChatLog((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: summary,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          metadata: orchestratorResult,
        },
      ]);
    } catch (err) {
      console.error('[Home Chat Error]:', err);
      setChatLog((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: 'I ran into a temporary issue researching your request. Please retry or adjust your query.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true,
        },
      ]);
      addToast('AI research request failed. Check server connection.', 'error');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-16 pb-20">
      {/* HERO SECTION: CONVERSATION-FIRST LANDING EXPERIENCE */}
      <section className="relative pt-8 pb-14 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-950 via-primary-950 to-slate-950 text-white rounded-3xl shadow-2xl border border-slate-800/80 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#06b6d4_1.5px,transparent_1.5px)] [background-size:24px_24px] pointer-events-none" />
        <div className="absolute -top-36 -left-36 w-96 h-96 bg-secondary-500/20 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute top-1/2 -right-36 w-96 h-96 bg-primary-600/25 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto space-y-6 text-center">
          {/* Header Branding & Welcome */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary-500/15 border border-secondary-400/30 text-secondary-300 text-xs font-semibold tracking-wide backdrop-blur-md shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>TRIPPILOT AI · Your Conversational AI Travel Copilot</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight text-white">
              Where will your next <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-400 via-teal-300 to-amber-300">
                adventure take you?
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
              Tell your AI copilot where you want to go. We research destinations, pair flights, match optimal neighborhood stays, and optimize your trip budget in seconds.
            </p>
          </div>

          {/* MAIN CONVERSATIONAL CHAT WORKSPACE */}
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-4 sm:p-6 rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-800 text-slate-900 dark:text-white max-w-4xl mx-auto text-left transition-all space-y-4">
            
            {/* Suggested Prompts Strip */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Suggested Prompts — Click to launch AI planning:
              </span>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_PROMPTS.map((promptText, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(promptText)}
                    disabled={isExecuting}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-secondary-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 transition flex items-center gap-1.5 text-left"
                  >
                    <Sparkles className="w-3 h-3 text-secondary-500 shrink-0" />
                    <span>{promptText}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Stream History */}
            <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 max-h-[380px] overflow-y-auto space-y-4 text-xs">
              {chatLog.map((msg, idx) => {
                const isUser = msg.sender === 'user';
                const meta = msg.metadata;
                const sData = meta?.structuredData;

                return (
                  <div key={idx} className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs ${isUser ? 'bg-secondary-600' : 'bg-gradient-to-tr from-primary-900 to-secondary-600'}`}>
                      {isUser ? 'U' : <Bot className="w-4 h-4" />}
                    </div>

                    <div className={`p-4 rounded-2xl max-w-[88%] leading-relaxed ${isUser ? 'bg-secondary-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-800 shadow-sm'}`}>
                      <div className="whitespace-pre-wrap">{msg.text}</div>

                      {/* ACTIVE TRIP GENERATED BADGE & WORKSPACE LINK */}
                      {meta?.trip && (
                        <div className="mt-3 p-3 rounded-xl bg-secondary-500/10 border border-secondary-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div>
                            <span className="text-[11px] font-bold text-secondary-600 dark:text-secondary-400 block">
                              🎉 Active Trip Blueprint: {meta.trip.title}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {meta.trip.destinations?.[0]?.name} · {meta.trip.dates?.durationDays || 5} Days · {meta.trip.travelers?.count || 2} Travelers
                            </span>
                          </div>
                          <Link to={`/trips/${meta.trip._id}`}>
                            <Button variant="primary" size="sm" icon={ArrowRight}>
                              Open Full Trip Workspace
                            </Button>
                          </Link>
                        </div>
                      )}

                      {/* INLINE FLIGHT CARDS */}
                      {sData?.flights?.length > 0 && (
                        <div className="mt-3 space-y-2 w-full">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Flight Options Matrix</p>
                          {sData.flights.slice(0, 2).map((fl, fIdx) => (
                            <div key={fIdx} className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center text-[11px]">
                              <div>
                                <span className="font-bold text-slate-900 dark:text-white">✈️ {fl.airline}</span>
                                <span className="text-[9px] text-slate-400 block">{fl.departureAirport} → {fl.arrivalAirport} ({fl.cabinClass || 'Economy'})</span>
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-emerald-600 dark:text-emerald-400 block">₹{(fl.price?.amount || fl.price || 14500).toLocaleString()}</span>
                                <button
                                  type="button"
                                  onClick={() => setHandoffModalItem({ type: 'Flight', title: `${fl.airline} Flight`, provider: fl.providerName || 'Skyscanner / Cleartrip', price: `₹${(fl.price?.amount || fl.price || 14500).toLocaleString()}` })}
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
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Neighborhood Hotel Fit Score</p>
                          {sData.hotels.slice(0, 2).map((ht, hIdx) => (
                            <div key={hIdx} className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center text-[11px]">
                              <div>
                                <span className="font-bold text-slate-900 dark:text-white">🏨 {ht.name}</span>
                                <span className="text-[9px] text-slate-400 block">{ht.neighborhood || ht.address}</span>
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-emerald-600 dark:text-emerald-400 block">₹{(ht.pricePerNight?.amount || ht.pricePerNight || 4500).toLocaleString()}/nt</span>
                                <button
                                  type="button"
                                  onClick={() => setHandoffModalItem({ type: 'Hotel', title: ht.name, provider: ht.providerName || 'Booking.com', price: `₹${(ht.pricePerNight?.amount || ht.pricePerNight || 4500).toLocaleString()}/nt` })}
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
                          <span className="font-bold text-amber-600 dark:text-amber-400 block">🚗 Road Trip Route Overview</span>
                          <span>Total Distance: {sData.totalDistanceKm} km · Driving Time: ~{sData.totalDrivingHours} hrs · Daily Cap: 350 km</span>
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
          </div>

          {/* Quick Features & Active Trip Action Strip */}
          {activeTrip && (
            <div className="p-4 rounded-2xl bg-secondary-950/60 border border-secondary-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <Badge variant="accent" size="sm">Active Trip</Badge>
                <span className="font-bold text-white">{activeTrip.title}</span>
                <span className="text-slate-400">Target Budget: ₹{(activeTrip.budget?.total || 50000).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Link to={`/trips/${activeTrip._id}`}>
                  <Button variant="primary" size="sm" icon={ArrowRight}>
                    Open Trip Workspace
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Plus}
                  onClick={() => {
                    setActiveTrip(null);
                    setActiveItinerary(null);
                    setSessionId(null);
                    setChatLog([{
                      sender: 'assistant',
                      text: 'Started a fresh trip planning conversation! Where would you like to travel next?',
                      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    }]);
                  }}
                >
                  Start New Trip
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* THREE INTELLIGENT PILLARS SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <Badge variant="secondary" size="md">Intelligent Architecture</Badge>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Everything Belongs to the Same Trip Context
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
            TripPilot AI unifies conversation, daily pacing, flight routes, stays, and budget optimization into a single persistent trip object.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 space-y-3 hover:border-secondary-500/60 transition">
            <div className="w-10 h-10 rounded-xl bg-secondary-50 dark:bg-secondary-900/30 text-secondary-600 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">1. Conversational Agent</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Researches destinations dynamically. Takes natural instructions like "Make Day 3 cheaper" or "Add a beach day".
            </p>
          </Card>

          <Card className="p-6 space-y-3 hover:border-secondary-500/60 transition">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/30 text-teal-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">2. Spatial Itinerary Timeline</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Clusters nearby attraction corridors to eliminate unnecessary daily travel backtracking across cities.
            </p>
          </Card>

          <Card className="p-6 space-y-3 hover:border-secondary-500/60 transition">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">3. Budget & Provider Handoff</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Provides real live provider handoffs for flights and hotels without losing your active itinerary context.
            </p>
          </Card>
        </div>
      </section>

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

export default Home;

