const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();

const BUCKET_NAME = process.env.BUCKET_NAME;
const TABLE_NAME = process.env.TABLE_NAME;

exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    const response = {
        statusCode: 200,
        body: '',
    };

    try {
        if (event.httpMethod === 'POST') {
            // Example: Upload data to S3 and save metadata to DynamoDB
            const body = JSON.parse(event.body);
            const { id, content } = body;

            if (!id || !content) {
                throw new Error('id and content are required');
            }

            // Upload to S3
            await s3.putObject({
                Bucket: BUCKET_NAME,
                Key: `${id}.txt`,
                Body: content,
            }).promise();

            // Save metadata to DynamoDB
            await dynamodb.put({
                TableName: TABLE_NAME,
                Item: { id, timestamp: new Date().toISOString() },
            }).promise();

            response.body = JSON.stringify({ message: 'Data saved successfully' });
        } else if (event.httpMethod === 'GET') {
            // Example: Retrieve metadata from DynamoDB
            const params = {
                TableName: TABLE_NAME,
            };
            const result = await dynamodb.scan(params).promise();
            response.body = JSON.stringify(result.Items);
        } else {
            response.statusCode = 400;
            response.body = JSON.stringify({ message: 'Unsupported HTTP method' });
        }
    } catch (error) {
        console.error('Error:', error);
        response.statusCode = 500;
        response.body = JSON.stringify({ message: 'Internal server error', error: error.message });
    }

    return response;
};
