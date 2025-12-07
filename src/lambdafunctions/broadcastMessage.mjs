import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ApiGatewayManagementApi } from "@aws-sdk/client-apigatewaymanagementapi";

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const ROOMMEMBER_TABLE = "RoomMember";

export const handler = async (event) => {
  const body = typeof event === "string" ? JSON.parse(event) : event;
  const { chatroomId, username, content, timestamp, domain, stage, exclude } = body;

  const api = new ApiGatewayManagementApi({
    endpoint: `${domain}/${stage}`
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
      await api.postToConnection({
        ConnectionId: connectionId,
        Data: JSON.stringify({
          chatroomId,
          username,
          content,
          timestamp
        })
      });
    } catch (err) {
      console.warn(`Stale connection: ${connectionId}`);
    }
  }

  return {
    statusCode: 200,
    body: "Message sent to all users."
  };
};
