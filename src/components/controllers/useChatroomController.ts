import { useState } from 'react';
import type { Room, User, Message, ViewState } from '../models/types';

export const useChatroomController = () => {
  const [currentView, setCurrentView] = useState<ViewState>('welcome');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Generate unique ID
  const generateId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Navigate from welcome to room selection
  const handleContinueFromWelcome = (username: string) => {
    const user: User = {
      id: generateId(),
      username,
      joinedAt: new Date()
    };
    setCurrentUser(user);
    setCurrentView('room-selection');
  };

  // Create a new room
  const handleCreateRoom = (roomName: string, username: string) => {
    const user: User = {
      id: generateId(),
      username,
      joinedAt: new Date()
    };

    const newRoom: Room = {
      id: generateId(),
      name: roomName,
      createdBy: username,
      createdAt: new Date(),
      members: [user],
      messages: []
    };

    setRooms([...rooms, newRoom]);
    setCurrentUser(user);
    setCurrentRoom(newRoom);
    setCurrentView('chatroom');
  };

  // Join an existing room
  const handleJoinRoom = (roomId: string, username: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    const user: User = {
      id: generateId(),
      username,
      joinedAt: new Date()
    };

    // Add user to room members
    const updatedRoom: Room = {
      ...room,
      members: [...room.members, user]
    };

    setRooms(rooms.map(r => r.id === roomId ? updatedRoom : r));
    setCurrentUser(user);
    setCurrentRoom(updatedRoom);
    setCurrentView('chatroom');
  };

  // Send a message
  const handleSendMessage = (content: string) => {
    if (!currentRoom || !currentUser) return;

    const newMessage: Message = {
      id: generateId(),
      userId: currentUser.id,
      username: currentUser.username,
      content,
      timestamp: new Date()
    };

    const updatedRoom: Room = {
      ...currentRoom,
      messages: [...currentRoom.messages, newMessage]
    };

    setRooms(rooms.map(r => r.id === currentRoom.id ? updatedRoom : r));
    setCurrentRoom(updatedRoom);
  };

  // Leave current room
  const handleLeaveRoom = () => {
    if (!currentRoom || !currentUser) return;

    // Remove user from room members
    const updatedRoom: Room = {
      ...currentRoom,
      members: currentRoom.members.filter(m => m.id !== currentUser.id)
    };

    setRooms(rooms.map(r => r.id === currentRoom.id ? updatedRoom : r));
    setCurrentRoom(null);
    setCurrentView('room-selection');
  };

  return {
    currentView,
    rooms,
    currentRoom,
    currentUser,
    handleContinueFromWelcome,
    handleCreateRoom,
    handleJoinRoom,
    handleSendMessage,
    handleLeaveRoom
  };
};
