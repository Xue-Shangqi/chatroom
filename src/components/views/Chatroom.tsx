import React, { useState, useRef, useEffect } from 'react';
import type { Room, Message } from '../models/types';

interface ChatroomProps {
  room: Room;
  messages: Message[];
  roomMembers: string[];
  currentUsername: string;
  onSendMessage: (content: string, chatroomId: string, username: string) => void;
  onLeaveRoom: (chatroomId: string) => void;
}

function Chatroom({ room, messages, roomMembers, currentUsername, onSendMessage, onLeaveRoom }: ChatroomProps) {
  const [messageInput, setMessageInput] = useState('');
  const [showRoomId, setShowRoomId] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(room.id);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim() && messageInput.trim().length < 1000) {
      onSendMessage(messageInput.trim(), room.id, currentUsername);
      setMessageInput('');
    } else {
      alert('Message failed to send. Ensure it is not empty and under 1000 characters.');
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
            {roomMembers.length} member{roomMembers.length !== 1 ? 's' : ''} online
          </span>
        </div>
        <button onClick={() => onLeaveRoom(room.id)} className="leave-button">
          Leave Room
        </button>
      </div>

      {/* Main Content Area */}
      <div className="chatroom-main">
        {/* Sidebar - Members List */}
        <aside className="chatroom-sidebar">
          <h2 className="sidebar-title">Members</h2>
          <ul className="members-list">
            {roomMembers.map((member) => (
              <li key={member} className="member-item">
                <span className="member-status-dot"></span>
                <span className="member-name">
                  {member}
                  {member === currentUsername && ' (You)'}
                </span>
              </li>
            )) || <li>No members</li>}
          </ul>
          <div className="room-id-container">
            <button
              onClick={() => setShowRoomId(!showRoomId)}
              className="room-id-toggle"
              title="Toggle room ID visibility"
            >
              Room ID {showRoomId ? '▼' : '▶'}
            </button>
            {showRoomId && (
              <div className="room-id-display">
                <span className="room-id-text">{room.id}</span>
                <button
                  onClick={handleCopyRoomId}
                  className="copy-button"
                  title="Copy room ID to clipboard"
                >
                  {copyFeedback ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Messages Area */}
        <div className="chatroom-content">
          <div className="messages-container">
            {messages.length === 0 ? (
              <div className="no-messages">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.timestamp.toString() + message.username}
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
