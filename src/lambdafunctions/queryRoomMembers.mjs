import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";

const dynamoClient = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(dynamoClient);

export const handler = async (event) => {
  try {
    const connectionId = event.requestContext.connectionId;
    const domainName = event.requestContext.domainName;
    const stage = event.requestContext.stage;
    const body = JSON.parse(event.body);
    const chatroomId = body.chatroomId;
    const requestId = body.requestId;

    if (!chatroomId) {
      await wsClient.send(
        new PostToConnectionCommand({
          ConnectionId: connectionId,
          Data: JSON.stringify({ requestId, error: "Missing chatroomId" }),
        })
      );
      return { statusCode: 400 };
    }

    const wsClient = new ApiGatewayManagementApiClient({
      endpoint: `https://${domainName}/${stage}`
    });

    // Query RoomMember table
    const memberMapping = await dynamo.send(
      new QueryCommand({
        TableName: "RoomMember",
        KeyConditionExpression: "chatroomId = :chatroomId",
        ExpressionAttributeValues: {
          ":chatroomId": chatroomId,
        },
      })
    );

    // Collect and dedupe user IDs
    const rawIds = memberMapping.Items?.map((i) => i.userId) ?? [];
    const userIds = [...new Set(rawIds)];

    if (userIds.length === 0) {
      await wsClient.send(
        new PostToConnectionCommand({
          ConnectionId: connectionId,
          Data: JSON.stringify({ requestId, members: [] }),
        })
      );
      return { statusCode: 200 };
    }

    // Query each user individually
    const userPromises = userIds.map((userId) =>
      dynamo.send(
        new QueryCommand({
          TableName: "User",
          KeyConditionExpression: "id = :id",
          ExpressionAttributeValues: {
            ":id": userId,
          },
        })
      )
    );

    const userResults = await Promise.all(userPromises);

    // Extract usernames from query results
    const usernames = userResults
      .flatMap((result) => result.Items ?? [])
      .map((user) => user.username)
      .filter(Boolean);

    // Send response back through WebSocket
    await wsClient.send(new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: JSON.stringify({ requestId, members: usernames })
    }));

    return { statusCode: 200 };
  } catch (error) {
    console.error("Lambda error:", error);

    try {
      const { connectionId, domainName, stage } = event.requestContext;
      const wsClient = new ApiGatewayManagementApiClient({
        endpoint: `https://${domainName}/${stage}`
      });
      
      await wsClient.send(
        new PostToConnectionCommand({
          ConnectionId: connectionId,
          Data: JSON.stringify({
            requestId,
            error: "Internal Server Error",
            details: error.message,
          }),
        })
      );
    } catch (postError) {
      console.error("Failed to send error to client:", postError);
    }

    return { statusCode: 500 };
  }
};