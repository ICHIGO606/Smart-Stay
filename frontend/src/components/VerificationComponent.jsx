import { useState } from "react";
import userService from "../services/userService";
import { ShieldCheck, Upload, AlertCircle, Check } from "lucide-react";

const VerificationComponent = ({ user, onVerificationUpdate }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/png", "application/pdf"];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!validTypes.includes(file.type)) {
        setError("Please upload a JPEG, PNG, or PDF file");
        return;
      }

      if (file.size > maxSize) {
        setError("File size must be under 5MB");
        return;
      }

      setSelectedFile(file);
      setError("");
      setMessage("");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a document file to proceed");
      return;
    }

    setUploading(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("document", selectedFile);

      const response = await userService.uploadVerification(formData);

      if (response.success) {
        setMessage(
          "Verification document uploaded. Status is now pending operator review.",
        );
        setSelectedFile(null);
        const fileInput = document.getElementById("verification-file");
        if (fileInput) fileInput.value = "";

        if (onVerificationUpdate) {
          onVerificationUpdate();
        }
      } else {
        setError(response.message || "Upload failed");
      }
    } catch (err) {
      setError(err.message || "An error occurred during upload");
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const renderStatus = (status) => {
    switch (status) {
      case "Verified":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-tag text-xs font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            <span>Verified guest</span>
          </span>
        );
      case "Pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-tag text-xs font-mono bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
            <span>Pending operator review</span>
          </span>
        );
      case "Rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-tag text-xs font-mono bg-red-50 text-red-800 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
            <span>Document rejected</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-tag text-xs font-mono bg-stone-100 text-stone-700 border border-stone-200">
            <span className="w-1.5 h-1.5 rounded-full bg-stone-400"></span>
            <span>Unverified</span>
          </span>
        );
    }
  };

  const status = user?.verification?.status || "Unverified";

  return (
    <div className="card-base p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 gap-2">
        <div>
          <h2 className="text-sm font-semibold text-ink-primary">
            Identity verification
          </h2>
          <p className="text-xs text-ink-muted">
            Government ID verification for seamless check-in
          </p>
        </div>
        <div>{renderStatus(status)}</div>
      </div>

      {status === "Rejected" && (
        <div className="p-3.5 rounded-control bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
          <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
          <span>
            The previously uploaded document could not be verified. Please
            upload a clear passport or driver's license scan.
          </span>
        </div>
      )}

      {status !== "Verified" && (
        <div className="space-y-4 max-w-lg">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1.5">
              Upload passport or national ID (JPG, PNG, PDF up to 5MB)
            </label>
            <input
              id="verification-file"
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleFileChange}
              className="block w-full text-xs text-ink-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded-control file:border file:border-stone-300 file:text-xs file:font-mono file:bg-white file:text-ink-primary hover:file:bg-stone-50 cursor-pointer"
              disabled={uploading}
            />
          </div>

          {selectedFile && (
            <div className="p-3 bg-stone-50 rounded-control border border-stone-200 text-xs font-mono">
              <span className="text-ink-primary font-medium">
                {selectedFile.name}
              </span>
              <span className="text-ink-muted ml-2">
                ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-control bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="p-3 rounded-control bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <Check size={14} className="flex-shrink-0" />
              <span>{message}</span>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="btn-primary !text-xs !py-2 !px-4 inline-flex items-center gap-1.5 font-mono uppercase tracking-wider"
          >
            <Upload size={13} />
            <span>{uploading ? "Uploading..." : "Submit document"}</span>
          </button>
        </div>
      )}

      {status === "Verified" && (
        <div className="p-4 rounded-control bg-stone-50 border border-stone-200/80 flex items-start gap-3">
          <ShieldCheck
            size={18}
            className="text-emerald-700 mt-0.5 flex-shrink-0"
          />
          <div className="text-xs">
            <p className="font-medium text-ink-primary">Identity verified</p>
            <p className="text-ink-muted mt-0.5">
              Your identity documents are securely recorded. Direct hotel
              check-in is enabled across all cataloged properties.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationComponent;
