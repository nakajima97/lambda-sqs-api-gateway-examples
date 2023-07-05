import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { AwsIntegration, RestApi, MethodResponse, Model, JsonSchemaVersion, JsonSchemaType, RequestValidator, MethodOptions } from 'aws-cdk-lib/aws-apigateway';
import { Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';

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

    // ロールの作成
    const integrationRole = new Role(this, 'integration-role', {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com')
    });

    // ロールのアタッチ
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
            statusCode: '200',
            responseTemplates: {
              'application/json': '{ "result": true, "message": "Success!!" }'
            }
          },
          {
            statusCode: '400',
            responseTemplates: {
              'application/json': '{ "result": false, "message": "Bad Request." }'
            }
          },
          {
            statusCode: '500',
            responseTemplates: {
              'application/json': '{ "result": false, "message": "Internal server error." }'
            }
          }
        ]
      }
    });

    // Rest API
    const api = new RestApi(this, 'api', {});

    const responseModelSuccess = api.addModel('responseModelSuccess', {
      contentType: 'application/json',
      modelName: 'Success',
      schema: {
        schema: JsonSchemaVersion.DRAFT4,
        title: 'success',
        type: JsonSchemaType.OBJECT,
        properties: {
          result: { type: JsonSchemaType.BOOLEAN },
          message: { type: JsonSchemaType.STRING }
        }
      }
    })

    const requestValidationModel = api.addModel('requestValidationModel', {
      contentType: 'application/json',
      modelName: 'requestValidationModel',
      schema: {
        schema: JsonSchemaVersion.DRAFT4,
        title: 'requestValidationModel',
        type: JsonSchemaType.OBJECT,
        properties: {
          text: { type: JsonSchemaType.STRING },
          date: { type: JsonSchemaType.STRING, format: "date-time" },
          pet: { type: JsonSchemaType.STRING, enum: ["dog", "cat", "fish", "bird", "gecko"] }
        },
        required: ['date', 'text', 'pet']
      }
    })

    api.root.addMethod('POST', sendMessageIntegration, {
      requestValidator: new RequestValidator(this, 'body-validator', {
        restApi: api,
        validateRequestBody: true,
        validateRequestParameters: true
      }),
      requestModels: {
        'application/json': requestValidationModel
      },
      requestParameters: {
        'method.request.header.MyHeader': true,
      },
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': responseModelSuccess
          }
        },
        {
          statusCode: '400',
          responseModels: {
            'application/json': Model.ERROR_MODEL
          }
        },
        {
          statusCode: '500',
          responseModels: {
            'application/json': Model.ERROR_MODEL
          }
        }
      ]
    })
  }
}
