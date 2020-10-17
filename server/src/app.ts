import 'source-map-support/register';

import { APIGatewayEvent, APIGatewayProxyHandler, Context } from 'aws-lambda';
import * as awsServerlessExpress from 'aws-serverless-express';
import * as express from 'express';
import axios from 'axios';

const fs = require('fs');

const { v4: uuid } = require('uuid');
const ffmpeg = require('fluent-ffmpeg');
const command = ffmpeg();

const aws = require('aws-sdk');
const s3 = new aws.S3({ apiVersion: '2006-03-01' });

const app = express();
const server = awsServerlessExpress.createServer(app);
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(cors({ origin: true }));

app.get('/', async (req: express.Request, res: express.Response) => {
  const response = await axios.get("https://mov.20th-meijiyasuda-kazumasaoda.jp/upload/jKhEd__2FlIZtUrQVTzXrTfxg__3D__3D/out.mp4", {responseType: 'arraybuffer'});
  const filename = uuid();
  //fs.writeFileSync('/tmp/' + filename + '.mp4', res.data);
  const putResponse = await s3.putObject({Bucket: "taptappun", Key: "project/spajam5th2020/" + filename + ".mp4", Body: response.data, ACL: 'public-read'}).promise()
  console.log(putResponse);
  res.json({ hello: 'world' });
});

app.post('/video/generate', (req: express.Request, res: express.Response) => {
  res.json({ success: true, video_url: 'https://taptappun.s3-ap-northeast-1.amazonaws.com/project/spajam5th2020/sample.mp4' });
});

app.get('/video/show', (req: express.Request, res: express.Response) => {
  res.json({ video_url: 'https://taptappun.s3-ap-northeast-1.amazonaws.com/project/spajam5th2020/sample.mp4' });
});

export const handler: APIGatewayProxyHandler = (event: APIGatewayEvent, context: Context) => {
  awsServerlessExpress.proxy(server, event, context);
};
