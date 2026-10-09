import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Sparkles,
  MapPin,
  Clock,
  Tag,
  Eye,
  RefreshCw,
} from 'lucide-react';
import useAttractions from '../../hooks/useAttractions';
import useDestinations from '../../hooks/useDestinations';
import attractionService from '../../services/attractionService';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import { ATTRACTION_CATEGORIES, ATTRACTION_TYPES } from '../../constants/attractionConstants';

const AdminAttractions = () => {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDestination, setSelectedDestination] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [page, setPage] = useState(1);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedAttraction, setSelectedAttraction] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Destinations for select dropdown
  const { destinations } = useDestinations({ limit: 100 });

  // Custom hook for attractions
  const { attractions, pagination, loading, error, refetch, updateFilters } = useAttractions({
    search: searchTerm,
    destination: selectedDestination,
    category: selectedCategory === 'All' ? '' : selectedCategory,
    page,
    limit: 10,
  });

  // Form State
  const initialFormState = {
    name: '',
    destination: '',
    shortDescription: '',
    description: '',
    category: 'Landmark',
    type: 'Tourist Attraction',
    coverImage: '',
    images: '',
    tags: '',
    ticketPriceAmount: 0,
    isFree: true,
    minMinutes: 60,
    maxMinutes: 180,
    latitude: '',
    longitude: '',
    address: '',
    area: '',
    facilities: '',
    accessibility: 'Wheelchair Accessible',
    safetyInformation: '',
    travelTips: '',
    isFeatured: false,
    isActive: true,
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    updateFilters({
      search: searchTerm,
      destination: selectedDestination,
      category: selectedCategory === 'All' ? '' : selectedCategory,
      page,
    });
  }, [searchTerm, selectedDestination, selectedCategory, page]);

  const handleOpenAddModal = () => {
    setSelectedAttraction(null);
    setFormData({
      ...initialFormState,
      destination: destinations?.[0]?._id || '',
    });
    setIsFormOpen(true);
  };

  const handleOpenEditModal = (attraction) => {
    setSelectedAttraction(attraction);
    setFormData({
      name: attraction.name || '',
      destination: attraction.destination?._id || attraction.destination || '',
      shortDescription: attraction.shortDescription || '',
      description: attraction.description || '',
      category: attraction.category || 'Landmark',
      type: attraction.type || 'Tourist Attraction',
      coverImage: attraction.coverImage || '',
      images: (attraction.images || []).join(', '),
      tags: (attraction.tags || []).join(', '),
      ticketPriceAmount: attraction.ticketPrice?.amount || 0,
      isFree: attraction.ticketPrice?.isFree ?? (attraction.ticketPrice?.amount === 0),
      minMinutes: attraction.estimatedVisitDuration?.minMinutes || 60,
      maxMinutes: attraction.estimatedVisitDuration?.maxMinutes || 180,
      latitude: attraction.location?.latitude || '',
      longitude: attraction.location?.longitude || '',
      address: attraction.location?.address || '',
      area: attraction.location?.area || '',
      facilities: (attraction.facilities || []).join(', '),
      accessibility: attraction.accessibility || 'Wheelchair Accessible',
      safetyInformation: attraction.safetyInformation || '',
      travelTips: (attraction.travelTips || []).join('\n'),
      isFeatured: attraction.isFeatured || false,
      isActive: attraction.isActive ?? true,
    });
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        name: formData.name,
        destination: formData.destination,
        shortDescription: formData.shortDescription,
        description: formData.description,
        category: formData.category,
        type: formData.type,
        coverImage: formData.coverImage,
        images: formData.images.split(',').map((s) => s.trim()).filter(Boolean),
        tags: formData.tags.split(',').map((s) => s.trim()).filter(Boolean),
        ticketPrice: {
          amount: Number(formData.ticketPriceAmount) || 0,
          isFree: formData.isFree || Number(formData.ticketPriceAmount) === 0,
          adult: Number(formData.ticketPriceAmount) || 0,
        },
        estimatedVisitDuration: {
          minMinutes: Number(formData.minMinutes) || 60,
          maxMinutes: Number(formData.maxMinutes) || 180,
        },
        location: {
          latitude: formData.latitude ? Number(formData.latitude) : undefined,
          longitude: formData.longitude ? Number(formData.longitude) : undefined,
          address: formData.address,
          area: formData.area,
        },
        facilities: formData.facilities.split(',').map((s) => s.trim()).filter(Boolean),
        accessibility: formData.accessibility,
        safetyInformation: formData.safetyInformation,
        travelTips: formData.travelTips.split('\n').map((s) => s.trim()).filter(Boolean),
        isFeatured: formData.isFeatured,
        isActive: formData.isActive,
      };

      if (selectedAttraction) {
        await attractionService.updateAttraction(selectedAttraction._id, payload);
        showToast('Attraction updated successfully', 'success');
      } else {
        await attractionService.createAttraction(payload);
        showToast('Attraction created successfully', 'success');
      }

      setIsFormOpen(false);
      refetch();
    } catch (err) {
      console.error('Error saving attraction:', err);
      showToast(err.response?.data?.message || 'Failed to save attraction', 'error');
    } flex: {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (attraction) => {
    try {
      await attractionService.toggleStatus(attraction._id);
      showToast(`Attraction status set to ${!attraction.isActive ? 'Active' : 'Inactive'}`, 'info');
      refetch();
    } catch (err) {
      showToast('Failed to toggle status', 'error');
    }
  };

  const handleToggleFeatured = async (attraction) => {
    try {
      await attractionService.toggleFeatured(attraction._id);
      showToast(`Featured status updated for ${attraction.name}`, 'info');
      refetch();
    } catch (err) {
      showToast('Failed to toggle featured state', 'error');
    }
  };

  const handleDelete = async () => {
    if (!selectedAttraction) return;
    try {
      setSubmitting(true);
      await attractionService.deleteAttraction(selectedAttraction._id);
      showToast('Attraction deleted successfully', 'success');
      setIsDeleteOpen(false);
      refetch();
    } catch (err) {
      showToast('Failed to delete attraction', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Attraction Management</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Add, edit, deactivate, or feature tourist places and activities.
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={handleOpenAddModal}>
          Add Attraction
        </Button>
      </div>

      {/* Filter & Controls Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        <div className="sm:col-span-5">
          <Input
            placeholder="Search attractions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={Search}
            clearable
            onClear={() => setSearchTerm('')}
          />
        </div>

        <div className="sm:col-span-4">
          <Select
            value={selectedDestination}
            onChange={(e) => setSelectedDestination(e.target.value)}
            options={[
              { value: 'all', label: 'All Destinations' },
              ...(destinations || []).map((d) => ({ value: d._id, label: `${d.name}, ${d.state}` })),
            ]}
          />
        </div>

        <div className="sm:col-span-3">
          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            options={ATTRACTION_CATEGORIES.map((c) => ({ value: c, label: c }))}
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">Attraction</th>
                <th className="p-3">Destination</th>
                <th className="p-3">Category</th>
                <th className="p-3">Price</th>
                <th className="p-3">Duration</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Featured</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400">Loading attractions...</td>
                </tr>
              ) : attractions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400">No attractions found.</td>
                </tr>
              ) : (
                attractions.map((attraction) => (
                  <tr key={attraction._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={attraction.coverImage}
                          alt={attraction.name}
                          className="w-10 h-10 rounded-lg object-cover bg-slate-100 dark:bg-slate-900"
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white line-clamp-1">{attraction.name}</div>
                          <div className="text-[11px] text-slate-400 line-clamp-1">{attraction.shortDescription}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3 font-medium">
                      {attraction.destination?.name || 'N/A'}
                    </td>

                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                        {attraction.category}
                      </span>
                    </td>

                    <td className="p-3 font-mono">
                      {attraction.ticketPrice?.isFree ? 'Free' : `₹${attraction.ticketPrice?.amount}`}
                    </td>

                    <td className="p-3">
                      {Math.round(attraction.estimatedVisitDuration?.minMinutes / 60)}–{Math.round(attraction.estimatedVisitDuration?.maxMinutes / 60)} hrs
                    </td>

                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleToggleStatus(attraction)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          attraction.isActive
                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                        }`}
                      >
                        {attraction.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {attraction.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>

                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleToggleFeatured(attraction)}
                        className={`p-1 rounded-full transition-colors ${
                          attraction.isFeatured ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/30' : 'text-slate-300 dark:text-slate-600'
                        }`}
                      >
                        <Sparkles className="w-4 h-4 fill-current" />
                      </button>
                    </td>

                    <td className="p-3 text-right space-x-1">
                      <button
                        onClick={() => window.open(`/explore/attractions/${attraction.slug}`, '_blank')}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(attraction)}
                        className="p-1.5 text-primary-600 hover:text-primary-700 dark:text-secondary-400"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedAttraction(attraction);
                          setIsDeleteOpen(true);
                        }}
                        className="p-1.5 text-red-500 hover:text-red-700"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-center">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Create / Edit Modal Form */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedAttraction ? 'Edit Attraction' : 'Add New Attraction'}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Attraction Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Taj Mahal"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Destination *</label>
              <Select
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                options={(destinations || []).map((d) => ({ value: d._id, label: `${d.name} (${d.state})` }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Category *</label>
              <Select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                options={ATTRACTION_CATEGORIES.filter((c) => c !== 'All').map((c) => ({ value: c, label: c }))}
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Attraction Type</label>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                options={ATTRACTION_TYPES.filter((t) => t !== 'All').map((t) => ({ value: t, label: t }))}
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Short Description *</label>
            <Input
              value={formData.shortDescription}
              onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
              placeholder="One line summary for attraction cards..."
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Detailed Description *</label>
            <textarea
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              rows="4"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Full attraction description..."
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Cover Image URL *</label>
              <Input
                value={formData.coverImage}
                onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                placeholder="https://..."
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Gallery Images (comma separated)</label>
              <Input
                value={formData.images}
                onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                placeholder="url1, url2..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ticket Amount (₹)</label>
              <Input
                type="number"
                value={formData.ticketPriceAmount}
                onChange={(e) => setFormData({ ...formData, ticketPriceAmount: e.target.value })}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Min Visit (Minutes)</label>
              <Input
                type="number"
                value={formData.minMinutes}
                onChange={(e) => setFormData({ ...formData, minMinutes: e.target.value })}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Max Visit (Minutes)</label>
              <Input
                type="number"
                value={formData.maxMinutes}
                onChange={(e) => setFormData({ ...formData, maxMinutes: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Latitude (-90 to 90)</label>
              <Input
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                placeholder="e.g. 15.5557"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Longitude (-180 to 180)</label>
              <Input
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                placeholder="e.g. 73.7517"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Address</label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Full street address..."
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Area / Locality</label>
              <Input
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                placeholder="e.g. North Goa"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tags (comma separated)</label>
            <Input
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="Must Visit, Photography, History..."
            />
          </div>

          <div className="flex gap-6 items-center pt-2">
            <label className="flex items-center gap-2 cursor-pointer font-semibold">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="rounded text-primary-600 focus:ring-primary-500"
              />
              <span>Mark as Featured</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-semibold">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded text-primary-600 focus:ring-primary-500"
              />
              <span>Active</span>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submitting}>
              {selectedAttraction ? 'Save Changes' : 'Create Attraction'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Confirm Deletion"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Are you sure you want to delete <strong>{selectedAttraction?.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete} loading={submitting}>
              Delete Attraction
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminAttractions;
