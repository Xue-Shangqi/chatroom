  import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
  import {
    DynamoDBDocumentClient,
    QueryCommand,
    DeleteCommand
  } from "@aws-sdk/lib-dynamodb";
  import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";

  const client = new DynamoDBClient({});
  const dynamo = DynamoDBDocumentClient.from(client);

  const CHATROOM_TABLE = "Room";
  const ROOMMEMBER_TABLE = "RoomMember";
  const MESSAGE_TABLE = "Message";

  export const handler = async (event) => {
    const connectionId = event.requestContext.connectionId;
    const chatroomId = JSON.parse(event.body).chatroomId;

    const domain = event.requestContext.domainName;
    const stage = event.requestContext.stage;

    // WebSocket client
    const wsClient = new ApiGatewayManagementApiClient({
      endpoint: `https://${domain}/${stage}`
    });

    // Get the Room row to know the owner
    const chatroomQuery = await dynamo.send(
      new QueryCommand({
        TableName: CHATROOM_TABLE,
        KeyConditionExpression: "id = :id",
        ExpressionAttributeValues: { ":id": chatroomId }
      })
    );

    if (chatroomQuery.Count === 0) {
      return { statusCode: 404, body: JSON.stringify({ message: "Chatroom not found" }) };
    }

    // The Room table has PK=id, SK=owner -> there should be only one row
    const roomRow = chatroomQuery.Items[0];
    const ownerId = roomRow.owner;

    const isOwnerLeaving = ownerId === connectionId;

    // If owner leaves -> notify members & delete everything
    if (isOwnerLeaving) {
      // Get all RoomMember rows
      const membersQuery = await dynamo.send(
        new QueryCommand({
          TableName: ROOMMEMBER_TABLE,
          KeyConditionExpression: "chatroomId = :chatroomId",
          ExpressionAttributeValues: { ":chatroomId": chatroomId }
        })
      );

      // Notify all members via WebSocket
      for (const member of membersQuery.Items) {
        try {
          await wsClient.send(new PostToConnectionCommand({
            ConnectionId: member.userId,
            Data: JSON.stringify({ type: "ROOM_CLOSED", chatroomId, reason: "owner-left" })
          }));
        }catch(err){
          if (err.$metadata?.httpStatusCode === 410) {
            console.log("Stale connection:", member.userId);
            continue;
          }
        }
      }

      // Delete all RoomMember rows
      await Promise.all(
        membersQuery.Items.map((m) =>
          dynamo.send(
            new DeleteCommand({
              TableName: ROOMMEMBER_TABLE,
              Key: { chatroomId, userId: m.userId }
            })
          )
        )
      );

      // Delete all messages
      const messagesQuery = await dynamo.send(
        new QueryCommand({
          TableName: MESSAGE_TABLE,
          KeyConditionExpression: "chatroomId = :chatroomId",
          ExpressionAttributeValues: { ":chatroomId": chatroomId }
        })
      );

      await Promise.all(
        messagesQuery.Items.map((msg) =>
          dynamo.send(
            new DeleteCommand({
              TableName: MESSAGE_TABLE,
              Key: { chatroomId, timestamp: msg.timestamp }
            })
          )
        )
      );

      // Delete the Room row itself
      await dynamo.send(
        new DeleteCommand({
          TableName: CHATROOM_TABLE,
          Key: { id: chatroomId, owner: ownerId }
        })
      );

      return { statusCode: 200, body: JSON.stringify({ message: "Owner left, room closed" }) };
    }

    // I member leaves -> delete only their row
    await dynamo.send(
      new DeleteCommand({
        TableName: ROOMMEMBER_TABLE,
        Key: { chatroomId, userId: connectionId }
      })
    );

    // Notify the rest of client 
    const membersQuery = await dynamo.send(
      new QueryCommand({
        TableName: ROOMMEMBER_TABLE,
        KeyConditionExpression: "chatroomId = :chatroomId",
        ExpressionAttributeValues: { ":chatroomId": chatroomId }
      })
    );
    
    for (const member of membersQuery.Items) {
      try {
        await wsClient.send(new PostToConnectionCommand({
          ConnectionId: member.userId,
          Data: JSON.stringify({ type: "MEMBER_LEFT", chatroomId })
        }));
      }catch(e){
        if (err.$metadata?.httpStatusCode === 410) {
          console.log("Stale connection:", member.userId);
          continue;
        }
      }

    }


    return { statusCode: 200, body: JSON.stringify({ message: "Member left" }) };
  };
