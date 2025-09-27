import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import adminService from "../../services/adminService";

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
          Array.isArray(response.data?.data) ? response.data.data : []
        );
      } else if (activeTab === "verified") {
        const response = await adminService.getVerifiedUsers();
        setVerifiedUsers(Array.isArray(response.data?.data) ? response.data.data : []);
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

      // Refresh data
      await fetchVerificationData();
      setSelectedUser(null);
    } catch (err) {
      setError(err.message || "Failed to update verification status");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      Verified: "bg-green-100 text-green-800",
      Pending: "bg-yellow-100 text-yellow-800",
      Rejected: "bg-red-100 text-red-800",
      Unverified: "bg-gray-100 text-gray-800",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          statusClasses[status] || statusClasses.Unverified
        }`}
      >
        {status}
      </span>
    );
  };

  const renderUserCard = (userData, showActions = false) => (
    <div key={userData._id} className="bg-white rounded-lg shadow-md p-6 mb-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-primary">
            {userData.fullName}
          </h3>
          <p className="text-gray-600">{userData.email}</p>
          <p className="text-sm text-gray-500">
            Age: {userData.age || "N/A"} • {userData.gender || "N/A"}
          </p>
        </div>
        {getStatusBadge(userData.verification?.status)}
      </div>

      {userData.verification?.documentUrl && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Verification Document:
          </p>
          <a
            href={userData.verification.documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            View Document
          </a>
        </div>
      )}

      {showActions && (
        <div className="flex space-x-3">
          <button
            onClick={() => handleVerification(userData._id, "Verified")}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
          >
            Approve
          </button>
          <button
            onClick={() => {
              const remarks = prompt("Please provide reason for rejection:");
              if (remarks !== null) {
                handleVerification(userData._id, "Rejected", remarks);
              }
            }}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
          >
            Reject
          </button>
          <button
            onClick={() => viewUserDetails(userData._id)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            View Details
          </button>
        </div>
      )}

      {userData.verification?.verifiedBy && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Verified by: {userData.verification.verifiedBy?.fullName || "Admin"}
            {userData.verification.verifiedAt && (
              <>
                {" "}
                on{" "}
                {new Date(
                  userData.verification.verifiedAt
                ).toLocaleDateString()}
              </>
            )}
          </p>
          {userData.verification.remarks && (
            <p className="text-sm text-gray-600 mt-1">
              Remarks: {userData.verification.remarks}
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
            <h2 className="text-2xl font-bold text-primary mb-6">
              Pending Verifications
            </h2>
            {!pendingVerifications || pendingVerifications.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600">
                  No pending verification requests
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
            <h2 className="text-2xl font-bold text-primary mb-6">
              Verified Users
            </h2>
            {!verifiedUsers || verifiedUsers.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600">No verified users yet</p>
              </div>
            ) : (
              verifiedUsers.map((user) => renderUserCard(user))
            )}
          </div>
        );

      case "stats":
        return (
          <div>
            <h2 className="text-2xl font-bold text-primary mb-6">
              Verification Statistics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <h3 className="text-3xl font-bold text-primary">
                  {stats.total || 0}
                </h3>
                <p className="text-gray-600">Total Users</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <h3 className="text-3xl font-bold text-green-600">
                  {stats.verified || 0}
                </h3>
                <p className="text-gray-600">Verified</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <h3 className="text-3xl font-bold text-yellow-600">
                  {stats.pending || 0}
                </h3>
                <p className="text-gray-600">Pending</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <h3 className="text-3xl font-bold text-red-600">
                  {stats.rejected || 0}
                </h3>
                <p className="text-gray-600">Rejected</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading && !pendingVerifications.length && !verifiedUsers.length) {
    return (
      <div className="p-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">
          User Verification Management
        </h1>
        <div className="text-sm text-gray-600">
          Logged in as: {user?.fullName}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {["pending", "verified", "stats"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-4 font-medium text-sm ${
                activeTab === tab
                  ? "border-b-2 border-accent text-accent"
                  : "text-gray-500 hover:text-gray-700"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">User Details</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <strong>Name:</strong> {selectedUser.fullName}
              </div>
              <div>
                <strong>Email:</strong> {selectedUser.email}
              </div>
              <div>
                <strong>Age:</strong> {selectedUser.age || "Not provided"}
              </div>
              <div>
                <strong>Gender:</strong> {selectedUser.gender || "Not provided"}
              </div>
              <div>
                <strong>Status:</strong>{" "}
                {getStatusBadge(selectedUser.verification?.status)}
              </div>

              {selectedUser.verification?.documentUrl && (
                <div>
                  <strong>Document:</strong>
                  <a
                    href={selectedUser.verification.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    View Document
                  </a>
                </div>
              )}

              {selectedUser.familyMembers &&
                selectedUser.familyMembers.length > 0 && (
                  <div>
                    <strong>Family Members:</strong>
                    <div className="mt-2 space-y-2">
                      {selectedUser.familyMembers.map((member) => (
                        <div
                          key={member._id}
                          className="bg-gray-50 p-3 rounded"
                        >
                          <p>
                            <strong>Name:</strong> {member.fullName}
                          </p>
                          <p>
                            <strong>Relationship:</strong> {member.relationship}
                          </p>
                          <p>
                            <strong>Age:</strong> {member.age}
                          </p>
                          {member.verification && (
                            <p>
                              <strong>Status:</strong>{" "}
                              {getStatusBadge(member.verification.status)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            {selectedUser.verification?.status === "Pending" && (
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() =>
                    handleVerification(selectedUser._id, "Verified")
                  }
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={() => {
                    const remarks = prompt(
                      "Please provide reason for rejection:"
                    );
                    if (remarks !== null) {
                      handleVerification(selectedUser._id, "Rejected", remarks);
                    }
                  }}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
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
