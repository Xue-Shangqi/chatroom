# Your Average Chatroom

A real-time web application for connecting and chatting with others.

---

## Tech Stack

### Frontend
- **React** 19 - UI framework
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **Tailwind CSS** - Styling

### Backend
- **AWS Lambda** - Serverless compute
- **AWS WebSocket API** - Real-time messaging

### Database
- **AWS DynamoDB** - NoSQL database

---

## Project Structure

```
src/
├── assets/              # Images and static files
├── components/
│   ├── controllers/     # Logic & state management
│   │   └── useChatroomController.ts
│   ├── models/          # Type definitions
│   │   └── types.ts
│   └── views/           # UI components
│       ├── Chatroom.tsx
│       ├── RoomSelection.tsx
│       └── Welcome.tsx
├── api/                 # AWS WebSocket integration
│   └── awsWebsocket.ts
└── lambdafunctions/     # AWS Lambda handlers
    ├── broadcastMessage.mjs
    ├── Connect.mjs
    ├── Disconnect.mjs
    ├── enterRoom.mjs
    ├── leaveRoom.mjs
    ├── queryRoomMembers.mjs
    └── sendMessage.mjs
```

---

## Database Schema

> I was not able to supply the schemas file directly because AWS DynamoDB does not natively support it. However, this is basically the database looks like. 

AWS DynamoDB tables: 

### Message
| Attribute | Type | Role |
|-----------|------|------|
| `chatroomId` | String | Partition Key |
| `timestamp` | String | Sort Key |

### Room
| Attribute | Type | Role |
|-----------|------|------|
| `id` | String | Partition Key |
| `owner` | String | Sort Key |

### RoomMember
| Attribute | Type | Role |
|-----------|------|------|
| `chatroomId` | String | Partition Key |
| `userId` | String | Sort Key |

### User
| Attribute | Type | Role |
|-----------|------|------|
| `id` | String | Partition Key |
| `joinedAt` | String | Sort Key |

---

## Architecture
>The design doc before might be outdated compares to what I actually have.
![MVC Design Pattern](./MVC%20Design%20Pattern.png)

This application follows the MVC (Model-View-Controller) design pattern:
- **Models**: Type definitions and data structures
- **Views**: React components for UI rendering
- **Controllers**: Business logic and state management

---

## Live Demo

Visit: [https://xue-shangqi.github.io/chatroom/](https://xue-shangqi.github.io/chatroom/)

---