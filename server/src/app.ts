import 'source-map-support/register';

import { APIGatewayEvent, APIGatewayProxyHandler, Context } from 'aws-lambda';
import * as awsServerlessExpress from 'aws-serverless-express';
import * as express from 'express';

const app = express();
const server = awsServerlessExpress.createServer(app);
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(cors({ origin: true }));

app.get('/', (req: express.Request, res: express.Response) => {
  res.json({ hello: 'world' });
});

app.get('/video/show', (req: express.Request, res: express.Response) => {
  res.json({ video_url: 'https://taptappun.s3-ap-northeast-1.amazonaws.com/project/spajam5th2020/sample.mp4' });
})

export const handler: APIGatewayProxyHandler = (event: APIGatewayEvent, context: Context) => {
  awsServerlessExpress.proxy(server, event, context);
};
