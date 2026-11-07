import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { getAllPackages, deletePackage } from '../../services/adminPackageService';
import { formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';
import { Plus, Edit3, Trash2, Package } from 'lucide-react';
import ConfirmModal from '../../components/common/ConfirmModal';

const PackageListPage = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState(null);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await getAllPackages();
      setPackages(response?.data?.data || []);
    } catch (error) {
      toast.error('Failed to fetch packages');
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (pkg) => {
    setPackageToDelete(pkg);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!packageToDelete) return;

    try {
      await deletePackage(packageToDelete._id);
      toast.success('Package deleted successfully');
      setPackages((prev) => prev.filter((p) => p._id !== packageToDelete._id));
    } catch (error) {
      toast.error('Failed to delete package');
      console.error('Error deleting package:', error);
    } finally {
      setShowDeleteModal(false);
      setPackageToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between pb-6 border-b border-stone-200/80 gap-3">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
            Itinerary management
          </p>
          <h1 className="font-serif text-3xl text-ink-primary font-normal">
            Curated travel packages
          </h1>
        </div>

        <Link
          to="/admin/packages/new"
          className="btn-primary !text-xs !py-1.5 !px-3 inline-flex items-center gap-1.5"
        >
          <Plus size={13} />
          <span>New package</span>
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center h-64 gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-900 border-t-transparent"></div>
          <p className="text-xs font-mono text-ink-muted">Reading package ledger...</p>
        </div>
      ) : packages.length === 0 ? (
        <div className="card-base text-center py-16 px-6">
          <Package size={24} className="text-stone-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-ink-primary">No travel packages cataloged</p>
          <p className="text-xs text-ink-muted mt-1 mb-4">Create your first multi-day route and lodging itinerary.</p>
          <Link
            to="/admin/packages/new"
            className="btn-primary !text-xs !py-1.5 !px-3 inline-flex items-center gap-1.5"
          >
            <Plus size={13} />
            <span>Create package</span>
          </Link>
        </div>
      ) : (
        <div className="card-base overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200/80 bg-stone-50/60 text-[10px] font-mono uppercase tracking-wider text-ink-muted">
                  <th className="px-5 py-3">Package title</th>
                  <th className="px-5 py-3">Duration</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {packages.map((pkg) => (
                  <tr key={pkg._id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {pkg.images && pkg.images.length > 0 ? (
                          <img
                            src={pkg.images[0]}
                            alt={pkg.name}
                            className="w-10 h-10 object-cover rounded-control flex-shrink-0 bg-stone-100"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-control bg-stone-100 flex items-center justify-center text-[10px] font-mono text-ink-muted">
                            DOC
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-ink-primary">{pkg.name}</div>
                          <div className="text-[11px] font-mono text-ink-muted truncate max-w-xs">
                            {pkg.destinations?.join(', ') || 'No destinations cataloged'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-ink-secondary tabular-nums">
                      {pkg.duration?.days || 0}D / {pkg.duration?.nights || 0}N
                    </td>
                    <td className="px-5 py-3.5 font-mono font-medium text-ink-primary tabular-nums">
                      {formatCurrency(pkg.price)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-tag text-xs font-mono ${
                        pkg.isActive !== false
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-stone-100 text-stone-600 border border-stone-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${pkg.isActive !== false ? 'bg-emerald-600' : 'bg-stone-400'}`}></span>
                        <span>{pkg.isActive !== false ? 'Active' : 'Archived'}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/admin/packages/edit/${pkg._id}`}
                          className="text-stone-500 hover:text-stone-900 p-1.5 rounded-control transition-colors"
                          title="Edit package"
                        >
                          <Edit3 size={14} />
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(pkg)}
                          className="text-stone-400 hover:text-red-700 p-1.5 rounded-control transition-colors"
                          title="Delete package"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
          title="Delete package"
          message={`Are you sure you want to remove "${packageToDelete?.name}" from the active travel catalog?`}
          confirmText="Delete"
        />
      )}
    </div>
  );
};

export default PackageListPage;
