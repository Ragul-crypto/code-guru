const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Lambda entry point
exports.handler = async (event) => {
  const { body } = event;
  const bucketName = process.env.BUCKET_NAME;
  const tableName = process.env.TABLE_NAME;

  // Log the event
  console.log("Event received:", JSON.stringify(event, null, 2));

  try {
    // 1. Upload data to S3
    const s3Response = await s3.putObject({
      Bucket: bucketName,
      Key: `uploads/${Date.now()}.txt`, // Example file key
      Body: body, // The body of the request is uploaded to S3
    }).promise();

    console.log('S3 Upload Response:', s3Response);

    // 2. Store metadata in DynamoDB
    const dynamoResponse = await dynamoDB.put({
      TableName: tableName,
      Item: {
        id: Date.now().toString(), // Use timestamp as unique ID
        uploadedAt: new Date().toISOString(),
        fileKey: `uploads/${Date.now()}.txt`,
      },
    }).promise();

    console.log('DynamoDB Response:', dynamoResponse);

    // Return the success response
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'File uploaded successfully!',
        s3Response,
        dynamoResponse,
      }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal Server Error',
        error: error.message,
      }),
    };
  }
};
