import { useState, useEffect } from "react";
import userService from "../services/userService";
import { Users, Plus, Trash2, AlertCircle } from "lucide-react";

const FamilyMembers = () => {
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMemberData, setNewMemberData] = useState({
    fullName: "",
    age: "",
    relationship: "",
  });

  useEffect(() => {
    fetchFamilyMembers();
  }, []);

  const fetchFamilyMembers = async () => {
    try {
      setLoading(true);
      const response = await userService.getFamilyMembers();

      let members = [];
      if (Array.isArray(response)) {
        members = response;
      } else if (response && Array.isArray(response.data)) {
        members = response.data;
      } else if (response && response.familyMembers) {
        members = response.familyMembers;
      } else if (response && response.data && response.data.familyMembers) {
        members = response.data.familyMembers;
      } else if (response && typeof response === "object") {
        members = Object.values(response).filter(
          (item) =>
            item && typeof item === "object" && item.fullName !== undefined,
        );
      }

      setFamilyMembers(members);
    } catch (err) {
      setError("Failed to fetch registered guests");
      console.error("Error fetching family members:", err);
      setFamilyMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMemberData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddMember = async () => {
    try {
      const response = await userService.addFamilyMember({
        fullName: newMemberData.fullName,
        age: parseInt(newMemberData.age),
        relationship: newMemberData.relationship || "Family Member",
      });

      let newMember;
      if (response && response.data) {
        newMember = response.data;
      } else if (response && typeof response === "object") {
        newMember = response;
      } else {
        newMember = {
          _id: Date.now().toString(),
          fullName: newMemberData.fullName,
          age: parseInt(newMemberData.age),
          relationship: newMemberData.relationship || "Family Member",
          isVerified: false,
        };
      }

      setFamilyMembers((prev) => [...prev, newMember]);
      setNewMemberData({ fullName: "", age: "", relationship: "" });
      setShowAddForm(false);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to add guest member");
      console.error("Error adding family member:", err);
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (window.confirm("Remove this registered guest from your profile?")) {
      try {
        await userService.deleteFamilyMember(memberId);
        setFamilyMembers((prev) =>
          prev.filter((member) => member._id !== memberId),
        );
        setError("");
      } catch (err) {
        setError(err.message || "Failed to remove member");
        console.error("Error deleting family member:", err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-900 border-t-transparent"></div>
        <p className="text-xs font-mono text-ink-muted">
          Loading registered travelers...
        </p>
      </div>
    );
  }

  return (
    <div className="card-base p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 gap-2">
        <div>
          <h2 className="text-sm font-semibold text-ink-primary">
            Registered travelers
          </h2>
          <p className="text-xs text-ink-muted">
            Pre-fill guest rosters for expedited reservations
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="btn-primary !text-xs !py-1.5 !px-3 inline-flex items-center gap-1.5"
        >
          <Plus size={13} />
          <span>Add traveler</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-control bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
          <AlertCircle size={14} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {showAddForm && (
        <div className="p-4 rounded-control bg-stone-50 border border-stone-200/80 space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-wider text-ink-muted">
            New traveler record
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                Full name
              </label>
              <input
                type="text"
                name="fullName"
                value={newMemberData.fullName}
                onChange={handleInputChange}
                className="input-base"
                placeholder="Full name as on ID"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                Age
              </label>
              <input
                type="number"
                name="age"
                value={newMemberData.age}
                onChange={handleInputChange}
                className="input-base tabular-nums"
                placeholder="Age"
                min="1"
                max="120"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                Relationship
              </label>
              <input
                type="text"
                name="relationship"
                value={newMemberData.relationship}
                onChange={handleInputChange}
                className="input-base"
                placeholder="e.g. Spouse, Child, Parent"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleAddMember}
              disabled={!newMemberData.fullName || !newMemberData.age}
              className="btn-primary !text-xs !py-1.5 !px-3"
            >
              Save traveler
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="btn-secondary !text-xs !py-1.5 !px-3"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {familyMembers.length === 0 ? (
        <div className="text-center py-10">
          <Users size={22} className="text-stone-300 mx-auto mb-2" />
          <p className="text-xs text-ink-secondary font-medium">
            No companion travelers registered
          </p>
          <p className="text-[11px] text-ink-muted mt-1">
            Add frequent companions to quickly assign them to room bookings.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {familyMembers.map((member) => (
            <div
              key={member._id || member.id || Date.now()}
              className="p-4 rounded-control border border-stone-200/80 bg-white shadow-subtle flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-xs font-semibold text-ink-primary">
                    {member.fullName}
                  </h3>
                  <button
                    onClick={() => handleDeleteMember(member._id || member.id)}
                    className="text-stone-400 hover:text-red-700 p-1 rounded-control transition-colors"
                    aria-label="Remove traveler"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="text-[11px] font-mono text-ink-muted space-y-0.5">
                  <p>
                    Age:{" "}
                    <span className="tabular-nums text-ink-secondary">
                      {member.age}
                    </span>
                  </p>
                  {member.relationship && (
                    <p>
                      Relationship:{" "}
                      <span className="text-ink-secondary">
                        {member.relationship}
                      </span>
                    </p>
                  )}
                </div>
              </div>
              <div className="pt-2 mt-2 border-t border-stone-100 text-[10px] font-mono text-ink-muted">
                {member.isVerified
                  ? "ID verified on ledger"
                  : "Standard guest status"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FamilyMembers;
