import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Send,
  Compass,
  MapPin,
  Calendar,
  Users,
  Wallet,
  Plane,
  CheckCircle2,
  Clock,
  Zap,
  ArrowRight,
  Bot,
  User as UserIcon,
  RefreshCw,
  Layers,
  ChevronRight,
  HelpCircle,
  Eye,
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import aiService from '../../services/aiService';
import tripService from '../../services/tripService';
import { cleanDestinationName, getAuthenticActivityImage } from '../../utils/activityImageResolver';

const PRESET_PROMPTS = [
  'Plan a 5-day trip to Dubai from Ahmedabad for 2 people.',
  'Plan 5 days in Goa from Ahmedabad for 2.',
  'Plan 7 days in Tokyo.',
  'Plan Bali under ₹80,000.',
  'Plan a 4-day trip to Reykjavik Iceland.',
];

const AiPlanner = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedParams, setExtractedParams] = useState({});
  const [destinationContext, setDestinationContext] = useState(null);
  const [generatedTrip, setGeneratedTrip] = useState(null);
  const [generatedItinerary, setGeneratedItinerary] = useState(null);
  const [planningStage, setPlanningStage] = useState(0); // 0: Idle, 1: Extracting, 2: Resolving, 3: Synthesizing, 4: Done

  const chatEndRef = useRef(null);

  // Initialize AI session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        const response = await aiService.createOrGetSession();
        if (response?.data?.session) {
          setSessionId(response.data.session.sessionId);
          setMessages(response.data.session.messages || []);
        }
      } catch (err) {
        console.error('[AiPlanner Session Init Error]:', err);
      }
    };
    initSession();
  }, []);

  // Auto scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const handleSendMessage = async (customText = null) => {
    const textToSend = customText || inputPrompt;
    if (!textToSend || !textToSend.trim() || isProcessing) return;

    const userMessageText = textToSend.trim();
    if (!customText) setInputPrompt('');

    // Optimistically add user message
    const tempUserMessage = {
      sender: 'user',
      content: userMessageText,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);
    setIsProcessing(true);

    // Telemetry progress stages animation
    setPlanningStage(1);
    const stageTimer1 = setTimeout(() => setPlanningStage(2), 600);
    const stageTimer2 = setTimeout(() => setPlanningStage(3), 1200);

    try {
      let activeSessionId = sessionId;
      if (!activeSessionId) {
        const sessionRes = await aiService.createOrGetSession();
        activeSessionId = sessionRes.data.session.sessionId;
        setSessionId(activeSessionId);
      }

      const response = await aiService.sendMessage(activeSessionId, userMessageText);

      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      setPlanningStage(4);

      if (response && response.data) {
        const { session, result } = response.data;
        if (session && session.messages) {
          setMessages(session.messages);
        }

        if (result) {
          if (result.extractedParams) setExtractedParams(result.extractedParams);
          if (result.destinationContext) setDestinationContext(result.destinationContext);
          if (result.trip) setGeneratedTrip(result.trip);
          if (result.itinerary) setGeneratedItinerary(result.itinerary);

          if (result.isComplete && result.trip) {
            addToast(`Synthesized ${result.trip.title}! ✈️`, 'success');
          }
        }
      }
    } catch (err) {
      console.error('[AiPlanner Message Error]:', err);
      addToast('Error processing prompt. Please try again.', 'error');
      setPlanningStage(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveOrViewTrip = () => {
    const targetId = generatedTrip?._id;

    if (isAuthenticated) {
      if (targetId) {
        addToast('Opening full trip workspace! ✈️', 'success');
        navigate(`/trips/${targetId}`);
      } else {
        navigate('/my-trips');
      }
    } else {
      if (targetId) {
        localStorage.setItem('pending_trip_id', targetId);
        addToast('Please sign in to save & customize your trip blueprint! 🔑', 'info');
        navigate('/login', { state: { from: { pathname: `/trips/${targetId}` } } });
      } else {
        navigate('/login');
      }
    }
  };

  const getActivityImage = (act, day) => {
    if (act?.imageUrl) return act.imageUrl;
    const title = (act?.activity || act?.title || day?.theme || '').toLowerCase();

    if (title.includes('palace') || title.includes('fort') || title.includes('heritage')) {
      return 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=600&q=80';
    }
    if (title.includes('garden') || title.includes('nature') || title.includes('park') || title.includes('botanical')) {
      return 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=600&q=80';
    }
    if (title.includes('food') || title.includes('culinary') || title.includes('thali') || title.includes('lunch') || title.includes('dinner')) {
      return 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80';
    }
    if (title.includes('market') || title.includes('bazaar') || title.includes('shopping') || title.includes('craft')) {
      return 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80';
    }
    if (title.includes('cocktail') || title.includes('rooftop') || title.includes('music') || title.includes('night')) {
      return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80';
    }
    if (title.includes('journey') || title.includes('outbound') || title.includes('return') || title.includes('departure') || title.includes('flight')) {
      return 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=600&q=80';
    }
    if (title.includes('museum') || title.includes('art') || title.includes('gallery') || title.includes('science')) {
      return 'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?auto=format&fit=crop&w=600&q=80';
    }

    return 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=600&q=80';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-500/10 border border-secondary-500/20 text-secondary-600 dark:text-secondary-400 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>TripPilot AI Travel Copilot</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
          AI Travel Planner
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
          Describe your dream trip in natural language. Our copilot extracts parameters, resolves any location worldwide, and synthesizes structured day-by-day itineraries.
        </p>
      </div>

      {/* Quick Prompt Presets */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
          Try Quick Prompt Presets:
        </span>
        <div className="flex flex-wrap gap-2">
          {PRESET_PROMPTS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(preset)}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-secondary-50 dark:hover:bg-slate-700/80 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5"
            >
              <span>{preset}</span>
              <ArrowRight className="w-3 h-3 text-secondary-500" />
            </button>
          ))}
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Conversational Copilot Chat (7 cols) */}
        <div className="lg:col-span-7 space-y-4 flex flex-col h-[650px]">
          <Card className="flex-1 flex flex-col p-6 space-y-4 overflow-hidden border border-slate-200 dark:border-slate-800">
            {/* Chat Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-900 to-secondary-600 text-white flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">TripPilot Agent</h3>
                  <p className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Active Copilot Engine
                  </p>
                </div>
              </div>
              {planningStage > 0 && planningStage < 4 && (
                <div className="flex items-center gap-2 text-xs text-secondary-600 dark:text-secondary-400 font-bold bg-secondary-500/10 px-3 py-1 rounded-full">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing...</span>
                </div>
              )}
            </div>

            {/* Chat Transcript Stream */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {messages.map((msg, index) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={index}
                    className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
                  >
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                        isUser
                          ? 'bg-secondary-600 text-white'
                          : 'bg-primary-900 text-white'
                      }`}
                    >
                      {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div
                      className={`max-w-[82%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        isUser
                          ? 'bg-secondary-600 text-white rounded-tr-none'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/50 dark:border-slate-700/50'
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.content}</p>

                      {/* Attached Metadata Preview Badge */}
                      {msg.metadata?.destinationContext && (
                        <div className="mt-3 p-3 rounded-xl bg-slate-900 text-white space-y-1 text-xs">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-secondary-400 block">
                            Resolved Context
                          </span>
                          <p className="font-bold">{msg.metadata.destinationContext.name}, {msg.metadata.destinationContext.country}</p>
                          <p className="text-[11px] text-slate-300 line-clamp-2">
                            {msg.metadata.destinationContext.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isProcessing && (
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-xl bg-primary-900 text-white flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-3.5 rounded-2xl rounded-tl-none bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-secondary-500" />
                    <span>Processing parameters and resolving destination context...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2"
            >
              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="Ask TripPilot AI (e.g. 'Plan 5 days in Dubai from Ahmedabad for 2')..."
                className="flex-1 px-4 py-3 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-secondary-500"
              />
              <Button
                type="submit"
                variant="primary"
                size="md"
                icon={Send}
                disabled={isProcessing || !inputPrompt.trim()}
              >
                Send
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Column: Live Telemetry, Extracted Params & Blueprint Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Planning Pipeline Progress */}
          <Card className="p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Zap className="w-4 h-4 text-secondary-500" />
              AI Planning Telemetry
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-300">1. Parse Prompt</span>
                {planningStage >= 1 ? (
                  <span className="text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Parsed
                  </span>
                ) : (
                  <span className="text-slate-400">Pending</span>
                )}
              </div>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-300">2. Destination Resolver</span>
                {planningStage >= 2 ? (
                  <span className="text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                  </span>
                ) : (
                  <span className="text-slate-400">Pending</span>
                )}
              </div>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-300">3. Synthesize Itinerary</span>
                {planningStage >= 3 ? (
                  <span className="text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Synthesized
                  </span>
                ) : (
                  <span className="text-slate-400">Pending</span>
                )}
              </div>
            </div>
          </Card>

          {/* Extracted Parameters Card */}
          {extractedParams && Object.keys(extractedParams).length > 0 && (
            <Card className="p-6 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Layers className="w-4 h-4 text-secondary-500" />
                Extracted Parameters
              </h3>
              <div className="flex flex-wrap gap-2 text-xs">
                {extractedParams.destination && (
                  <Badge variant="secondary" size="md">
                    📍 Destination: {extractedParams.destination}
                  </Badge>
                )}
                {extractedParams.origin && (
                  <Badge variant="secondary" size="md">
                    ✈️ Origin: {extractedParams.origin}
                  </Badge>
                )}
                {extractedParams.durationDays && (
                  <Badge variant="accent" size="md">
                    ⏱️ {extractedParams.durationDays} Days
                  </Badge>
                )}
                {extractedParams.travelersCount && (
                  <Badge variant="neutral" size="md">
                    👥 {extractedParams.travelersCount} Traveler(s)
                  </Badge>
                )}
                {extractedParams.budget && (
                  <Badge variant="emerald" size="md">
                    💰 Budget: {extractedParams.currency || '₹'}
                    {extractedParams.budget.toLocaleString()}
                  </Badge>
                )}
              </div>
            </Card>
          )}

          {/* Generated Trip Blueprint Preview */}
          {generatedTrip ? (
            <Card className="p-6 bg-slate-900 text-white border border-slate-800 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Trip Blueprint Synthesized
                </span>
                <Badge variant="accent" size="sm">
                  {generatedTrip.destination?.name}
                </Badge>
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-black">{generatedTrip.title}</h3>
                <p className="text-xs text-slate-400">
                  Origin: {generatedTrip.origin?.name || 'Ahmedabad'} · Duration:{' '}
                  {generatedTrip.dates?.durationDays} Days
                </p>
              </div>

              {/* Itinerary Days Breakdown with Authentic Activity Photos */}
              {generatedItinerary && (
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                    Day-by-Day Itinerary Blueprint:
                  </span>
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {generatedItinerary.days?.map((day) => {
                      const firstAct = day.activities?.[0] || {};
                      const destRaw = generatedTrip.destinations?.[0]?.name || generatedTrip.destination?.name || 'Bangalore';
                      const cleanDest = cleanDestinationName(destRaw);
                      const actImg = getAuthenticActivityImage(firstAct, day, day.dayNumber, cleanDest);

                      const cleanTheme = (day.theme || `Day ${day.dayNumber}`).replace(/Plan \d+ days in/gi, '').trim();
                      const cleanActivity = (firstAct.activity || day.summary || 'Explore regional landmarks & local dining').replace(/Plan \d+ days in/gi, '').trim();
                      const cleanLocation = cleanDestinationName(firstAct.location || cleanDest);

                      return (
                        <div
                          key={day.dayNumber}
                          className="rounded-2xl bg-slate-800/80 border border-slate-700/80 overflow-hidden shadow-lg space-y-0 flex flex-col sm:flex-row"
                        >
                          <img
                            src={actImg}
                            alt={cleanTheme}
                            className="w-full sm:w-36 h-32 sm:h-auto object-cover shrink-0"
                          />
                          <div className="p-3.5 flex-1 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-secondary-400">
                                Day {day.dayNumber}: {cleanTheme}
                              </span>
                              <span className="text-[11px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/50">
                                ₹{day.estimatedDayCost?.toLocaleString() || '1,500'}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-200 font-medium leading-relaxed">
                              {cleanActivity}
                            </p>

                            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                              <span className="px-2 py-0.5 rounded-full bg-slate-700/80 text-slate-300 font-semibold flex items-center gap-1">
                                📍 {cleanLocation}
                              </span>
                              {firstAct.transportModeToNext && (
                                <span className="px-2 py-0.5 rounded-full bg-secondary-900/60 text-secondary-300 font-semibold border border-secondary-700/50">
                                  🚗 {firstAct.transportModeToNext}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <Button
                variant="accent"
                size="lg"
                icon={Eye}
                onClick={handleSaveOrViewTrip}
                className="w-full bg-gradient-to-r from-secondary-600 to-amber-600 hover:from-secondary-500 hover:to-amber-500 text-white font-black text-sm shadow-xl"
              >
                {isAuthenticated ? 'Open Full Trip Workspace ➔' : 'Sign In to Save Blueprint ➔'}
              </Button>
            </Card>
          ) : (
            <Card className="p-8 text-center space-y-3 bg-slate-50 dark:bg-slate-900 border-dashed border-2 border-slate-200 dark:border-slate-800">
              <Compass className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No Trip Blueprint Generated Yet
              </h4>
              <p className="text-xs text-slate-500">
                Type a travel query or click a quick prompt preset above to start synthesizing!
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiPlanner;
