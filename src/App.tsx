import './App.css';
import Welcome from './components/views/Welcome';
import RoomSelection from './components/views/RoomSelection';
import Chatroom from './components/views/Chatroom';
import { useChatroomController } from './components/controllers/useChatroomController';

function App() {
  const {
    currentView,
    currentRoom,
    currentUser,
    messages,
    roomMembers,
    handleContinueFromWelcome,
    handleCreateRoom,
    handleJoinRoom,
    handleSendMessage,
    handleLeaveRoom
  } = useChatroomController();

  return (
    <>
      {currentView === 'welcome' && (
        <Welcome onContinue={handleContinueFromWelcome} />
      )}

      {currentView === 'room-selection' && currentUser && (
        <RoomSelection
          currentUsername={currentUser.username}
          onJoinRoom={handleJoinRoom}
          onCreateRoom={handleCreateRoom}
        />
      )}

      {currentView === 'chatroom' && currentRoom && currentUser && (
        <Chatroom
          room={currentRoom}
          messages={messages}
          roomMembers={roomMembers}
          currentUsername={currentUser.username}
          onSendMessage={handleSendMessage}
          onLeaveRoom={handleLeaveRoom}
        />
      )}
    </>
  );
}

export default App;