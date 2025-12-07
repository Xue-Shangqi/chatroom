import { useState, useEffect, useRef } from 'react';
import type { Room, User, Message, ViewState } from '../models/types';
import { connectWebSocket, queryRoomMembers, createRoom, joinRoom, leaveRoom, sendMessage, setMessageHandler, removeMessageHandler } from '../../api/awsWebsocket';

export const useChatroomController = () => {
  const [currentView, setCurrentView] = useState<ViewState>('welcome');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [roomMembers, setRoomMembers] = useState<string[]>([]);
  const [isRoomActionPending, setIsRoomActionPending] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      removeMessageHandler();
    };
  }, []);

  // Handle WebSocket messages
  useEffect(() => {
    const handleMessage = async (data: any) => {
      
      // Handle user joined/left room - refresh member list
      if (currentRoom && data.chatroomId === currentRoom.id) {
        if (data.requestId !== undefined && (data.requestId.includes('joinroom-'))) {
          try {
            const members = await queryRoomMembers(currentRoom.id).then(res => res.members);
            setRoomMembers(members);
          } catch (error) {
            console.error('Failed to refresh members:', error);
          }
        }

        if (data.type !== undefined && data.type.includes('MEMBER_LEFT')) {
          try {
            const members = await queryRoomMembers(currentRoom.id).then(res => res.members);
            setRoomMembers(members);
          } catch (error) {
            console.error('Failed to refresh members:', error);
          }
        }

        if (data.type !== undefined && data.type.includes('ROOM_CLOSED')) {
          setCurrentView('room-selection');
          setCurrentRoom(null);
          setMessages([]);
          setRoomMembers([]);
        }
      }
      
      // Handle incoming messages from other users
      if (data.content && data.username && data.timestamp && data.chatroomId) {
        const newMessage: Message = {
          chatroomId: data.chatroomId,
          timestamp: new Date(data.timestamp),
          userId: data.userId,
          username: data.username,
          content: data.content
        };
        setMessages(prevMessages => [...prevMessages, newMessage]);
      }
    };

    setMessageHandler(handleMessage);
    
    return () => {
      removeMessageHandler();
    };
  }, [currentRoom]);

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
    if (isRoomActionPending) return;

    setIsRoomActionPending(true);
    try {
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
    } finally {
      setIsRoomActionPending(false);
    }
  };

  // Join an existing room
  const handleJoinRoom = async (chatroomId: string) => {
    if (isRoomActionPending) return;

    setIsRoomActionPending(true);
    try {
      const result = await joinRoom(chatroomId);
      if (result.message === 'Room not found') {
        alert('Room not found. Please check the Room ID and try again.');
        setIsRoomActionPending(false);
        return;
      }
      const joinedRoom: Room = {
        id: result.chatroomId,
        name: result.roomDetails?.roomName || 'Unknown Room',
        owner: result.roomDetails?.owner || 'unknown',
        createdAt: result.roomDetails?.createdAt || "Unknown"
      };
      setCurrentRoom(joinedRoom);
      setMessages(result.messages || []);
      setRoomMembers(await queryRoomMembers(joinedRoom.id).then(res => res.members));
      setCurrentView('chatroom');
    } finally {
      setIsRoomActionPending(false);
    }
  };

  // Send a message
  const handleSendMessage = async (content: string) => {
    if (!currentRoom || !currentUser) return;
    const timestamp = new Date().toISOString();
    await sendMessage(currentRoom.id, content, currentUser.username, timestamp);
    const newMessage: Message = {
      chatroomId: currentRoom.id,
      timestamp: new Date(timestamp),
      userId: currentUser.id || '',
      username: currentUser.username,
      content
    };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
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
    isRoomActionPending,
    handleContinueFromWelcome,
    handleCreateRoom,
    handleJoinRoom,
    handleSendMessage,
    handleLeaveRoom
  };
};
