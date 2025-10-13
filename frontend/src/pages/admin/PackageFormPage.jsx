import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getPackageById, createPackage, updatePackage } from '../../services/adminPackageService';
// AdminLayout is provided by the parent route
import Spinner from '../../components/common/Spinner';
import { FaPlus, FaTrash } from 'react-icons/fa';

const PackageFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    destinations: [''],
    duration: {
      days: '',
      nights: ''
    },
    price: '',
    images: [],
    imageFiles: [],
    imagePreviews: [],
    itinerary: [{ day: 1, title: '', description: '' }]
  });

  useEffect(() => {
    if (isEditMode) {
      fetchPackageDetails();
    }
  }, [id]);

  const fetchPackageDetails = async () => {
    try {
      setLoading(true);
      const response = await getPackageById(id);
      const packageData = response.data;
      
      setFormData({
        name: packageData.name || '',
        description: packageData.description || '',
        destinations: packageData.destinations?.length ? packageData.destinations : [''],
        duration: packageData.duration || { days: '', nights: '' },
        price: packageData.price || '',
        images: packageData.images || [],
        imageFiles: [],
        imagePreviews: packageData.images || [],
        itinerary: packageData.itinerary?.length ? packageData.itinerary : [{ day: 1, title: '', description: '' }]
      });
    } catch (error) {
      toast.error('Failed to fetch package details');
      console.error('Error fetching package:', error);
      navigate('/admin/packages');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle nested objects like duration.days
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImageFiles = [...formData.imageFiles];
      const newImagePreviews = [...formData.imagePreviews];
      
      Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        
        reader.onloadend = () => {
          newImageFiles.push(file);
          newImagePreviews.push(reader.result);
          
          setFormData({
            ...formData,
            imageFiles: newImageFiles,
            imagePreviews: newImagePreviews
          });
        };
        
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveImage = (index) => {
    const newImageFiles = [...formData.imageFiles];
    const newImagePreviews = [...formData.imagePreviews];
    
    newImageFiles.splice(index, 1);
    newImagePreviews.splice(index, 1);
    
    setFormData({
      ...formData,
      imageFiles: newImageFiles,
      imagePreviews: newImagePreviews
    });
  };

  const handleDestinationChange = (index, value) => {
    const updatedDestinations = [...formData.destinations];
    updatedDestinations[index] = value;
    setFormData({ ...formData, destinations: updatedDestinations });
  };

  const addDestination = () => {
    setFormData({ ...formData, destinations: [...formData.destinations, ''] });
  };

  const removeDestination = (index) => {
    if (formData.destinations.length > 1) {
      const updatedDestinations = formData.destinations.filter((_, i) => i !== index);
      setFormData({ ...formData, destinations: updatedDestinations });
    }
  };
  
  const handleItineraryChange = (index, field, value) => {
    const updatedItinerary = [...formData.itinerary];
    updatedItinerary[index] = {
      ...updatedItinerary[index],
      [field]: value
    };
    setFormData({
      ...formData,
      itinerary: updatedItinerary
    });
  };
  
  const addItineraryItem = () => {
    const newDay = formData.itinerary.length + 1;
    setFormData({
      ...formData,
      itinerary: [
        ...formData.itinerary,
        { day: newDay, title: '', description: '' }
      ]
    });
  };
  
  const removeItineraryItem = (index) => {
    if (formData.itinerary.length > 1) {
      const updatedItinerary = [...formData.itinerary];
      updatedItinerary.splice(index, 1);
      
      // Renumber days
      const renumberedItinerary = updatedItinerary.map((item, idx) => ({
        ...item,
        day: idx + 1
      }));
      
      setFormData({
        ...formData,
        itinerary: renumberedItinerary
      });
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    setSubmitting(true);

    // Upload images first (pseudo example - depends on your service)
    let uploadedImageUrls = formData.images; // keep existing images if editing
    if (formData.imageFiles.length > 0) {
      // Example: using a helper that uploads files and returns an array of URLs
      const uploaded = await Promise.all(
        formData.imageFiles.map(file => uploadImageToCloudinary(file))
      );
      uploadedImageUrls = [...uploadedImageUrls, ...uploaded];
    }

    const payload = {
      name: formData.name,
      description: formData.description,
      destinations: formData.destinations.filter(d => d.trim() !== ''),
      duration: {
        days: parseInt(formData.duration.days),
        nights: parseInt(formData.duration.nights)
      },
      price: parseFloat(formData.price),
      images: uploadedImageUrls,   // ✅ send URLs only
      itinerary: formData.itinerary
    };

    let response;
    if (isEditMode) {
      response = await updatePackage(id, payload);
      toast.success('Package updated successfully');
    } else {
      response = await createPackage(payload);
      toast.success('Package created successfully');
    }

    navigate('/admin/packages');
  } catch (err) {
    console.error('Error saving package:', err);
    toast.error(isEditMode ? 'Failed to update package' : 'Failed to create package');
  } finally {
    setSubmitting(false);
  }
};



  if (loading) {
    return (
      <div className="flex justify-center items-center h-full py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {isEditMode ? 'Edit Package' : 'Create New Package'}
      </h1>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
              <div className="space-y-4 md:col-span-2">
                <h2 className="text-lg font-semibold border-b pb-2">Basic Information</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Package Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                    required
                  ></textarea>
                </div>
              </div>
              
              {/* Package Details */}
              <div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (USD) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (Days) *
                    </label>
                    <input
                      type="number"
                      name="duration.days"
                      value={formData.duration.days}
                      onChange={handleChange}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (Nights) *
                    </label>
                    <input
                      type="number"
                      name="duration.nights"
                      value={formData.duration.nights}
                      onChange={handleChange}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                      required
                    />
                  </div>
                </div>
              </div>
              
              {/* Destinations */}
              <div className="md:col-span-2">
                <h2 className="text-lg font-semibold border-b pb-2 mb-4">Destinations *</h2>
                {formData.destinations.map((destination, index) => (
                  <div key={`destination-${index}`} className="flex items-center mb-2">
                    <input
                      type="text"
                      value={destination}
                      onChange={(e) => handleDestinationChange(index, e.target.value)}
                      className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                      placeholder="E.g., Paris, Rome, etc."
                    />
                    <button
                      type="button"
                      onClick={() => removeDestination(index)}
                      className="ml-2 text-red-500 hover:text-red-700"
                      disabled={formData.destinations.length <= 1}
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addDestination}
                  className="mt-2 flex items-center text-primary hover:text-primary-dark"
                >
                  <FaPlus className="mr-1" /> Add Destination
                </button>
              </div>
              
              {/* Images */}
              <div className="md:col-span-2">
                <h2 className="text-lg font-semibold border-b pb-2 mb-4">Package Images</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {formData.imagePreviews.map((preview, index) => (
                    <div key={`image-${index}`} className="relative">
                      <img
                        src={preview}
                        alt={`Package image ${index + 1}`}
                        className="h-32 w-full object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Add Images
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
              
              {/* Itinerary */}
              <div className="md:col-span-2">
                <h2 className="text-lg font-semibold border-b pb-2 mb-4">Itinerary *</h2>
                {formData.itinerary.map((item, index) => (
                  <div key={`itinerary-${index}`} className="mb-4 p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">Day {item.day}</h4>
                      <button
                        type="button"
                        onClick={() => removeItineraryItem(index)}
                        className="text-red-500 hover:text-red-700"
                        disabled={formData.itinerary.length <= 1}
                      >
                        <FaTrash />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title *
                        </label>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => handleItineraryChange(index, 'title', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description *
                        </label>
                        <textarea
                          value={item.description}
                          onChange={(e) => handleItineraryChange(index, 'description', e.target.value)}
                          rows="3"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                          required
                        ></textarea>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addItineraryItem}
                  className="mt-2 flex items-center text-primary hover:text-primary-dark"
                >
                  <FaPlus className="mr-1" /> Add Day
                </button>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/admin/packages')}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                disabled={submitting}
              >
                {submitting ? (
                  <span className="flex items-center">
                    <Spinner size="sm" className="mr-2" />
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </span>
                ) : (
                  <span>{isEditMode ? 'Update Package' : 'Create Package'}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
  );
};

export default PackageFormPage;