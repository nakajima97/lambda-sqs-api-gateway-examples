import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Function, Runtime, AssetCode, Code } from 'aws-cdk-lib/aws-lambda';

export class LambdaSqsApiGatewayExamplesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new Function(this, 'Gateway', {
      functionName: 'Gateway',
      handler: "gateway.handler",
      runtime: Runtime.NODEJS_14_X,
      code: Code.fromAsset(`./lambda`),
      memorySize: 512,
      timeout: cdk.Duration.seconds(10),
    });
  }
}
