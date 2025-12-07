import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, DeleteCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

const dynamoClient = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(dynamoClient);
const lambdaClient = new LambdaClient({});

const USER_TABLE = "User";
const LEAVE_ROOM_LAMBDA = "leaveRoom";
const ROOM_TABLE = "Room";

export const handler = async (event) => {
  const connectionId = event.requestContext.connectionId;

  try {
    // Query all rooms owned by disconnecting users
    const ownedRooms = await dynamo.send(new ScanCommand({
      TableName: ROOM_TABLE,
      FilterExpression: "#owner = :connectionId",
      ExpressionAttributeNames: {
        "#owner": "owner"
      },
      ExpressionAttributeValues: { ":connectionId": connectionId },
      ProjectionExpression: "id, #owner"
    }));

    // Create list of all chatroomId owned by disconnecting users
    const ownedRoomsList = ownedRooms.Items?.map(room => room.id) || [];

    // Call leaveRoom Lambda on all owned room
    const leaveRoomPromises = ownedRoomsList.map(chatroomId =>
      lambdaClient.send(new InvokeCommand({
        FunctionName: LEAVE_ROOM_LAMBDA,
        InvocationType: "RequestResponse",
        Payload: Buffer.from(JSON.stringify({
          requestContext: { connectionId },
          queryStringParameters: { chatroomId }
        }))
      }))
    );

    const leaveRoomResponses = await Promise.all(leaveRoomPromises);

    // Delete User rows where id = connectionId
    const userQuery = await dynamo.send(new QueryCommand({
      TableName: USER_TABLE,
      KeyConditionExpression: "id = :id",
      ExpressionAttributeValues: { ":id": connectionId }
    }));

    if (userQuery.Items.length > 0) {
      await Promise.all(userQuery.Items.map(user =>
        dynamo.send(new DeleteCommand({
          TableName: USER_TABLE,
          Key: { id: user.id, joinedAt: user.joinedAt }
        }))
      ));
    }

    const leaveRoomResults = leaveRoomResponses.map(response => {
      const payload = response.Payload
        ? Buffer.from(response.Payload).toString()
        : null;

      try {
        return payload ? JSON.parse(payload) : null;
      } catch (err) {
        console.warn("Failed to parse leaveRoom response:", err);
        return null;
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `${connectionId} disconnected successfully`,
        roomsLeft: ownedRoomsList.length,
        leaveRoomResults
      })
    };

  } catch (err) {
    console.error("Disconnect error:", err);
    return { statusCode: 500, body: "Internal server error" };
  }
};
