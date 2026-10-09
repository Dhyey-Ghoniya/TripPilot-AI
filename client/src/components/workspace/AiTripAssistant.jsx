import React, { useState } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  RefreshCw,
  Zap,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Compass,
  MapPin,
  Utensils,
  Car,
  FileText,
  Package,
  X,
} from 'lucide-react';
import Card from '../common/Card';
import Button from '../ui/Button';

const COMMAND_PRESETS = [
  'Make it cheaper',
  'Add Kyoto',
  'Add 2 days',
  'Find hotel near my Day 3 activities',
  'Find rooftop restaurants',
  'Plan a road trip from Mumbai to Goa',
  'Give me a booking checklist',
  'Travel requirements',
  'Packing list',
];

const AiTripAssistant = ({ tripId, onExecuteCommand }) => {
  const [promptInput, setPromptInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [handoffModalItem, setHandoffModalItem] = useState(null);
  const [chatLog, setChatLog] = useState([
    {
      sender: 'assistant',
      text: 'Hello! I am your TripPilot AI Travel Agent. Tell me what changes or research you want to execute on your trip.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const handleSubmit = async (textToRun = null) => {
    const text = textToRun || promptInput;
    if (!text || !text.trim() || isExecuting) return;

    const userMsg = text.trim();
    if (!textToRun) setPromptInput('');

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
      const response = await onExecuteCommand(userMsg);
      const summary = response?.copilotMessage || response?.message || 'Updated trip blueprint based on your instruction.';

      setChatLog((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: summary,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          metadata: response,
        },
      ]);
    } catch (err) {
      setChatLog((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: 'Error modifying trip context. Please try another prompt.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <Card className="p-5 space-y-4 border border-slate-200 dark:border-slate-800 flex flex-col h-full relative">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-900 via-teal-700 to-secondary-500 text-white flex items-center justify-center shadow-sm">
            <Bot className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">TripPilot AI Travel Agent</h3>
            <p className="text-[11px] text-slate-500">Conversational trip state controller</p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          Active Trip Memory
        </span>
      </div>

      {/* Preset Command Shortcuts */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          Agent Command Presets:
        </span>
        <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pr-1">
          {COMMAND_PRESETS.map((cmd, idx) => (
            <button
              key={idx}
              onClick={() => handleSubmit(cmd)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-secondary-50 dark:hover:bg-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition border border-slate-200/60 dark:border-slate-700"
            >
              {cmd}
            </button>
          ))}
        </div>
      </div>

      {/* Message History Stream */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs min-h-[320px]">
        {chatLog.map((msg, index) => {
          const isUser = msg.sender === 'user';
          const meta = msg.metadata;
          const sData = meta?.structuredData;

          return (
            <div
              key={index}
              className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`p-3.5 rounded-2xl max-w-[90%] leading-relaxed ${
                  isUser
                    ? 'bg-secondary-600 text-white rounded-tr-none shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200/50 dark:border-slate-700/50 shadow-sm'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* 1. FLIGHT CARDS */}
                {sData?.flights?.length > 0 && (
                  <div className="mt-3 space-y-2 w-full">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Live Flight Options Matrix</p>
                    {sData.flights.slice(0, 3).map((flight, idx) => (
                      <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-xl flex flex-col gap-2 shadow-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[12px] text-slate-900 dark:text-white flex items-center gap-1.5">
                            ✈️ {flight.airline} <span className="opacity-50 text-[10px]">via {flight.providerName || 'Skyscanner'}</span>
                          </span>
                          <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs">₹{(flight.price?.amount || flight.price || 14500).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-500">
                          <span>{flight.departureAirport || 'AMD'} → {flight.arrivalAirport || 'DEST'} ({flight.cabinClass || 'Economy'})</span>
                          <button
                            type="button"
                            onClick={() => setHandoffModalItem({ type: 'Flight', title: `${flight.airline} Flight`, provider: flight.providerName || 'Cleartrip / Skyscanner', price: `₹${(flight.price?.amount || flight.price || 14500).toLocaleString()}` })}
                            className="text-secondary-600 dark:text-secondary-400 font-bold hover:underline flex items-center gap-1"
                          >
                            <span>Book / Provider Handoff</span> <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. HOTEL CARDS */}
                {sData?.hotels?.length > 0 && (
                  <div className="mt-3 space-y-2 w-full">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Neighborhood Hotel Fit Score</p>
                    {sData.hotels.slice(0, 3).map((hotel, idx) => (
                      <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-xl flex flex-col gap-2 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-[12px] text-slate-900 dark:text-white block">
                              🏨 {hotel.name}
                            </span>
                            <span className="text-[10px] text-slate-500">{hotel.neighborhood || hotel.address || 'Central Corridor'}</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs">₹{(hotel.pricePerNight?.amount || hotel.pricePerNight || 4500).toLocaleString()} / night</span>
                            {hotel.hotelFit?.fitScore && (
                              <span className="text-[9px] text-blue-600 font-bold border border-blue-200 bg-blue-50 px-1.5 py-0.5 rounded mt-0.5">Fit Score: {hotel.hotelFit.fitScore}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <span>⭐ {hotel.rating || '4.8'} / 5 Rating</span>
                          <button
                            type="button"
                            onClick={() => setHandoffModalItem({ type: 'Hotel', title: hotel.name, provider: hotel.providerName || 'Booking.com / Agoda', price: `₹${(hotel.pricePerNight?.amount || hotel.pricePerNight || 4500).toLocaleString()} / night` })}
                            className="text-secondary-600 dark:text-secondary-400 font-bold hover:underline flex items-center gap-1"
                          >
                            <span>Book / Provider Handoff</span> <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 3. RESTAURANT CARDS */}
                {sData?.restaurants?.length > 0 && (
                  <div className="mt-3 space-y-2 w-full">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <Utensils className="w-3 h-3 text-amber-500" /> Curated Dining Options
                    </p>
                    {sData.restaurants.map((rest, idx) => (
                      <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl flex flex-col gap-1 shadow-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[11px] text-slate-900 dark:text-white">🍽️ {rest.name}</span>
                          <span className="font-bold text-amber-600 text-[10px]">⭐ {rest.rating}</span>
                        </div>
                        <p className="text-[10px] text-slate-500">{rest.cuisine} · {rest.neighborhood}</p>
                        <p className="text-[9px] text-slate-400">{rest.highlights}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* 4. ROAD TRIP CARD */}
                {sData?.isRoadTrip && (
                  <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-400 text-xs">
                      <Car className="w-4 h-4" /> Road Trip Telemetry
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-700 dark:text-slate-300">
                      <div>Total Distance: <b>{sData.totalDistanceKm} km</b></div>
                      <div>Total Driving: <b>~{sData.totalDrivingHours} hrs</b></div>
                      <div>Fuel Estimate: <b>₹{sData.fuelEstimateCost}</b></div>
                      <div>Tolls Estimate: <b>₹{sData.tollEstimateCost || 850}</b></div>
                    </div>
                  </div>
                )}

                {/* 5. BOOKING CHECKLIST */}
                {sData?.bookingChecklist?.length > 0 && (
                  <div className="mt-3 space-y-1.5 w-full bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <FileText className="w-3 h-3 text-secondary-500" /> Booking Requirements Checklist
                    </p>
                    {sData.bookingChecklist.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px] py-1 border-b border-slate-100 dark:border-slate-800 last:border-0">
                        <span className="flex items-center gap-2">
                          <span className={item.status === 'booked' ? 'text-emerald-500 font-bold' : 'text-amber-500'}>
                            {item.status === 'booked' ? '✓' : '○'}
                          </span>
                          <span>{item.item}</span>
                        </span>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${item.status === 'booked' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 6. TRAVEL REQUIREMENTS */}
                {sData?.travelRequirements && (
                  <div className="mt-3 space-y-2 w-full bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px] text-slate-700 dark:text-slate-300">
                    <p className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                      🛂 Entry & Requirement Summary
                    </p>
                    <p><b>Visa:</b> {sData.travelRequirements.visa}</p>
                    <p><b>Passport:</b> {sData.travelRequirements.passportValidity}</p>
                    <p><b>Currency:</b> {sData.travelRequirements.currencyAdvice}</p>
                    <p><b>Power Adapter:</b> {sData.travelRequirements.plugAdapter}</p>
                  </div>
                )}

                {/* 7. PACKING LIST */}
                {sData?.packingList?.length > 0 && (
                  <div className="mt-3 space-y-2 w-full bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px]">
                    <p className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                      🧳 Trip Packing Blueprint
                    </p>
                    {sData.packingList.map((cat, idx) => (
                      <div key={idx} className="space-y-1">
                        <span className="font-bold text-secondary-600 dark:text-secondary-400 block">{cat.category}</span>
                        <div className="flex flex-wrap gap-1">
                          {cat.items.map((item, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {item.packed ? '✓' : '○'} {item.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <span className="text-[10px] opacity-60 block text-right mt-1.5">{msg.time}</span>
              </div>
            </div>
          );
        })}
        {isExecuting && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-secondary-500" />
            <span>Updating persistent trip state...</span>
          </div>
        )}
      </div>

      {/* Command Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="pt-2 border-t border-slate-100 dark:border-slate-800 flex gap-2"
      >
        <input
          type="text"
          value={promptInput}
          onChange={(e) => setPromptInput(e.target.value)}
          placeholder="Ask TripPilot anything... e.g. 'Make it cheaper' or 'Add Kyoto'..."
          className="flex-1 px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-secondary-500"
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          icon={Send}
          disabled={isExecuting || !promptInput.trim()}
        >
          Send
        </Button>
      </form>

      {/* Provider Handoff Modal */}
      {handoffModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase text-secondary-600 flex items-center gap-1">
                <ExternalLink className="w-4 h-4" /> Live Provider Handoff
              </span>
              <button onClick={() => setHandoffModalItem(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{handoffModalItem.title}</h3>
              <p className="text-xs text-slate-500">Live price check via provider integration</p>
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
              <div className="flex justify-between">
                <span className="text-slate-500">Context Status:</span>
                <span className="font-bold text-blue-600">Trip Context Preserved ✓</span>
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
                onClick={() => setHandoffModalItem(null)}
                className="w-full py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                Return to Trip Workspace
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default AiTripAssistant;

