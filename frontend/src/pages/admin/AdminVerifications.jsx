import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import adminService from "../../services/adminService";
import {
  ShieldCheck,
  Check,
  X,
  FileText,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

const AdminVerifications = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("pending");
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [verifiedUsers, setVerifiedUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchVerificationData();
  }, [activeTab]);

  const fetchVerificationData = async () => {
    try {
      setLoading(true);

      if (activeTab === "pending") {
        const response = await adminService.getPendingVerifications();
        setPendingVerifications(
          Array.isArray(response.data?.data) ? response.data.data : [],
        );
      } else if (activeTab === "verified") {
        const response = await adminService.getVerifiedUsers();
        setVerifiedUsers(
          Array.isArray(response.data?.data) ? response.data.data : [],
        );
      } else if (activeTab === "stats") {
        const response = await adminService.getVerificationStats();
        setStats(response.data?.data || {});
      }

      const statsResponse = await adminService.getVerificationStats();
      setStats(statsResponse.data?.data || {});
    } catch (err) {
      setError(err.message || "Failed to fetch verification data");
    } finally {
      setLoading(false);
    }
  };

  const viewUserDetails = async (userId) => {
    try {
      const response = await adminService.getUserVerification(userId);
      setSelectedUser(response.data?.data || response.data);
    } catch (err) {
      setError(err.message || "Failed to fetch user details");
    }
  };

  const handleVerification = async (userId, status, remarks = "") => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      await adminService.verifyUser(userId, { status, remarks });
      setSuccess(`User ${status.toLowerCase()} successfully`);

      await fetchVerificationData();
      setSelectedUser(null);
    } catch (err) {
      setError(err.message || "Failed to update verification status");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Verified":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-tag text-xs font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            <span>Verified</span>
          </span>
        );
      case "Pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-tag text-xs font-mono bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
            <span>Pending</span>
          </span>
        );
      case "Rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-tag text-xs font-mono bg-red-50 text-red-800 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
            <span>Rejected</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-tag text-xs font-mono bg-stone-100 text-stone-700">
            <span>{status || "Unverified"}</span>
          </span>
        );
    }
  };

  const renderUserCard = (userData, showActions = false) => (
    <div
      key={userData._id}
      className="card-base p-5 mb-4 hover:border-stone-300 transition-colors"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="tag-signature">
              № {userData._id ? userData._id.slice(-4).toUpperCase() : "USER"}
            </span>
            <h3 className="text-sm font-semibold text-ink-primary">
              {userData.fullName}
            </h3>
          </div>
          <p className="text-xs text-ink-muted font-mono">{userData.email}</p>
          <p className="text-[11px] text-ink-muted font-mono mt-0.5">
            Age:{" "}
            <span className="tabular-nums text-ink-secondary">
              {userData.age || "N/A"}
            </span>{" "}
            · Gender: {userData.gender || "N/A"}
          </p>
        </div>
        <div>{getStatusBadge(userData.verification?.status)}</div>
      </div>

      {userData.verification?.documentUrl && (
        <div className="mb-4 p-2.5 rounded-control bg-stone-50 border border-stone-200/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-ink-secondary">
            <FileText size={14} className="text-ink-muted" />
            <span>Document file on ledger</span>
          </div>
          <a
            href={userData.verification.documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-ink-primary hover:underline font-medium"
          >
            Open file ↗
          </a>
        </div>
      )}

      {showActions && (
        <div className="flex items-center gap-2 pt-3 border-t border-stone-100">
          <button
            onClick={() => handleVerification(userData._id, "Verified")}
            disabled={loading}
            className="btn-primary !text-xs !py-1.5 !px-3 inline-flex items-center gap-1"
          >
            <Check size={12} />
            <span>Approve ID</span>
          </button>
          <button
            onClick={() => {
              const remarks = prompt("Please provide reason for rejection:");
              if (remarks !== null) {
                handleVerification(userData._id, "Rejected", remarks);
              }
            }}
            disabled={loading}
            className="btn-secondary !text-xs !py-1.5 !px-3 text-red-700 hover:bg-red-50 hover:border-red-200"
          >
            <X size={12} />
            <span>Reject</span>
          </button>
          <button
            onClick={() => viewUserDetails(userData._id)}
            className="btn-secondary !text-xs !py-1.5 !px-3"
          >
            View details
          </button>
        </div>
      )}

      {userData.verification?.verifiedBy && (
        <div className="mt-3 pt-3 border-t border-stone-100 text-[11px] font-mono text-ink-muted">
          <span>
            Reviewed by:{" "}
            {userData.verification.verifiedBy?.fullName || "Operator"}
          </span>
          {userData.verification.verifiedAt && (
            <span>
              {" "}
              ·{" "}
              {new Date(userData.verification.verifiedAt).toLocaleDateString()}
            </span>
          )}
          {userData.verification.remarks && (
            <p className="mt-0.5 text-ink-secondary">
              Note: {userData.verification.remarks}
            </p>
          )}
        </div>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "pending":
        return (
          <div>
            {!pendingVerifications || pendingVerifications.length === 0 ? (
              <div className="card-base text-center py-12 px-6">
                <ShieldCheck
                  size={24}
                  className="text-stone-300 mx-auto mb-2"
                />
                <p className="text-xs font-mono text-ink-muted">
                  No pending identity verification requests.
                </p>
              </div>
            ) : (
              pendingVerifications.map((user) => renderUserCard(user, true))
            )}
          </div>
        );

      case "verified":
        return (
          <div>
            {!verifiedUsers || verifiedUsers.length === 0 ? (
              <div className="card-base text-center py-12 px-6">
                <p className="text-xs font-mono text-ink-muted">
                  No verified users currently recorded.
                </p>
              </div>
            ) : (
              verifiedUsers.map((user) => renderUserCard(user))
            )}
          </div>
        );

      case "stats":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card-base p-5">
              <span className="text-xs font-mono uppercase text-ink-muted block mb-1">
                Total users
              </span>
              <span className="text-3xl font-semibold text-ink-primary tabular-nums">
                {stats.total || 0}
              </span>
            </div>
            <div className="card-base p-5">
              <span className="text-xs font-mono uppercase text-ink-muted block mb-1">
                Verified
              </span>
              <span className="text-3xl font-semibold text-emerald-700 tabular-nums">
                {stats.verified || 0}
              </span>
            </div>
            <div className="card-base p-5">
              <span className="text-xs font-mono uppercase text-ink-muted block mb-1">
                Pending review
              </span>
              <span className="text-3xl font-semibold text-amber-700 tabular-nums">
                {stats.pending || 0}
              </span>
            </div>
            <div className="card-base p-5">
              <span className="text-xs font-mono uppercase text-ink-muted block mb-1">
                Rejected
              </span>
              <span className="text-3xl font-semibold text-red-700 tabular-nums">
                {stats.rejected || 0}
              </span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading && !pendingVerifications.length && !verifiedUsers.length) {
    return (
      <div className="p-8 flex flex-col justify-center items-center h-64 gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-900 border-t-transparent"></div>
        <p className="text-xs font-mono text-ink-muted">
          Loading verification queue...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between pb-6 border-b border-stone-200/80 gap-3">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
            Compliance & security
          </p>
          <h1 className="font-serif text-3xl text-ink-primary font-normal">
            ID verifications
          </h1>
        </div>
        <div className="text-xs font-mono text-ink-muted">
          Operator: {user?.fullName || user?.name || "Admin"}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-control bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-control bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <Check size={14} />
          <span>{success}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-stone-200">
        <nav className="flex space-x-6">
          {["pending", "verified", "stats"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-1 border-b-2 text-xs font-medium font-mono uppercase tracking-wider transition-colors ${
                activeTab === tab
                  ? "border-stone-900 text-ink-primary"
                  : "border-transparent text-ink-muted hover:text-ink-primary"
              }`}
            >
              {tab === "pending" && `Pending (${stats.pending || 0})`}
              {tab === "verified" && `Verified (${stats.verified || 0})`}
              {tab === "stats" && "Statistics"}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {renderTabContent()}

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="card-base p-6 max-w-xl w-full max-h-[85vh] overflow-y-auto shadow-elevated space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-stone-100">
              <h3 className="font-serif text-xl text-ink-primary">
                Guest verification profile
              </h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-ink-muted hover:text-ink-primary p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-ink-muted block uppercase text-[10px]">
                    Name
                  </span>
                  <span className="text-ink-primary font-medium">
                    {selectedUser.fullName}
                  </span>
                </div>
                <div>
                  <span className="text-ink-muted block uppercase text-[10px]">
                    Email
                  </span>
                  <span className="text-ink-primary font-medium">
                    {selectedUser.email}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-ink-muted block uppercase text-[10px] mb-1">
                  Status
                </span>
                {getStatusBadge(selectedUser.verification?.status)}
              </div>

              {selectedUser.verification?.documentUrl && (
                <div className="p-3 rounded-control bg-stone-50 border border-stone-200">
                  <span className="text-ink-muted block uppercase text-[10px] mb-1">
                    Document scan
                  </span>
                  <a
                    href={selectedUser.verification.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-ink-primary underline font-medium"
                  >
                    Open document in viewer ↗
                  </a>
                </div>
              )}
            </div>

            {selectedUser.verification?.status === "Pending" && (
              <div className="flex gap-2 pt-4 border-t border-stone-100">
                <button
                  onClick={() =>
                    handleVerification(selectedUser._id, "Verified")
                  }
                  disabled={loading}
                  className="btn-primary !text-xs !py-2 !px-4"
                >
                  Approve ID
                </button>
                <button
                  onClick={() => {
                    const remarks = prompt(
                      "Please provide reason for rejection:",
                    );
                    if (remarks !== null) {
                      handleVerification(selectedUser._id, "Rejected", remarks);
                    }
                  }}
                  disabled={loading}
                  className="btn-secondary !text-xs !py-2 !px-4 text-red-700"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVerifications;
