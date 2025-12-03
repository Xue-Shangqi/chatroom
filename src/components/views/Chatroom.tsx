import React, { useState, useRef, useEffect } from 'react';
import type { Room } from '../models/types';

interface ChatroomProps {
  room: Room;
  currentUsername: string;
  onSendMessage: (content: string) => void;
  onLeaveRoom: () => void;
}

function Chatroom({ room, currentUsername, onSendMessage, onLeaveRoom }: ChatroomProps) {
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [room.messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim()) {
      onSendMessage(messageInput.trim());
      setMessageInput('');
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="chatroom-container">
      {/* Header */}
      <div className="chatroom-header">
        <div className="chatroom-header-info">
          <h1 className="chatroom-title">{room.name}</h1>
          <span className="chatroom-members-count">
            {room.members.length} member{room.members.length !== 1 ? 's' : ''} online
          </span>
        </div>
        <button onClick={onLeaveRoom} className="leave-button">
          Leave Room
        </button>
      </div>

      {/* Main Content Area */}
      <div className="chatroom-main">
        {/* Sidebar - Members List */}
        <aside className="chatroom-sidebar">
          <h2 className="sidebar-title">Members</h2>
          <ul className="members-list">
            {room.members.map((member) => (
              <li key={member.id} className="member-item">
                <span className="member-status-dot"></span>
                <span className="member-name">
                  {member.username}
                  {member.username === currentUsername && ' (You)'}
                </span>
              </li>
            ))}
          </ul>
        </aside>

        {/* Messages Area */}
        <div className="chatroom-content">
          <div className="messages-container">
            {room.messages.length === 0 ? (
              <div className="no-messages">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              <>
                {room.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`message ${
                      message.username === currentUsername ? 'message-own' : 'message-other'
                    }`}
                  >
                    <div className="message-header">
                      <span className="message-username">{message.username}</span>
                      <span className="message-time">{formatTime(message.timestamp)}</span>
                    </div>
                    <div className="message-content">{message.content}</div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="message-input-form">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type a message..."
              className="message-input"
            />
            <button type="submit" className="send-button" disabled={!messageInput.trim()}>
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Chatroom;
