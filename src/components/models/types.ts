// User model
export interface User {
  id?: string;
  username: string;
  joinedAt: Date;
}

// Message model
export interface Message {
  id: string;
  userId: string;
  chatroomId: string;
  username: string;
  content: string;
  timestamp: Date;
}

// Room model
export interface Room {
  id: string;
  name: string;
  owner: string;
  createdAt: Date;
}

export interface RoomMembers {
  user_id: string;
  room_id: string;
}

// Application state
export type ViewState = 'welcome' | 'room-selection' | 'chatroom';
