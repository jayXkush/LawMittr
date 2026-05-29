import express from 'express';
import cors from 'cors';
import { allowedClientOrigins, env } from './config/env';
import routes from './routes';
import { notFound, errorHandler } from './middleware/error.middleware';
import { razorpayWebhook } from './controllers/payment.controller';

const app = express();


app.use(
  cors({
    origin: allowedClientOrigins,
    credentials: true,
  })
);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'backend' });
});



app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  razorpayWebhook
);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
