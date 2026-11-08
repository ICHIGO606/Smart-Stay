import { useState } from "react";
import { ArrowLeft, AlertCircle } from "lucide-react";

const HotelForm = ({ onSubmit, onCancel, initialData }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    city: initialData?.city || "",
    description: initialData?.description || "",
    address: initialData?.address || "",
    amenities: initialData?.amenities || [],
    images: [],
  });

  const [selectedImages, setSelectedImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const amenitiesOptions = [
    "WiFi",
    "Pool",
    "Parking",
    "Restaurant",
    "Gym",
    "Spa",
    "Air Conditioning",
    "Breakfast",
    "Bar",
    "Room Service",
    "Business Center",
    "Pet Friendly",
    "Swimming Pool",
    "Fitness Center",
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAmenityChange = (amenity) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages(files);
    setFormData((prev) => ({
      ...prev,
      images: files,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-stone-200/80">
        <button
          onClick={onCancel}
          className="btn-secondary !text-xs !py-1.5 !px-2.5 inline-flex items-center gap-1"
        >
          <ArrowLeft size={13} />
          <span>Back</span>
        </button>
        <div>
          <h2 className="font-serif text-2xl text-ink-primary font-normal">
            {initialData ? "Edit hotel dossier" : "Add new hotel property"}
          </h2>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-control bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
          <AlertCircle size={14} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card-base p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
              Property name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="input-base"
              placeholder="e.g. Villa Beatrice Heritage Suites"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
              City or municipality *
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              required
              className="input-base"
              placeholder="e.g. Florence"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
            Street address *
          </label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            required
            className="input-base"
            placeholder="e.g. Via Santo Spirito 14"
          />
        </div>

        <div>
          <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
            Architectural & service description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
            rows={4}
            className="input-base resize-none"
            placeholder="Describe the architectural history, materials, room acoustic properties, and guest amenities..."
          />
        </div>

        <div>
          <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-2">
            Cataloged amenities
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {amenitiesOptions.map((amenity) => (
              <label
                key={amenity}
                className={`flex items-center gap-2 p-2 rounded-control border text-xs cursor-pointer transition-colors ${
                  formData.amenities.includes(amenity)
                    ? "border-stone-900 bg-stone-50 font-medium text-ink-primary"
                    : "border-stone-200 text-ink-secondary hover:border-stone-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.amenities.includes(amenity)}
                  onChange={() => handleAmenityChange(amenity)}
                  className="rounded border-stone-300 text-stone-900 focus:ring-0"
                />
                <span>{amenity}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
            Property photography
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-xs text-ink-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded-control file:border file:border-stone-300 file:text-xs file:font-mono file:bg-white file:text-ink-primary hover:file:bg-stone-50 cursor-pointer"
          />
          {selectedImages.length > 0 && (
            <p className="text-[11px] font-mono text-ink-muted mt-1 tabular-nums">
              {selectedImages.length} image file(s) selected for upload
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary !text-xs !py-2 !px-4"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary !text-xs !py-2 !px-5 font-mono uppercase tracking-wider"
          >
            {loading
              ? "Submitting to ledger..."
              : initialData
                ? "Update hotel"
                : "Create hotel"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default HotelForm;
