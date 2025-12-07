let ws: WebSocket | null = null;
const pendingRequests = new Map<string, (data: any) => void>();
let messageHandler: ((data: any) => void) | null = null;

// Generate UUID using Web Crypto API
function generateUUID(): string {
  const arr = crypto.getRandomValues(new Uint8Array(16));
  arr[6] = (arr[6] & 0x0f) | 0x40;
  arr[8] = (arr[8] & 0x3f) | 0x80;
  return Array.from(arr)
    .map((b, i) => {
      if (i === 4 || i === 6 || i === 8 || i === 10) return '-';
      return b.toString(16).padStart(2, '0');
    })
    .join('');
}

// Connect WebSocket and handle incoming messages
export function connectWebSocket(url: string, username: string) {
  ws = new WebSocket(url + "?username=" + encodeURIComponent(username));

  ws.onopen = () => {
    console.log("WebSocket connected");
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log("Received from server:", data);
    
    // Route to pending request handler if it exists
    if (data.requestId && pendingRequests.has(data.requestId)) {
      const handler = pendingRequests.get(data.requestId);
      handler?.(data);
      pendingRequests.delete(data.requestId);
    } else if (messageHandler) {
      // Route broadcast messages to custom handler
      messageHandler(data);
    }
  };

  ws.onclose = () => console.log("WebSocket disconnected");
  ws.onerror = (err) => console.error("WebSocket error:", err);

  return ws;
}

// Create room
export function createRoom(roomName: string, chatroomId?: string): Promise<{ chatroomId: string; messages: any[] }> {
  return new Promise((resolve, reject) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return reject("WebSocket not connected");

    const requestId = 'createroom-' + generateUUID();
    const timeout = setTimeout(() => {
      pendingRequests.delete(requestId);
      reject(new Error("Request timeout"));
    }, 10000);

    pendingRequests.set(requestId, (data) => {
      clearTimeout(timeout);
      resolve({
        chatroomId: data.chatroomId,
        messages: data.messages || []
      });
    });

    ws.send(JSON.stringify({ requestId, action: "enterRoom", type: 'create', roomName, chatroomId }));
  });
}

// Join room
export function joinRoom(chatroomId: string): Promise<{ chatroomId: string; messages: any[]; roomDetails: any }> {
  return new Promise((resolve, reject) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return reject("WebSocket not connected");

    const requestId = 'joinroom-' + generateUUID();
    const timeout = setTimeout(() => {
      pendingRequests.delete(requestId);
      reject(new Error("Request timeout"));
    }, 10000);

    pendingRequests.set(requestId, (data) => {
      clearTimeout(timeout);
      resolve({
        chatroomId: data.chatroomId,
        messages: data.messages || [],
        roomDetails: data.roomDetails || null
      });
    });

    ws.send(JSON.stringify({ requestId, action: "enterRoom", type: 'join', chatroomId }));
  });
}

// Leave Room
export function leaveRoom(chatroomId: string): Promise<void> { 
  return new Promise((resolve, reject) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return reject("WebSocket not connected");
    ws.send(JSON.stringify({ action: "leaveRoom", chatroomId }));
    resolve();
  });
}

// Query room members
export function queryRoomMembers(chatroomId: string): Promise<{ members: string[] }> {
  return new Promise((resolve, reject) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return reject("WebSocket not connected");

    const requestId = 'queryroommembers-' + generateUUID();
    const timeout = setTimeout(() => {
      pendingRequests.delete(requestId);
      reject(new Error("Request timeout"));
    }, 10000);

    pendingRequests.set(requestId, (data) => {
      clearTimeout(timeout);
      resolve({ members: data.members });
    });

    ws.send(JSON.stringify({ requestId, action: "queryRoomMembers", chatroomId }));
  });
}

// Send message
export function sendMessage(chatroomId: string, content: string, username: string, timestamp: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return reject("WebSocket not connected");
    ws.send(JSON.stringify({ action: "sendMessage", chatroomId, content, username, timestamp }));
    resolve();
  });
}

// Set message handler for incoming messages
export function setMessageHandler(handler: (data: any) => void) {
  messageHandler = handler;
}

// Remove message handler
export function removeMessageHandler() {
  messageHandler = null;
}