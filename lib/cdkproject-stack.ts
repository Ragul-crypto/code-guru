import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import * as path from 'path';

export class CdkprojectStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. Create an S3 Bucket
    const s3Bucket = new s3.Bucket(this, 'MyBucket', {
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Only for dev environments
    });

    // 2. Create a DynamoDB Table
    const dynamoTable = new dynamodb.Table(this, 'MyTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      tableName: 'MyTable',
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Only for dev environments
    });

    // 3. Create a Lambda Function
    const lambdaFunction = new lambda.Function(this, 'MyFunction', {
      runtime: lambda.Runtime.NODEJS_20_X, // Lambda runtime environment
      handler: 'index.handler', // Lambda function entry point
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')), // Corrected path to 'lambda' directory
      environment: {
        BUCKET_NAME: s3Bucket.bucketName,
        TABLE_NAME: dynamoTable.tableName,
      },
    });

    // Grant the Lambda function permissions to access the S3 bucket and DynamoDB table
    s3Bucket.grantReadWrite(lambdaFunction);
    dynamoTable.grantReadWriteData(lambdaFunction);

    // 4. Create an API Gateway
    const api = new apigateway.RestApi(this, 'MyApi', {
      restApiName: 'MyService',
      description: 'This service serves Lambda functions.',
    });

    const lambdaIntegration = new apigateway.LambdaIntegration(lambdaFunction);

    // Create a `/upload` endpoint that triggers the Lambda function
    api.root.addResource('upload').addMethod('POST', lambdaIntegration); // POST /upload

    // Output the API Gateway URL
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url ?? 'Something went wrong with the API Gateway creation!',
    });
  }
}
