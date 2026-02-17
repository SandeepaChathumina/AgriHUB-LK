import express from 'express';
import bodyParser from 'body-parser';
import mongoose, { mongo } from 'mongoose';

//import routes

//import models


const app = express();

mongoose.connect('mongodb+srv://sandeepa:sandeepapass@cluster0.qyhffjr.mongodb.net/?appName=Cluster0').then(
  () => {
    console.log('Connected to MongoDB');
  }
).catch(
  () => {
    console.log('Connection failed');
  }
);

app.use(bodyParser.json());

//routes

 
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});


//mongodb+srv://sandeepa:sandeepapass@cluster0.qyhffjr.mongodb.net/?appName=Cluster0