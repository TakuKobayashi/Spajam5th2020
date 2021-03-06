import 'source-map-support/register';

import { APIGatewayEvent, APIGatewayProxyHandler, Context } from 'aws-lambda';
import * as awsServerlessExpress from 'aws-serverless-express';
import * as express from 'express';
const axios = require('axios');

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
  const { tokens } = await oauth2Client.getToken(req.query.code);
  console.log(tokens);
  const responseMedias = await loadPhotos(tokens.access_token)
  res.json({...req.query, ...tokens});
});

async function loadPhotos(accessToken: string){
  const photos = new Photos(accessToken);
  const photosResponse = await photos.transport.get("v1/mediaItems", {pageSize: 10})
  const requests = [];
  for(const mediaItem of photosResponse.mediaItems) {
    const response = await axios.get(mediaItem.baseUrl, {responseType: 'arraybuffer'});
    //fs.writeFileSync(mediaItem.filename, response.data);
    fs.writeFileSync('/tmp/' + mediaItem.filename, response.data);
  }

  return photosResponse.mediaItems;
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

app.post('/video/generate', (req: express.Request, res: express.Response) => {
  res.json({ success: true, video_url: 'https://taptappun.s3-ap-northeast-1.amazonaws.com/project/spajam5th2020/sample.mp4' });
});

app.get('/video/show', async (req: express.Request, res: express.Response) => {
  const responseMedias = await loadPhotos("ya29.a0AfH6SMCCmjCV9Q53MY0IB3UWmgH6dncSaOxAv6VI6Vp7Xz2aq_k-u1ayhpNBhPy2NuPeA4Dt7I-Byhl0rU_sGJvVWwivJ9i9LV93DWFeBeS7_V3LUV6oVXufLVsHwU2tiNyXadGh_Vu8-iG8c49HmDHkRBzVTpFFN7s")
  res.json({ video_url: 'https://taptappun.s3-ap-northeast-1.amazonaws.com/project/spajam5th2020/sample.mp4' });
});

export const handler: APIGatewayProxyHandler = (event: APIGatewayEvent, context: Context) => {
  awsServerlessExpress.proxy(server, event, context);
};
