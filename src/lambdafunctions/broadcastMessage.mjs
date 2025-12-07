import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const ROOMMEMBER_TABLE = "RoomMember";

export const handler = async (event) => {
  const body = typeof event === "string" ? JSON.parse(event) : event;
  const { chatroomId, userId, username, content, timestamp, domain, stage, exclude } = body;

  // WebSocket client
  const wsClient = new ApiGatewayManagementApiClient({
    endpoint: `https://${domain}/${stage}`
  });

  // Query all users in the room
  const roomMembers = await dynamo.send(
    new QueryCommand({
      TableName: ROOMMEMBER_TABLE,
      KeyConditionExpression: "chatroomId = :c",
      ExpressionAttributeValues: {
        ":c": chatroomId
      }
    })
  );

  // Send message to all users
  for (const item of roomMembers.Items) {
    const connectionId = item.userId;
    if(connectionId === exclude) continue;
    try {
      await wsClient.send(new PostToConnectionCommand({
        ConnectionId: connectionId,
        Data: JSON.stringify({
          chatroomId,
          userId,
          username,
          content,
          timestamp
        })
      }));
    } catch (err) {
      console.warn(`Stale connection: ${connectionId}`);
    }
  }

  return {
    statusCode: 200,
    body: "Message sent to all users."
  };
};
