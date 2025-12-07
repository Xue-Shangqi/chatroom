import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";
import { randomUUID } from "crypto";

const dynamoClient = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(dynamoClient);

const ROOM_TABLE = "Room"
const ROOMMEMBER_TABLE = "RoomMember"
const MESSAGE_TABLE = "Message"

export const handler = async (event) => {
  try {
    const connectionId = event.requestContext.connectionId;
    const domainName = event.requestContext.domainName;
    const stage = event.requestContext.stage;
    const body = JSON.parse(event.body);

    const type = body.type;
    const roomName = body.roomName;
    const requestId = body.requestId;
    let chatroomId = body.chatroomId || "";

    if (!type) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing 'type' parameter" })
      };
    }

    // WebSocket client
    const wsClient = new ApiGatewayManagementApiClient({
      endpoint: `https://${domainName}/${stage}`
    });

    if (type === "create") {
      chatroomId = randomUUID();

      // Create room in DynamoDB
      await dynamo.send(new PutCommand({
        TableName: ROOM_TABLE,
        Item: {
          id: chatroomId,
          roomName,
          owner: connectionId,
          createdAt: new Date().toISOString()
        }
      }));

      // Add creator as member
      await dynamo.send(new PutCommand({
        TableName: ROOMMEMBER_TABLE,
        Item: {
          chatroomId,
          userId: connectionId
        }
      }));

      // Send response to client via WebSocket
      await wsClient.send(new PostToConnectionCommand({
        ConnectionId: connectionId,
        Data: JSON.stringify({ requestId, chatroomId, message: `Room '${roomName}' created` })
      }));

      return { statusCode: 200, body: "Room created" };
    }

    if (type === "join") {
      if (!chatroomId) {
        return { statusCode: 400, body: JSON.stringify({ message: "Missing 'chatroomId' for join" }) };
      }

      // Query for all connected users 
      const connectedUsers = await dynamo.send(new QueryCommand({
        TableName: ROOMMEMBER_TABLE,
        KeyConditionExpression: "chatroomId = :chatroomId",
        ExpressionAttributeValues: {
          ":chatroomId": chatroomId
        }
      }));

      await dynamo.send(new PutCommand({
        TableName: ROOMMEMBER_TABLE,
        Item: { chatroomId, userId: connectionId }
      }));

      const messages = await dynamo.send(new QueryCommand({
        TableName: MESSAGE_TABLE,
        KeyConditionExpression: "chatroomId = :chatroomId",
        ExpressionAttributeValues: {
          ":chatroomId": chatroomId
        }
      }));

      const roomDetails = await dynamo.send(new QueryCommand({
        TableName: ROOM_TABLE,
        KeyConditionExpression: "id = :chatroomId",
        ExpressionAttributeValues: {
          ":chatroomId": chatroomId
        }
      }));

      // Send response to client via WebSocket
      await wsClient.send(new PostToConnectionCommand({
        ConnectionId: connectionId,
        Data: JSON.stringify({ requestId, chatroomId, message: `Joined room '${chatroomId}'`, messages: messages.Items || [], roomDetails: roomDetails.Items[0]})
      }));

      // Query username from User table
      const userQuery = await dynamo.send(new QueryCommand({
        TableName: "User",
        KeyConditionExpression: "id = :userId",
        ExpressionAttributeValues: {
          ":userId": connectionId
        }
      }));

      // Send response to other client to update
      for (const user of connectedUsers.Items) {
        if (user.userId !== connectionId) {
          await wsClient.send(new PostToConnectionCommand({
            ConnectionId: user.userId,
            Data: JSON.stringify({ requestId, chatroomId, username: userQuery.Items[0]})
          }));
        }
      }

      return { statusCode: 200, body: "Joined room" };
    }

    return { statusCode: 400, body: JSON.stringify({ message: "Invalid type. Use 'create' or 'join'." }) };

  } catch (err) {
    console.error("Error in enterRoom:", err);
    return { statusCode: 500, body: JSON.stringify({ message: "Internal server error" }) };
  }
};
