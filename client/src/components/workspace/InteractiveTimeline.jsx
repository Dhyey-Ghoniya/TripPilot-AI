import React, { useState } from 'react';
import {
  Clock,
  MapPin,
  Tag,
  DollarSign,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Edit3,
  MoveRight,
  Info,
  Navigation,
} from 'lucide-react';
import Card from '../common/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Modal from '../common/Modal';

const CATEGORY_COLORS = {
  Sightseeing: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
  Dining: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  Cultural: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  Shopping: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  Relaxation: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  Adventure: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
};

const InteractiveTimeline = ({
  itinerary,
  selectedDay,
  onSelectDay,
  onAddActivity,
  onDeleteActivity,
  onReorderActivities,
  onRegenerateDay,
  onRegenerateItinerary,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newActivityForm, setNewActivityForm] = useState({
    time: '10:00 AM',
    timeSlot: 'morning',
    activity: '',
    location: '',
    durationMinutes: 90,
    estimatedCost: 500,
    category: 'Sightseeing',
    notes: '',
  });

  const days = itinerary?.days || [];
  const currentDayObj = days.find((d) => d.dayNumber === selectedDay) || days[0];

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newActivityForm.activity) return;
    onAddActivity(selectedDay, newActivityForm);
    setIsAddModalOpen(false);
    setNewActivityForm({
      time: '10:00 AM',
      timeSlot: 'morning',
      activity: '',
      location: '',
      durationMinutes: 90,
      estimatedCost: 500,
      category: 'Sightseeing',
      notes: '',
    });
  };

  const moveActivityPosition = (currentIndex, direction) => {
    if (!currentDayObj || !currentDayObj.activities) return;
    const activities = [...currentDayObj.activities];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= activities.length) return;

    // Swap items
    const temp = activities[currentIndex];
    activities[currentIndex] = activities[targetIndex];
    activities[targetIndex] = temp;

    const orderedIds = activities.map((a) => a._id);
    onReorderActivities(selectedDay, orderedIds);
  };

  return (
    <div className="space-y-6">
      {/* Day Picker & Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        {/* Day Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          {days.map((d) => {
            const isSelected = d.dayNumber === selectedDay;
            return (
              <button
                key={d.dayNumber}
                onClick={() => onSelectDay(d.dayNumber)}
                className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-secondary-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>Day {d.dayNumber}</span>
                <span className="text-[10px] opacity-80">({d.activities?.length || 0})</span>
              </button>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={() => onRegenerateDay(selectedDay)}
          >
            Regenerate Day {selectedDay}
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Activity
          </Button>
        </div>
      </div>

      {/* Selected Day Theme Banner */}
      {currentDayObj && (
        <Card className="p-4 bg-gradient-to-r from-primary-950 via-slate-900 to-primary-900 text-white border-none flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary-400 block">
              Day {currentDayObj.dayNumber} Focus
            </span>
            <h3 className="text-lg font-black">{currentDayObj.title || `Day ${currentDayObj.dayNumber}`}</h3>
            <p className="text-xs text-slate-300 mt-0.5">{currentDayObj.summary}</p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Estimated Cost</span>
            <span className="text-base font-black text-emerald-400">
              ₹{(currentDayObj.estimatedDayCost || 0).toLocaleString()}
            </span>
          </div>
        </Card>
      )}

      {/* Vertical Interactive Timeline */}
      {!currentDayObj?.activities || currentDayObj.activities.length === 0 ? (
        <Card className="p-10 text-center space-y-3 border-dashed border-2 border-slate-300 dark:border-slate-700">
          <Clock className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            No activities scheduled for Day {selectedDay}
          </h4>
          <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsAddModalOpen(true)}>
            Add First Activity
          </Button>
        </Card>
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {currentDayObj.activities.map((item, index) => {
            const categoryStyle =
              CATEGORY_COLORS[item.category] ||
              'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200';

            return (
              <div key={item._id || index} className="relative group">
                {/* Node Timeline Marker */}
                <div className="absolute -left-6 sm:-left-8 top-4 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-2 border-secondary-500 text-secondary-600 flex items-center justify-center shadow-md">
                  <div className="w-2 h-2 rounded-full bg-secondary-500" />
                </div>

                <Card className="p-5 space-y-3 hover:shadow-lg transition border border-slate-200/80 dark:border-slate-800">
                  {/* Top Bar: Time, Category Badge, Reorder & Delete */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900 dark:text-white px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-secondary-500" />
                        {item.time || '10:00 AM'}
                      </span>
                      <span className="text-xs text-slate-500 font-semibold">
                        ({item.durationMinutes || 90} mins)
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${categoryStyle}`}
                      >
                        {item.category || item.timeSlot || 'Sightseeing'}
                      </span>
                    </div>

                    {/* Reorder & Action Controls */}
                    <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition">
                      <button
                        onClick={() => moveActivityPosition(index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 disabled:opacity-30"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveActivityPosition(index, 'down')}
                        disabled={index === currentDayObj.activities.length - 1}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 disabled:opacity-30"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteActivity(selectedDay, item._id)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 transition"
                        title="Delete Activity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Location */}
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      {item.activity}
                    </h4>
                    {item.location && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-secondary-500" />
                        {item.location}
                      </p>
                    )}
                  </div>

                  {/* Metrics Footer (Cost, Distance, Travel Time) */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" />
                        ₹{(item.estimatedCost || 0).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1 text-[11px]">
                        <Navigation className="w-3 h-3 text-sky-500" />
                        Next Transit: {item.transportModeToNext || 'Taxi'} ({item.transportDurationMinutes || 15} mins)
                      </span>
                    </div>

                    {item.notes && (
                      <span className="text-[11px] text-slate-400 italic">
                        Note: {item.notes}
                      </span>
                    )}
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD ACTIVITY MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={`Add Activity to Day ${selectedDay}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Activity Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Visit Burj Khalifa Observation Deck"
              value={newActivityForm.activity}
              onChange={(e) => setNewActivityForm({ ...newActivityForm, activity: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Start Time
              </label>
              <input
                type="text"
                placeholder="10:00 AM"
                value={newActivityForm.time}
                onChange={(e) => setNewActivityForm({ ...newActivityForm, time: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Duration (Mins)
              </label>
              <input
                type="number"
                value={newActivityForm.durationMinutes}
                onChange={(e) => setNewActivityForm({ ...newActivityForm, durationMinutes: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Location / Neighborhood
            </label>
            <input
              type="text"
              placeholder="Downtown Dubai"
              value={newActivityForm.location}
              onChange={(e) => setNewActivityForm({ ...newActivityForm, location: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={newActivityForm.category}
                onChange={(e) => setNewActivityForm({ ...newActivityForm, category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="Sightseeing">Sightseeing</option>
                <option value="Dining">Dining</option>
                <option value="Cultural">Cultural</option>
                <option value="Shopping">Shopping</option>
                <option value="Relaxation">Relaxation</option>
                <option value="Adventure">Adventure</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Estimated Cost (₹)
              </label>
              <input
                type="number"
                value={newActivityForm.estimatedCost}
                onChange={(e) => setNewActivityForm({ ...newActivityForm, estimatedCost: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Add to Schedule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InteractiveTimeline;
