import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const lambdaClient = new LambdaClient({});

const MESSAGE_TABLE = "Message";
const USER_TABLE = "User";

export const handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const body = JSON.parse(event.body);
  const content = body.content;
  const chatroomId = body.chatroomId;
  let username = body.username || "Anonymous";
  const timestamp = body.timestamp || new Date().toISOString();


  // If username is Anonymous, look up actual username
  if (username === "Anonymous") {
    const userResult = await dynamo.send(
      new QueryCommand({
        TableName: USER_TABLE,
        KeyConditionExpression: "id = :id",
        ExpressionAttributeValues: {
          ":id": connectionId
        },
        ScanIndexForward: false,
        Limit: 1
      })
    );

    if (userResult.Items?.length) {
      username = userResult.Items[0].username;
    }
  }

  // Save message in DynamoDB
  try {
    await dynamo.send(
      new PutCommand({
        TableName: MESSAGE_TABLE,
        Item: {
          chatroomId,
          timestamp,
          userId: connectionId,
          username,
          content
        }
      })
    );
  } catch (err) {
    console.error("Failed to save message:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Failed to save message" })
    };
  }

  // Broadcast message to all users
  await lambdaClient.send(
    new InvokeCommand({
      FunctionName: "broadcastMessage",
      Payload: JSON.stringify({
        chatroomId,
        username,
        content,
        timestamp,
        domain: event.requestContext.domainName,
        stage: event.requestContext.stage,
        exclude: connectionId
      })
    })
  );

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Message sent"})
  };
};
