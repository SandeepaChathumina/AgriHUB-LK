import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv'; 

dotenv.config();

import authRoutes from './routes/authRoutes.js'; 
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import orderRoutes from './routes/orderRoutes.js'; 
import notificationRoutes from './routes/notificationRoutes.js';

const app = express();

app.use(bodyParser.json());

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/notifications', notificationRoutes); 

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.log('Connection failed:', err.message); 
  });

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});