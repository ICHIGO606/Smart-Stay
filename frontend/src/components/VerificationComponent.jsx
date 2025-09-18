import { useState } from 'react';
import userService from '../services/userService';

const VerificationComponent = ({ user, onVerificationUpdate }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type and size
      const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!validTypes.includes(file.type)) {
        setError('Please upload a JPEG, PNG, or PDF file');
        return;
      }

      if (file.size > maxSize) {
        setError('File size must be less than 5MB');
        return;
      }

      setSelectedFile(file);
      setError('');
      setMessage('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setError('');
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('document', selectedFile);

      const response = await userService.uploadVerification(formData);
      
      if (response.success) {
        setMessage('Verification document uploaded successfully! Your verification status is now pending.');
        setSelectedFile(null);
        // Reset file input
        document.getElementById('verification-file').value = '';
        
        // Notify parent component to refresh user data
        if (onVerificationUpdate) {
          onVerificationUpdate();
        }
      } else {
        setError(response.message || 'Upload failed');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during upload');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Unverified': { color: 'bg-red-100 text-red-800', text: 'Not Verified' },
      'Pending': { color: 'bg-yellow-100 text-yellow-800', text: 'Pending Review' },
      'Verified': { color: 'bg-green-100 text-green-800', text: 'Verified' },
      'Rejected': { color: 'bg-red-100 text-red-800', text: 'Rejected' }
    };

    const config = statusConfig[status] || statusConfig['Unverified'];
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold text-primary mb-4">ID Verification</h2>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">Current Status:</p>
        {getStatusBadge(user?.verification?.status || 'Unverified')}
      </div>

      {user?.verification?.status === 'Rejected' && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <p className="text-sm text-red-800">
            Your verification was rejected. Please upload a clearer document and try again.
          </p>
        </div>
      )}

      {user?.verification?.status !== 'Verified' && (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload ID Document
            </label>
            <input
              id="verification-file"
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-white hover:file:bg-accent/90"
              disabled={uploading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Accepted formats: JPG, PNG, PDF (max 5MB)
            </p>
          </div>

          {selectedFile && (
            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-700">
                Selected file: <strong>{selectedFile.name}</strong>
              </p>
              <p className="text-xs text-gray-500">
                Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">{message}</p>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="bg-accent hover:bg-accent/90 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-md transition-colors"
          >
            {uploading ? 'Uploading...' : 'Upload Document'}
          </button>
        </>
      )}

      {user?.verification?.status === 'Verified' && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <p className="text-sm text-green-800">
            ✓ Your account has been successfully verified. You now have access to all features.
          </p>
        </div>
      )}
    </div>
  );
};

export default VerificationComponent;