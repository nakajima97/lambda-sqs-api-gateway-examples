exports.handler = async (event) => {
  // SQSキューからデータを取得します
  // 例: AWS SDKを使用してSQSからデータを取得する処理を行う
  const AWS = require("aws-sdk");
  const sqs = new AWS.SQS();
  const params = {
    QueueUrl: process.env.QUEUE_URL,
    MaxNumberOfMessages: 1,
    VisibilityTimeout: 10,
    WaitTimeSeconds: 0,
  };
  const data = await sqs.receiveMessage(params).promise();

  // 取得したデータをログに出力します
  event.Records.forEach((record) => {
    const { body } = record;
    console.log({ body });
  });

  // レスポンスを返します
  return {
    statusCode: 200,
    body: "Data processed from SQS",
  };
};
