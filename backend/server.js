import express from 'express'; // restarted
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import colors from 'colors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Security Middlewares
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map(url => url.trim())
  : ['http://localhost:5173', 'http://localhost:5174'];

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
})); // Set security HTTP headers
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`.cyan);

  socket.on('join', (data) => {
    if (data.userId) {
      socket.join(data.userId);
      console.log(`Socket ${socket.id} joined personal room: ${data.userId}`.blue);
    }
    if (data.role) {
      socket.join(data.role);
      console.log(`Socket ${socket.id} joined role room: ${data.role}`.blue);
    }
    if (data.mallId) {
      socket.join(`mall_${data.mallId}`);
      console.log(`Socket ${socket.id} joined mall room: mall_${data.mallId}`.blue);
    }
    if (data.shopId) {
      socket.join(`shop_${data.shopId}`);
      console.log(`Socket ${socket.id} joined shop room: shop_${data.shopId}`.green);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`.gray);
  });
});

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api', limiter);

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads folder
const __dirname = path.resolve();
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// Mount routers (Placeholder for now)
app.get('/', (req, res) => {
  res.send('Smart Mall API is running...');
});

// Import Routes
import userRoutes from './routes/userRoutes.js';
import mallRoutes from './routes/mallRoutes.js';
import shopRoutes from './routes/shopRoutes.js';
import productRoutes from './routes/productRoutes.js';
import parkingRoutes from './routes/parkingRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import restroomRoutes from './routes/restroomRoutes.js';
import offerRoutes from './routes/offerRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import activityLogRoutes from './routes/activityLogRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';

app.use('/api/users', userRoutes);
app.use('/api/malls', mallRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/products', productRoutes);
app.use('/api/parking', parkingRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/restrooms', restroomRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/activitylogs', activityLogRoutes);
app.use('/api/complaints', complaintRoutes);

// Error middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold);
});
