import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/common/Modal';
import LoadingState from '../../components/common/LoadingState';
import { Users, Search, Shield, UserX, UserCheck, Trash2, SlidersHorizontal } from 'lucide-react';
import adminService from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

const AdminUsers = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deletingUser, setDeletingUser] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchUsersList = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (roleFilter !== 'ALL') params.role = roleFilter;
      if (statusFilter !== 'ALL') params.isActive = statusFilter === 'ACTIVE';

      const res = await adminService.getUsers(params);
      if (res && res.success) {
        setUsers(res.data.users || []);
      }
    } catch (err) {
      showToast('Failed to load user accounts', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersList();
  }, [search, roleFilter, statusFilter]);

  const handleToggleRole = async (user) => {
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      await adminService.updateUserRole(user._id, newRole);
      showToast(`Role for ${user.name || user.email} updated to ${newRole}`, 'success');
      fetchUsersList();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update user role', 'error');
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      await adminService.toggleUserStatus(user._id);
      showToast(
        `User account ${user.isActive ? 'deactivated' : 'reactivated'} successfully`,
        'info'
      );
      fetchUsersList();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to change user status', 'error');
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setIsProcessing(true);
    try {
      await adminService.deleteUser(deletingUser._id);
      showToast('User account deleted permanently', 'success');
      setDeletingUser(null);
      fetchUsersList();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete user account', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">
            User Accounts Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
            Manage user accounts, administrative privileges, and account active statuses
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            placeholder="Search by name or email..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            label="Role Filter"
            options={['ALL', 'USER', 'ADMIN']}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          />
          <Select
            label="Account Status"
            options={['ALL', 'ACTIVE', 'DEACTIVATED']}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </Card>

      <Card className="p-6">
        {isLoading ? (
          <LoadingState message="Loading registered user accounts..." />
        ) : users.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Users className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-700 dark:text-slate-300">No Users Found</h3>
            <p className="text-xs text-slate-400">Try adjusting your search or role filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="pb-3 px-2">User Profile</th>
                  <th className="pb-3 px-2">Email</th>
                  <th className="pb-3 px-2">Role</th>
                  <th className="pb-3 px-2">Status</th>
                  <th className="pb-3 px-2">Joined</th>
                  <th className="pb-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3.5 px-2">
                      <div className="flex items-center gap-3">
                        {u.avatar || u.profileImage ? (
                          <img
                            src={u.avatar || u.profileImage}
                            alt={u.name}
                            className="w-9 h-9 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold">
                            {(u.firstName || u.name || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                            {u.name || `${u.firstName || ''} ${u.lastName || ''}`}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {u._id}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-2 font-medium text-slate-700 dark:text-slate-300">
                      {u.email}
                    </td>

                    <td className="py-3.5 px-2">
                      <button
                        onClick={() => handleToggleRole(u)}
                        title="Click to toggle USER / ADMIN role"
                        className="cursor-pointer"
                      >
                        <Badge
                          variant={u.role === 'ADMIN' ? 'accent' : 'secondary'}
                          size="sm"
                          className="hover:scale-105 transition"
                        >
                          {u.role === 'ADMIN' ? '🛡️ ADMIN' : '👤 USER'}
                        </Badge>
                      </button>
                    </td>

                    <td className="py-3.5 px-2">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition ${
                          u.isActive
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </button>
                    </td>

                    <td className="py-3.5 px-2 text-slate-400 font-medium">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-2 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title={u.isActive ? 'Deactivate Account' : 'Reactivate Account'}
                        >
                          {u.isActive ? <UserX className="w-4 h-4 text-amber-500" /> : <UserCheck className="w-4 h-4 text-emerald-500" />}
                        </button>
                        <button
                          onClick={() => setDeletingUser(u)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800"
                          title="Delete User Account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={Boolean(deletingUser)}
        onClose={() => setDeletingUser(null)}
        title="Confirm User Account Deletion"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 py-2 text-sm text-slate-600 dark:text-slate-300">
          <p>
            Are you sure you want to delete user <strong>{deletingUser?.name || deletingUser?.email}</strong>?
          </p>
          <p className="text-xs text-rose-500">
            This action is permanent and will remove all login permissions for this account.
          </p>
          <div className="pt-2 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="md" onClick={() => setDeletingUser(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="md" isLoading={isProcessing} onClick={handleDeleteUser}>
              Delete Account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminUsers;
