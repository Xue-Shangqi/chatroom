import React, { useState } from 'react';

interface RoomSelectionProps {
  currentUsername: string;
  onJoinRoom: (roomId: string, username: string) => void;
  onCreateRoom: (roomName: string, username: string) => void;
}

function RoomSelection({ currentUsername, onJoinRoom, onCreateRoom }: RoomSelectionProps) {
  const [activeTab, setActiveTab] = useState<'join' | 'create'>('join');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [newRoomName, setNewRoomName] = useState('');

  // Username should be the same as the one entered in Welcome component

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRoomId) {
      onJoinRoom(selectedRoomId, currentUsername);
    }
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRoomName) {
      onCreateRoom(newRoomName, currentUsername);
    }
  };

  return (
    <div className="room-selection-container">
      <div className="room-selection-content">
        <h1 className="room-selection-title">Select a Chatroom</h1>
        
        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            className={`tab-button ${activeTab === 'join' ? 'active' : ''}`}
            onClick={() => setActiveTab('join')}
          >
            Join Room
          </button>
          <button
            className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            Create Room
          </button>
        </div>

        {/* Join Room Tab */}
        {activeTab === 'join' && (
          <div className="tab-content">
            <form onSubmit={handleJoinRoom} className="room-form">
              <div className="form-group">
                <label htmlFor="chatid" className="form-label">
                    Room ID
                </label>
                <input
                  id="chatid"
                  type="text"
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  placeholder="Enter the room ID"
                  required
                  className="form-input"
                />
              </div>

              <button
                type="submit"
                className="submit-button"
                disabled={!currentUsername || !selectedRoomId}
              >
                Join Room
              </button>
            </form>
          </div>
        )}

        {/* Create Room Tab */}
        {activeTab === 'create' && (
          <div className="tab-content">
            <form onSubmit={handleCreateRoom} className="room-form">
              <div className="form-group">
                <label htmlFor="room-name" className="form-label">
                  Room Name
                </label>
                <input
                  id="room-name"
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="Enter room name"
                  required
                  className="form-input"
                />
              </div>

              <button
                type="submit"
                className="submit-button"
                disabled={!newRoomName}
              >
                Create & Join Room
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default RoomSelection;
