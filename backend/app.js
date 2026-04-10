import express from 'express';
import bodyParser from 'body-parser';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

// Route Imports
import authRoutes from './routes/authRoutes.js'; 
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js'; 
import userRoutes from './routes/userRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import tripRoutes from './routes/tripRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import messageRoutes from './routes/messageRoutes.js';

const app = express();
const server = http.createServer(app);

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true
}));

app.use(bodyParser.json());

// Pass IO instance to every request
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Socket.io Logic
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User joined room: ${userId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/notifications', notificationRoutes); 
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/messages', messageRoutes);

// Export app for testing and server for index.js
export { app, server };