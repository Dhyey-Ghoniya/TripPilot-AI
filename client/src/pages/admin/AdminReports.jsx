import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Modal from '../../components/common/Modal';
import LoadingState from '../../components/common/LoadingState';
import { Flag, CheckCircle, XCircle, AlertTriangle, MessageSquare, ShieldAlert } from 'lucide-react';
import adminService from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

const AdminReports = () => {
  const { showToast } = useToast();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedReport, setSelectedReport] = useState(null);
  const [actionTaken, setActionTaken] = useState('NONE');
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const res = await adminService.getReports(params);
      if (res && res.success) {
        setReports(res.data || []);
      }
    } catch (err) {
      showToast('Failed to fetch reported content', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const handleOpenResolve = (report) => {
    setSelectedReport(report);
    setActionTaken(report.actionTaken || 'NONE');
    setAdminNotes(report.adminNotes || '');
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedReport) return;
    setIsSubmitting(true);
    try {
      await adminService.updateReportStatus(selectedReport._id, {
        status: newStatus,
        actionTaken,
        adminNotes,
      });
      showToast(`Report marked as ${newStatus}`, 'success');
      setSelectedReport(null);
      fetchReports();
    } catch (err) {
      showToast('Failed to update report status', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="warning" size="sm">Pending Review</Badge>;
      case 'RESOLVED':
        return <Badge variant="success" size="sm">Resolved</Badge>;
      case 'DISMISSED':
        return <Badge variant="neutral" size="sm">Dismissed</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">
            Reported Content Moderation
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
            Review user-submitted flags for reviews, journals, activities, and community contributions
          </p>
        </div>
        <div className="w-48">
          <Select
            label="Filter Status"
            options={['ALL', 'PENDING', 'RESOLVED', 'DISMISSED']}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </div>

      <Card className="p-6">
        {isLoading ? (
          <LoadingState message="Loading moderation queue..." />
        ) : reports.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Flag className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-700 dark:text-slate-300">No Reports Found</h3>
            <p className="text-xs text-slate-400">All community content is clean and unflagged.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="pb-3 px-2">Reported Item</th>
                  <th className="pb-3 px-2">Type</th>
                  <th className="pb-3 px-2">Reason</th>
                  <th className="pb-3 px-2">Reporter</th>
                  <th className="pb-3 px-2">Status</th>
                  <th className="pb-3 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {reports.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3.5 px-2">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{r.contentTitle}</h4>
                        <p className="text-[11px] text-slate-400 font-mono">ID: {r.contentId}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-2">
                      <Badge variant="secondary" size="sm">{r.contentType}</Badge>
                    </td>
                    <td className="py-3.5 px-2">
                      <span className="font-semibold text-rose-600 dark:text-rose-400">{r.reason}</span>
                    </td>
                    <td className="py-3.5 px-2 font-medium">
                      {r.reportedBy?.name || r.reporterEmail || 'Anonymous'}
                    </td>
                    <td className="py-3.5 px-2">{getStatusBadge(r.status)}</td>
                    <td className="py-3.5 px-2 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenResolve(r)}
                      >
                        Review Report
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* RESOLUTION MODAL */}
      <Modal
        isOpen={Boolean(selectedReport)}
        onClose={() => setSelectedReport(null)}
        title="Review & Resolve Flag"
        maxWidth="max-w-md"
      >
        {selectedReport && (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 space-y-2 border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between text-xs font-bold">
                <span>{selectedReport.contentType}: {selectedReport.contentTitle}</span>
                {getStatusBadge(selectedReport.status)}
              </div>
              <p className="text-xs text-rose-500 font-bold">Reason: {selectedReport.reason}</p>
              {selectedReport.details && (
                <p className="text-xs text-slate-600 dark:text-slate-400 italic">"{selectedReport.details}"</p>
              )}
            </div>

            <Select
              label="Action Taken"
              options={['NONE', 'CONTENT_REMOVED', 'USER_WARNED', 'USER_BANNED', 'DISMISSED']}
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
            />

            <Textarea
              label="Admin Resolution Notes"
              rows={3}
              placeholder="Internal resolution audit notes..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
            />

            <div className="pt-4 flex justify-between gap-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="md"
                onClick={() => handleUpdateStatus('DISMISSED')}
                isLoading={isSubmitting}
              >
                Dismiss Flag
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => handleUpdateStatus('RESOLVED')}
                isLoading={isSubmitting}
              >
                Resolve & Save Action
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminReports;
