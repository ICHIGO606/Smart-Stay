import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllPackages, deletePackage } from '../../services/adminPackageService';
import toast from 'react-hot-toast';
// import AdminLayout from '../../layouts/AdminLayout';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import Spinner from '../../components/common/Spinner';
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
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Manage Packages</h1>
          <Link
            to="/admin/packages/new"
            className="bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-md flex items-center"
          >
            <FaPlus className="mr-2" /> Add New Package
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center my-12">
            <Spinner size="lg" />
          </div>
        ) : packages.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-600 mb-4">No packages found</p>
            <Link
              to="/admin/packages/new"
              className="bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-md inline-flex items-center"
            >
              <FaPlus className="mr-2" /> Create Your First Package
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Package
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {packages.map((pkg) => (
                    <tr key={pkg._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {pkg.images && pkg.images.length > 0 ? (
                            <img
                              className="h-10 w-10 rounded-md object-cover mr-3"
                              src={pkg.images[0]}
                              alt={pkg.name}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-md bg-gray-200 mr-3 flex items-center justify-center text-gray-500">
                              No img
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">{pkg.name}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {pkg.description?.substring(0, 60) || 'No description'}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {pkg.duration?.days || 0} Days / {pkg.duration?.nights || 0} Nights
                        </div>
                        {pkg.destinations && pkg.destinations.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {pkg.destinations.join(', ')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">₹{pkg.price?.toFixed(2) || '0.00'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800`}
                        >
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/admin/packages/edit/${pkg._id}`}
                          className="text-indigo-600 hover:text-indigo-900 mr-4 flex items-center"
                        >
                          <FaEdit className="inline mr-1" /> Edit
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(pkg)}
                          className="text-red-600 hover:text-red-900 flex items-center"
                        >
                          <FaTrash className="inline mr-1" /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
          title="Delete Package"
          message={`Are you sure you want to delete "${packageToDelete?.name}"? This action cannot be undone.`}
          confirmText="Delete"
          confirmButtonClass="bg-red-600 hover:bg-red-700"
        />
      </div>
    </>
  );
};

export default PackageListPage;
