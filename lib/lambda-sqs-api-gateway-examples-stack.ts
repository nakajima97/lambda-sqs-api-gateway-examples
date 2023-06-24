import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

export class LambdaSqsApiGatewayExamplesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create the SQS queue
    const queue = new Queue(this, 'Queue');

    // Create the Lambda function for pushing data to SQS
    const pushDataToQueueFunction = new Function(this, 'PushDataToQueueFunction', {
      runtime: Runtime.NODEJS_14_X,
      handler: 'index.handler',
      code: Code.fromAsset('lambda/pushDataToQueueFunction'),
      environment: {
        QUEUE_URL: queue.queueUrl
      },
      timeout: cdk.Duration.seconds(10),
    });

    // Create the Lambda function for processing data from SQS
    const processDataFromQueueFunction = new Function(this, 'ProcessDataFromQueueFunction', {
      runtime: Runtime.NODEJS_14_X,
      handler: 'index.handler',
      code: Code.fromAsset('lambda/processDataFromQueueFunction'),
      timeout: cdk.Duration.seconds(10),
      environment: {
        QUEUE_URL: queue.queueUrl
      },
    });
    processDataFromQueueFunction.addEventSource(new SqsEventSource(queue));

    // Create the API Gateway
    new LambdaRestApi(this, 'Endpoint', {
      handler: pushDataToQueueFunction
    });

    pushDataToQueueFunction.addToRolePolicy(new PolicyStatement({ actions: ['sqs:SendMessage'], resources: [queue.queueArn] }))
  }
}
