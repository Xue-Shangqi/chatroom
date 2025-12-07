import { useState, useEffect, useRef } from 'react';
import type { Room, User, Message, ViewState } from '../models/types';
import { connectWebSocket, queryRoomMembers, createRoom, joinRoom, leaveRoom } from '../../api/awsLambda';

export const useChatroomController = () => {
  const [currentView, setCurrentView] = useState<ViewState>('welcome');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [roomMembers, setRoomMembers] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Navigate from welcome to room selection
  const handleContinueFromWelcome = (username: string) => {
    wsRef.current = connectWebSocket("wss://yoyqjkjjg2.execute-api.us-east-1.amazonaws.com/production/", username);
    const newUser: User = {
      username,
      joinedAt: new Date()
    };
    setCurrentUser(newUser);
    setCurrentView('room-selection');
  };

  // Create a new room
  const handleCreateRoom = async (roomName: string) => {
    const result = await createRoom(roomName);
    const newRoom: Room = {
      id: result.chatroomId,
      name: roomName,
      owner: currentUser ? currentUser.username : 'unknown',
      createdAt: new Date()
    };
    setRooms(prevRooms => [...prevRooms, newRoom]);
    setCurrentRoom(newRoom);
    setMessages(result.messages || []);
    const members = await queryRoomMembers(newRoom.id).then(res => res.members);
    setRoomMembers(members);
    setCurrentView('chatroom');
  };

  // Join an existing room
  const handleJoinRoom = async (chatroomId: string) => {
    const result = await joinRoom(chatroomId);
    const joinedRoom = rooms.find(room => room.id === result.chatroomId);
    if (joinedRoom) {
      setCurrentRoom(joinedRoom);
      setMessages(result.messages || []);
      setRoomMembers(await queryRoomMembers(joinedRoom.id).then(res => res.members));
      setCurrentView('chatroom');
    }
  };

  // Send a message
  const handleSendMessage = (content: string) => {

  };

  // Leave current room
  const handleLeaveRoom = async (chatroomId: string) => {
    await leaveRoom(chatroomId);
    setCurrentView('room-selection');
  };

  return {
    currentView,
    rooms,
    currentRoom,
    currentUser,
    messages,
    roomMembers,
    handleContinueFromWelcome,
    handleCreateRoom,
    handleJoinRoom,
    handleSendMessage,
    handleLeaveRoom
  };
};
