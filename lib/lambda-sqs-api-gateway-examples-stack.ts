import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { AwsIntegration, LambdaRestApi, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';

export class LambdaSqsApiGatewayExamplesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create the SQS queue
    const queue = new Queue(this, 'Queue');

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

    const integrationRole = new Role(this, 'integration-role', {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com')
    });

    queue.grantSendMessages(integrationRole);

    const sendMessageIntegration = new AwsIntegration({
      service: 'sqs',
      path: `${process.env.CDK_DEFAULT_ACCOUNT}/${queue.queueName}`,
      integrationHttpMethod: 'POST',
      options: {
        credentialsRole: integrationRole,
        requestParameters: {
          'integration.request.header.Content-Type': `'application/x-www-form-urlencoded'`
        },
        requestTemplates: {
          'application/json': 'Action=SendMessage&MessageBody=$input.body'
        },
        integrationResponses: [
          {
            statusCode: '200'
          },
          {
            statusCode: '400'
          },
          {
            statusCode: '500'
          }
        ]
      }
    });

    // Rest API
    const api = new RestApi(this, 'api', {});

    api.root.addMethod('POST', sendMessageIntegration, {
      methodResponses: [
        {
          statusCode: '400'
        },
        {
          statusCode: '200'
        },
        {
          statusCode: '500'
        }
      ]
    })
  }
}
