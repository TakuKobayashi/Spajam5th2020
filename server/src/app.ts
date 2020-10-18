import 'source-map-support/register';

import { APIGatewayEvent, APIGatewayProxyHandler, Context } from 'aws-lambda';
import * as awsServerlessExpress from 'aws-serverless-express';
import * as express from 'express';
import axios from 'axios';

const { google } = require('googleapis');
const Photos = require('googlephotos');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_OAUTH_CLIENT_ID,
  process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  //"https://localhost:3000/dev/google/oauth/callback"
  "https://2wvmez8c6g.execute-api.ap-northeast-1.amazonaws.com/production/google/oauth/callback"
);

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
  const response = await axios.get('https://taptappun.s3-ap-northeast-1.amazonaws.com/project/spajam5th2020/a13f5814-a81a-4a78-9141-7de186e412f6.mp4', {
    responseType: 'arraybuffer',
  });
  const filename = uuid();
  fs.writeFileSync('/tmp/' + filename + '.mp4', res.data);
  const command = ffmpeg('/tmp/' + filename + '.mp4');
  command
    .output('/tmp/sample.mp4')
    .noAudio()
    .on('end', async function() {
      const putResponse = await s3
        .putObject({
          Bucket: 'taptappun',
          Key: 'project/spajam5th2020/' + filename + '.mp4',
          Body: fs.readFileSync('/tmp/sample.mp4'),
          ACL: 'public-read',
        })
        .promise();
        res.json({ hello: 'world' });
    })
    .run();

  //  const putResponse = await s3.putObject({Bucket: "taptappun", Key: "project/spajam5th2020/" + filename + ".mp4", Body: response.data, ACL: 'public-read'}).promise()
});

app.get('/google/auth', (req: express.Request, res: express.Response) => {
  const scopes = [
    Photos.Scopes.READ_ONLY,
    Photos.Scopes.SHARING,
  ];
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes
  });
  res.redirect(url);
});

app.get('/google/oauth/callback', async (req: express.Request, res: express.Response) => {
  oauth2Client.on('tokens', (ontokens) => {
    console.log("-------------------------------");
    console.log(ontokens);
  });
  const { tokens } = await oauth2Client.getToken(req.query.code);
  console.log(tokens);
  res.json({...req.query, ...ontokens});
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
