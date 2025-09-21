import { useState, useEffect } from 'react';
import userService from '../services/userService';

const FamilyMembers = ({ user }) => {
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMemberData, setNewMemberData] = useState({
    fullName: '',
    age: '',
    relationship: ''
  });
  const [editingMember, setEditingMember] = useState(null);

  useEffect(() => {
    fetchFamilyMembers();
  }, []);

  const fetchFamilyMembers = async () => {
    try {
      setLoading(true);
      const response = await userService.getFamilyMembers();
      
      // Handle different response formats
      let members = [];
      if (Array.isArray(response)) {
        members = response;
      } else if (response && Array.isArray(response.data)) {
        members = response.data;
      } else if (response && response.familyMembers) {
        members = response.familyMembers;
      } else if (response && response.data && response.data.familyMembers) {
        // Backend returns user object with familyMembers array
        members = response.data.familyMembers;
      } else if (response && typeof response === 'object') {
        // If response is an object but not in expected format, try to extract array
        members = Object.values(response).filter(item => 
          item && typeof item === 'object' && item.fullName !== undefined
        );
      }
      
      setFamilyMembers(members);
    } catch (err) {
      setError('Failed to fetch family members');
      console.error('Error fetching family members:', err);
      // Ensure familyMembers is always an array
      setFamilyMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMemberData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddMember = async () => {
    try {
      const response = await userService.addFamilyMember({
        fullName: newMemberData.fullName,
        age: parseInt(newMemberData.age),
        relationship: newMemberData.relationship || 'Family Member'
      });
      
      // Handle different response formats for the new member
      let newMember;
      if (response && response.data) {
        newMember = response.data;
      } else if (response && typeof response === 'object') {
        newMember = response;
      } else {
        // If response format is unexpected, create a temporary object
        newMember = {
          _id: Date.now().toString(), // temporary ID
          fullName: newMemberData.fullName,
          age: parseInt(newMemberData.age),
          relationship: newMemberData.relationship || 'Family Member',
          isVerified: false
        };
      }
      
      setFamilyMembers(prev => [...prev, newMember]);
      setNewMemberData({ fullName: '', age: '', relationship: '' });
      setShowAddForm(false);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to add family member');
      console.error('Error adding family member:', err);
    }
  };

  const handleUpdateMember = async (memberId, updatedData) => {
    try {
      const response = await userService.updateFamilyMember(memberId, updatedData);
      setFamilyMembers(prev => prev.map(member => 
        member._id === memberId ? response.data : member
      ));
      setEditingMember(null);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to update family member');
      console.error('Error updating family member:', err);
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (window.confirm('Are you sure you want to delete this family member?')) {
      try {
        await userService.deleteFamilyMember(memberId);
        setFamilyMembers(prev => prev.filter(member => member._id !== memberId));
        setError('');
      } catch (err) {
        setError(err.message || 'Failed to delete family member');
        console.error('Error deleting family member:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-primary">Family Members</h2>
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="bg-primary hover:bg-primary/90 text-white font-semibold py-2 px-4 rounded-md transition-colors"
        >
          + Add Family Member
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {showAddForm && (
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Family Member</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                name="fullName"
                value={newMemberData.fullName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Full name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input
                type="number"
                name="age"
                value={newMemberData.age}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Age"
                min="1"
                max="120"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
              <input
                type="text"
                name="relationship"
                value={newMemberData.relationship}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Relationship (optional)"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAddMember}
              disabled={!newMemberData.fullName || !newMemberData.age}
              className="bg-accent hover:bg-accent/90 disabled:bg-gray-300 text-white font-semibold py-2 px-4 rounded-md transition-colors"
            >
              Add Member
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-md transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {familyMembers && Array.isArray(familyMembers) && familyMembers.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No family members added yet.</p>
          <p className="text-sm text-gray-500 mt-2">
            Add family members to easily select them during bookings.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {familyMembers && Array.isArray(familyMembers) && familyMembers.map((member) => (
            <div key={member._id || member.id || Date.now()} className="border border-gray-200 rounded-md p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-800">{member.fullName}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDeleteMember(member._id || member.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600">Age: {member.age}</p>
              {member.relationship && (
                <p className="text-sm text-gray-600">Relationship: {member.relationship}</p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                {member.isVerified ? 'Verified' : 'Not verified'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FamilyMembers;