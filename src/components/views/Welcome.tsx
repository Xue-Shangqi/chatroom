import React, { useState } from 'react';
import bonk from "../../assets/bonk.png"

interface WelcomeProps {
  onContinue: (username: string) => void;
}

function Welcome({ onContinue }: WelcomeProps) {
  const [username, setUsername] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onContinue(username.trim());
    }
  };

  return (
    <div className="welcome-container">
      <div className="content-wrapper">
        {/* Header Section */}
        <img src={bonk} alt="bonk img" className="bonk-image" />
        <div className="header-section">
          <h1 className="main-title">
            Your Average Chatroom
          </h1>

          <p className="subtitle">
            Just a simple chatroom application to connect and communicate with others in real-time. 
            Nothing interesting to see here, move along. If you stay, don't be sඞs.
          </p>
        </div>

        {/* Join Form */}
        <div className="form-container">
          <div className="form-card">
            <h2 className="form-title">
              Join the Conversation
            </h2>
            <form onSubmit={handleSubmit} className="form-content">
              <div>
                <label htmlFor="username" className="form-label">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  className="form-input"
                />
              </div>
              <button
                type="submit"
                className="submit-button"
              >
                Continue
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Welcome;
