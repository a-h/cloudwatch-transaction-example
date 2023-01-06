import {
	DynamoDBDocumentClient,
	GetCommand,
	PutCommand,
	QueryCommand,
	UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

// Create a default client.
const ddbClient = new DynamoDBClient({ region: process.env.DYNAMODB_REGION })
let client = DynamoDBDocumentClient.from(ddbClient)

let table = process.env.TABLE_NAME;

export async function init(c: DynamoDBDocumentClient, tableName: string) {
	client = c;
	table = tableName;
}

export async function query<T>(pk: string): Promise<Array<T> | null> {
	const params = new QueryCommand({
		TableName: table,
		ConsistentRead: true,
		KeyConditionExpression: "#pk = :pk",
		ExpressionAttributeNames: {
			"#pk": "_pk",
		},
		ExpressionAttributeValues: {
			":pk": pk,
		},
	});
	const result = await client.send(params)
	return result.Items ? result.Items as Array<T> : null
}

export async function put<T>(pk: string, sk: string, data: T): Promise<void> {
	const put = new PutCommand({
		TableName: table,
		Item: {
			"_pk": pk,
			"_sk": sk,
			...data,
		},
	})
	await client.send(put)
}
