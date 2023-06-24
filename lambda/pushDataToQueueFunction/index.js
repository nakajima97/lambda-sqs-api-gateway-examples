exports.handler = async (event) => {
  console.log({ event });
  // リクエストデータを取得するなどの処理を行います
  const requestData = event.body;

  // SQSキューにデータをプッシュします
  // QUEUE_URLはLambda関数の環境変数から取得します
  const params = {
    MessageBody: requestData,
    QueueUrl: process.env.QUEUE_URL,
  };

  // SQSへのデータプッシュ処理
  // 例: AWS SDKを使用してSQSにデータをプッシュする処理を行う
  const AWS = require("aws-sdk");
  const sqs = new AWS.SQS();
  await sqs.sendMessage(params).promise();

  // レスポンスを返します
  return {
    statusCode: 200,
    body: "Data pushed to SQS",
  };
};
