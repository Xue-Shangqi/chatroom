import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const username = event.queryStringParameters.username || "Anonymous";

  await dynamo.send(new PutCommand({
    TableName: 'User',
    Item: {
      id: connectionId,
      username,
      joinedAt: new Date().toISOString()
    }
  }));

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `${connectionId} inserted in table successfully`,
    })
  };
};
