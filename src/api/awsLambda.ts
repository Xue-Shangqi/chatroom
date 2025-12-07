let ws: WebSocket | null = null;

// Connect WebSocket and handle incoming messages
export function connectWebSocket(url: string, username: string) {
  ws = new WebSocket(url + "?username=" + encodeURIComponent(username));

  ws.onopen = () => {
    console.log("WebSocket connected");
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log("Received from server:", data);
  };

  ws.onclose = () => console.log("WebSocket disconnected");
  ws.onerror = (err) => console.error("WebSocket error:", err);

  return ws;
}

// Create room
export function createRoom(roomName: string, chatroomId?: string): Promise<{ chatroomId: string; messages: any[] }> {
  return new Promise((resolve, reject) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return reject("WebSocket not connected");

    const timeout = setTimeout(() => {
      ws?.removeEventListener("message", handler);
      reject(new Error("Request timeout"));
    }, 10000);

    const handler = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.chatroomId && data.message) {
        clearTimeout(timeout);
        resolve({
          chatroomId: data.chatroomId,
          messages: data.messages || []
        });
        ws?.removeEventListener("message", handler);
      }
    };

    ws.addEventListener("message", handler);
    ws.send(JSON.stringify({ action: "enterRoom", type: 'create', roomName, chatroomId }));
  });
}

// Join room
export function joinRoom(chatroomId: string): Promise<{ chatroomId: string; messages: any[] }> {
  return new Promise((resolve, reject) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return reject("WebSocket not connected");

    const timeout = setTimeout(() => {
      ws?.removeEventListener("message", handler);
      reject(new Error("Request timeout"));
    }, 10000);

    const handler = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.chatroomId && data.message) {
        clearTimeout(timeout);
        resolve({
          chatroomId: data.chatroomId,
          messages: data.messages || []
        });
        ws?.removeEventListener("message", handler);
      }
    };

    ws.addEventListener("message", handler);
    ws.send(JSON.stringify({ action: "enterRoom", type: 'join', chatroomId }));
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

    const timeout = setTimeout(() => {
      ws?.removeEventListener("message", handler);
      reject(new Error("Request timeout"));
    }, 10000);

    const handler = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.members !== undefined) {
        clearTimeout(timeout);
        resolve({ members: data.members });
        ws?.removeEventListener("message", handler);
      }
    };

    ws.addEventListener("message", handler);
    ws.send(JSON.stringify({ action: "queryRoomMembers", chatroomId }));
  });
}