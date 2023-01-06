import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as logsdestinations from 'aws-cdk-lib/aws-logs-destinations';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import path = require('path');
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const region = cdk.Stack.of(this).region

    const table = new Table(this, "LogTransactionTable", {
      partitionKey: { name: "_pk", type: AttributeType.STRING },
      sortKey: { name: "_sk", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
    })

    const logProcessor = new NodejsFunction(this, "LogProcessor", {
      entry: path.join(__dirname, "../logprocessor/index.ts"),
      runtime: Runtime.NODEJS_18_X,
      environment: {
        TABLE_NAME: table.tableName,
        DYNAMODB_REGION: region,
      }
    })
    table.grantReadWriteData(logProcessor)

    const group = new logs.LogGroup(this, "TestGroup")
    group.addSubscriptionFilter("TestGroupFilter", {
      destination: new logsdestinations.LambdaDestination(logProcessor),
      filterPattern: logs.FilterPattern.allEvents(),
    })
  }
}
