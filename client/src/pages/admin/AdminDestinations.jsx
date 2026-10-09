import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Star,
  Eye,
  Check,
  X,
  MapPin,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Modal from '../../components/common/Modal';
import LoadingState from '../../components/common/LoadingState';
import DestinationCardSkeleton from '../../components/common/DestinationCardSkeleton';
import destinationService from '../../services/destinationService';
import { useToast } from '../../context/ToastContext';

const CATEGORY_OPTIONS = [
  'Beach',
  'Mountains',
  'Nature',
  'Adventure',
  'Historical',
  'Cultural',
  'Wildlife',
  'Religious',
  'Food',
  'Luxury',
  'Family',
  'Romantic',
  'Photography',
  'Shopping',
  'Relaxation',
];

const emptyDestinationForm = {
  name: '',
  state: '',
  city: '',
  country: 'India',
  shortDescription: '',
  description: '',
  coverImage: '',
  images: '',
  categories: ['Beach'],
  tags: 'Beach, Nature',
  minPerDay: 2500,
  maxPerDay: 5000,
  minDays: 3,
  maxDays: 5,
  climate: 'Tropical',
  travelTips: 'Carry valid ID.',
  isFeatured: false,
  isActive: true,
};

const AdminDestinations = () => {
  const { showToast } = useToast();

  const [destinations, setDestinations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyDestinationForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [deletingDestination, setDeletingDestination] = useState(null);

  const fetchAdminDestinations = async () => {
    setIsLoading(true);
    try {
      const response = await destinationService.getDestinations({
        search,
        category: selectedCategory,
        limit: 100,
      });
      if (response && response.success && response.data) {
        setDestinations(response.data.destinations || []);
      }
    } catch (err) {
      showToast('Failed to load admin destinations', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminDestinations();
  }, [search, selectedCategory]);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData(emptyDestinationForm);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (dest) => {
    setEditingId(dest._id || dest.id);
    setFormData({
      name: dest.name || '',
      state: dest.state || '',
      city: dest.city || '',
      country: dest.country || 'India',
      shortDescription: dest.shortDescription || '',
      description: dest.description || '',
      coverImage: dest.coverImage || '',
      images: Array.isArray(dest.images) ? dest.images.join(', ') : '',
      categories: dest.categories || ['Beach'],
      tags: Array.isArray(dest.tags) ? dest.tags.join(', ') : 'Beach',
      minPerDay: dest.estimatedBudget?.minPerDay || 2500,
      maxPerDay: dest.estimatedBudget?.maxPerDay || 5000,
      minDays: dest.averageDuration?.minDays || 3,
      maxDays: dest.averageDuration?.maxDays || 5,
      climate: dest.climate || 'Tropical',
      travelTips: Array.isArray(dest.travelTips) ? dest.travelTips.join('. ') : '',
      isFeatured: Boolean(dest.isFeatured),
      isActive: Boolean(dest.isActive),
    });
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      name: formData.name,
      state: formData.state,
      city: formData.city,
      country: formData.country,
      shortDescription: formData.shortDescription,
      description: formData.description,
      coverImage: formData.coverImage,
      images: typeof formData.images === 'string' ? formData.images.split(',').map((s) => s.trim()).filter(Boolean) : [],
      categories: Array.isArray(formData.categories) ? formData.categories : [formData.categories],
      tags: typeof formData.tags === 'string' ? formData.tags.split(',').map((s) => s.trim()).filter(Boolean) : [],
      estimatedBudget: {
        minPerDay: Number(formData.minPerDay),
        maxPerDay: Number(formData.maxPerDay),
        accommodation: { min: Math.round(formData.minPerDay * 0.4), max: Math.round(formData.maxPerDay * 0.5) },
        food: { min: Math.round(formData.minPerDay * 0.25), max: Math.round(formData.maxPerDay * 0.25) },
        localTransport: { min: Math.round(formData.minPerDay * 0.15), max: Math.round(formData.maxPerDay * 0.15) },
        activities: { min: Math.round(formData.minPerDay * 0.2), max: Math.round(formData.maxPerDay * 0.1) },
      },
      averageDuration: {
        minDays: Number(formData.minDays),
        maxDays: Number(formData.maxDays),
      },
      climate: formData.climate,
      travelTips: typeof formData.travelTips === 'string' ? formData.travelTips.split('.').map((s) => s.trim()).filter(Boolean) : [],
      isFeatured: formData.isFeatured,
      isActive: formData.isActive,
    };

    try {
      if (editingId) {
        await destinationService.updateDestination(editingId, payload);
        showToast('Destination updated successfully! ✨', 'success');
      } else {
        await destinationService.createDestination(payload);
        showToast('New destination added successfully! ✨', 'success');
      }
      setIsFormModalOpen(false);
      fetchAdminDestinations();
    } catch (err) {
      showToast(err.customMessage || 'Error saving destination', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (dest) => {
    const id = dest._id || dest.id;
    try {
      await destinationService.toggleStatus(id, !dest.isActive);
      setDestinations((prev) =>
        prev.map((d) => ((d._id || d.id) === id ? { ...d, isActive: !d.isActive } : d))
      );
      showToast(`Destination status updated to ${!dest.isActive ? 'Active' : 'Inactive'}`, 'info');
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const handleToggleFeatured = async (dest) => {
    const id = dest._id || dest.id;
    try {
      await destinationService.toggleFeatured(id, !dest.isFeatured);
      setDestinations((prev) =>
        prev.map((d) => ((d._id || d.id) === id ? { ...d, isFeatured: !d.isFeatured } : d))
      );
      showToast(`Destination ${!dest.isFeatured ? 'marked as Featured' : 'unfeatured'}`, 'info');
    } catch (err) {
      showToast('Failed to update featured status', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingDestination) return;
    const id = deletingDestination._id || deletingDestination.id;
    try {
      await destinationService.deleteDestination(id);
      showToast('Destination deleted successfully', 'success');
      setDeletingDestination(null);
      fetchAdminDestinations();
    } catch (err) {
      showToast('Failed to delete destination', 'error');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">
            Destination Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
            Manage travel locations, categories, pricing, active status, and featured spots
          </p>
        </div>
        <Button variant="primary" size="md" icon={Plus} onClick={handleOpenAddModal}>
          Add New Destination
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="sm:col-span-2">
            <Input
              placeholder="Search by name, city, or state..."
              icon={Search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            label="Category Filter"
            options={['All', ...CATEGORY_OPTIONS]}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          />
          <div className="flex items-end">
            <Button
              variant="outline"
              size="md"
              className="w-full"
              onClick={() => {
                setSearch('');
                setSelectedCategory('All');
              }}
            >
              Reset Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Data Table */}
      <Card className="p-6 overflow-hidden">
        {isLoading ? (
          <LoadingState message="Loading destination management records..." />
        ) : destinations.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <MapPin className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-700 dark:text-slate-300">No Destinations Found</h3>
            <p className="text-xs text-slate-400">Click "Add New Destination" to create your first entry.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="pb-3 px-2">Destination</th>
                  <th className="pb-3 px-2">Category</th>
                  <th className="pb-3 px-2">Daily Budget</th>
                  <th className="pb-3 px-2">Rating</th>
                  <th className="pb-3 px-2">Status</th>
                  <th className="pb-3 px-2">Featured</th>
                  <th className="pb-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {destinations.map((dest) => {
                  const id = dest._id || dest.id;
                  return (
                    <tr key={id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-3">
                          <img
                            src={dest.coverImage}
                            alt={dest.name}
                            className="w-12 h-12 rounded-xl object-cover"
                          />
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">{dest.name}</h4>
                            <p className="text-[11px] text-slate-400">
                              {dest.city}, {dest.state}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-2">
                        <Badge variant="secondary" size="sm">
                          {Array.isArray(dest.categories) ? dest.categories[0] : dest.category}
                        </Badge>
                      </td>

                      <td className="py-4 px-2 font-bold text-slate-800 dark:text-slate-200">
                        ₹{dest.estimatedBudget?.minPerDay?.toLocaleString() || 2500} – ₹
                        {dest.estimatedBudget?.maxPerDay?.toLocaleString() || 5000}
                      </td>

                      <td className="py-4 px-2 font-bold text-slate-800 dark:text-slate-200">
                        ⭐ {dest.rating || 4.5}
                      </td>

                      {/* Active Status Switch */}
                      <td className="py-4 px-2">
                        <button
                          onClick={() => handleToggleStatus(dest)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition ${
                            dest.isActive
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {dest.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>

                      {/* Featured Toggle Switch */}
                      <td className="py-4 px-2">
                        <button
                          onClick={() => handleToggleFeatured(dest)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition ${
                            dest.isFeatured
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {dest.isFeatured ? '★ Featured' : 'Standard'}
                        </button>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-4 px-2 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link to={`/destinations/${dest.slug}`}>
                            <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800" title="View Public Page">
                              <Eye className="w-4 h-4" />
                            </button>
                          </Link>
                          <button
                            onClick={() => handleOpenEditModal(dest)}
                            className="p-1.5 rounded-lg text-secondary-600 hover:bg-secondary-50 dark:hover:bg-slate-800"
                            title="Edit Destination"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingDestination(dest)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800"
                            title="Delete Destination"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ADD / EDIT MODAL FORM */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingId ? 'Edit Destination' : 'Add New Destination'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Destination Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label="City *"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="State *"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              required
            />
            <Input
              label="Country *"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              required
            />
          </div>

          <Input
            label="Short Description *"
            placeholder="Brief 1-sentence summary"
            value={formData.shortDescription}
            onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
            required
          />

          <Textarea
            label="Full Description *"
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />

          <Input
            label="Cover Image URL *"
            placeholder="https://images.unsplash.com/..."
            value={formData.coverImage}
            onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
            required
          />

          <Input
            label="Gallery Image URLs (Comma-separated)"
            placeholder="url1, url2, url3"
            value={formData.images}
            onChange={(e) => setFormData({ ...formData, images: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Primary Category *"
              options={CATEGORY_OPTIONS}
              value={Array.isArray(formData.categories) ? formData.categories[0] : formData.categories}
              onChange={(e) => setFormData({ ...formData, categories: [e.target.value] })}
            />
            <Input
              label="Tags (Comma-separated)"
              placeholder="Beaches, Nightlife, Water Sports"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Min Daily Budget (₹) *"
              type="number"
              value={formData.minPerDay}
              onChange={(e) => setFormData({ ...formData, minPerDay: e.target.value })}
              required
            />
            <Input
              label="Max Daily Budget (₹) *"
              type="number"
              value={formData.maxPerDay}
              onChange={(e) => setFormData({ ...formData, maxPerDay: e.target.value })}
              required
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="md" onClick={() => setIsFormModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
              {editingId ? 'Save Changes' : 'Create Destination'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={Boolean(deletingDestination)}
        onClose={() => setDeletingDestination(null)}
        title="Confirm Delete Destination"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 py-2 text-sm text-slate-600 dark:text-slate-300">
          <p>
            Are you sure you want to delete <strong>{deletingDestination?.name}</strong>?
          </p>
          <p className="text-xs text-rose-500">
            This action will permanently delete the destination record and remove it from public search results and user wishlists.
          </p>
          <div className="pt-2 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="md" onClick={() => setDeletingDestination(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="md" onClick={handleDeleteConfirm}>
              Delete Destination
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminDestinations;
