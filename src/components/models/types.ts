// User model
export interface User {
  id: string;
  username: string;
  joinedAt: Date;
}

// Message model
export interface Message {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: Date;
}

// Room model
export interface Room {
  id: string;
  name: string;
  createdBy: string;
  createdAt: Date;
  members: User[];
  messages: Message[];
}

// Application state
export type ViewState = 'welcome' | 'room-selection' | 'chatroom';
