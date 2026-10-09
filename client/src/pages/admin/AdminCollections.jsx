import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Modal from '../../components/common/Modal';
import LoadingState from '../../components/common/LoadingState';
import { Plus, Edit, Trash2, Layers, Search, Sparkles } from 'lucide-react';
import adminService from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

const CATEGORIES = [
  'Weekend Getaways',
  'Romantic Escapes',
  'Adventure Treks',
  'Luxury Retreats',
  'Budget Explorations',
  'Cultural Heritage',
  'Beach & Islands',
  'Family Holidays',
];

const emptyCollection = {
  title: '',
  subtitle: '',
  description: '',
  coverImage: '',
  category: 'Weekend Getaways',
  tags: '',
  isFeatured: false,
};

const AdminCollections = () => {
  const { showToast } = useToast();
  const [collections, setCollections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyCollection);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);
  const [search, setSearch] = useState('');

  const fetchCollections = async () => {
    try {
      const res = await adminService.getCollections();
      if (res && res.success) {
        setCollections(res.data || []);
      }
    } catch (err) {
      showToast('Failed to load travel collections', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData(emptyCollection);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (col) => {
    setEditingId(col._id);
    setFormData({
      title: col.title || '',
      subtitle: col.subtitle || '',
      description: col.description || '',
      coverImage: col.coverImage || '',
      category: col.category || 'Weekend Getaways',
      tags: Array.isArray(col.tags) ? col.tags.join(', ') : '',
      isFeatured: Boolean(col.isFeatured),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const payload = {
      ...formData,
      tags: typeof formData.tags === 'string' ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    };

    try {
      if (editingId) {
        await adminService.updateCollection(editingId, payload);
        showToast('Collection updated successfully! ✨', 'success');
      } else {
        await adminService.createCollection(payload);
        showToast('New travel collection created! ✨', 'success');
      }
      setIsModalOpen(false);
      fetchCollections();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving collection', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      await adminService.deleteCollection(deletingItem._id);
      showToast('Collection deleted successfully', 'info');
      setDeletingItem(null);
      fetchCollections();
    } catch (err) {
      showToast('Failed to delete collection', 'error');
    }
  };

  const filteredCollections = collections.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">
            Travel Collections
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
            Curate themes, weekend packages, and recommended travel collections for users
          </p>
        </div>
        <Button variant="primary" size="md" icon={Plus} onClick={handleOpenAdd}>
          Create Collection
        </Button>
      </div>

      <Card className="p-6">
        <div className="max-w-md">
          <Input
            placeholder="Search collections by title or category..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Card>

      <Card className="p-6">
        {isLoading ? (
          <LoadingState message="Loading travel collections..." />
        ) : filteredCollections.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Layers className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-700 dark:text-slate-300">No Travel Collections Found</h3>
            <p className="text-xs text-slate-400">Click "Create Collection" to build a new travel collection theme.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCollections.map((col) => (
              <div
                key={col._id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44">
                    <img src={col.coverImage} alt={col.title} className="w-full h-full object-cover" />
                    <div className="absolute top-3 right-3 flex gap-2">
                      <Badge variant="secondary" size="sm">{col.category}</Badge>
                      {col.isFeatured && <Badge variant="warning" size="sm">★ Featured</Badge>}
                    </div>
                  </div>
                  <div className="p-5 space-y-2">
                    <h3 className="font-black text-base text-slate-900 dark:text-white">{col.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{col.description || col.subtitle}</p>
                  </div>
                </div>

                <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-semibold">
                    {col.tags?.length || 0} tags attached
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(col)}
                      className="p-1.5 rounded-lg text-secondary-600 hover:bg-secondary-50 dark:hover:bg-slate-800"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingItem(col)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Travel Collection' : 'Create Travel Collection'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <Input
            label="Collection Title *"
            placeholder="e.g. Coastal Serenity & Beach Escapes"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <Input
            label="Subtitle"
            placeholder="e.g. Discover handpicked seaside retreats"
            value={formData.subtitle}
            onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
          />

          <Select
            label="Category *"
            options={CATEGORIES}
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          />

          <Input
            label="Cover Image URL *"
            placeholder="https://images.unsplash.com/..."
            value={formData.coverImage}
            onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
            required
          />

          <Textarea
            label="Description"
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <Input
            label="Tags (Comma-separated)"
            placeholder="Beach, Luxury, Sunset, Couples"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          />

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isFeatured"
              checked={formData.isFeatured}
              onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
              className="rounded text-amber-500 focus:ring-amber-500"
            />
            <label htmlFor="isFeatured" className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Mark as Featured Collection
            </label>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="md" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
              {editingId ? 'Save Changes' : 'Create Collection'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE MODAL */}
      <Modal
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        title="Delete Collection"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 py-2 text-sm text-slate-600 dark:text-slate-300">
          <p>Are you sure you want to delete collection <strong>{deletingItem?.title}</strong>?</p>
          <div className="pt-2 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="md" onClick={() => setDeletingItem(null)}>Cancel</Button>
            <Button variant="danger" size="md" onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminCollections;
