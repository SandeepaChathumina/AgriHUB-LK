/* eslint-env jest */
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../../app.js'; 
import User from '../../models/User.js';
import Notification from '../../models/Notification.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoServer.getUri());
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany({});
  await Notification.deleteMany({});
});

const getAuthToken = async (email, role) => {
  const password = 'Password123!';
  await request(app).post('/api/auth/register').send({
    fullName: `${role} User`,
    email,
    password,
    phone: '0711111111',
    role,
    nicNumber: '199012345678',
    farmSize: 5
  });

  const res = await request(app).post('/api/auth/login').send({ email, password });
  return { token: res.body.token, id: res.body.user._id || res.body.user.id };
};

describe('Notification Routes Integration', () => {

  it('1. Admin Flow: Send, Update, and Delete Notifications', async () => {
    const admin = await getAuthToken('admin@test.com', 'Admin');
    const farmer = await getAuthToken('farmer@test.com', 'Farmer');

    // ACT: Admin sends a notification (Matching your targetType logic)
    const sendRes = await request(app)
      .post('/api/notifications/admin/send')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        targetType: 'Single',
        userId: farmer.id,
        title: 'Account Verified',
        message: 'Your farmer profile is now active.',
        type: 'Account'
      });

    expect(sendRes.status).toBe(201);
    expect(sendRes.body.message).toContain('successfully');

    // Since your controller doesn't return the ID, we find it in the DB
    const createdNotif = await Notification.findOne({ recipient: farmer.id });
    const notificationId = createdNotif._id;

    // ACT: Admin updates the notification
    const updateRes = await request(app)
      .put(`/api/notifications/admin/manage/${notificationId}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ title: 'Updated Title', message: 'New message body' });

    expect(updateRes.status).toBe(200);

    // ACT: Admin deletes the notification
    const deleteRes = await request(app)
      .delete(`/api/notifications/admin/manage/${notificationId}`)
      .set('Authorization', `Bearer ${admin.token}`);

    expect(deleteRes.status).toBe(200);
    
    const findInDb = await Notification.findById(notificationId);
    expect(findInDb).toBeNull();
  });

  it('2. User Flow: Receive and Mark as Read', async () => {
    const admin = await getAuthToken('admin2@test.com', 'Admin');
    const farmer = await getAuthToken('farmer2@test.com', 'Farmer');

    const dummyNotif = await Notification.create({
      recipient: farmer.id,
      sender: admin.id,
      title: 'New Price Update',
      message: 'Carrot prices went up!',
    });

    // ACT: Farmer gets their own inbox
    const fetchRes = await request(app)
      .get('/api/notifications/my-notifications')
      .set('Authorization', `Bearer ${farmer.token}`);

    expect(fetchRes.status).toBe(200);
    // Matching your controller's key "notifications"
    expect(fetchRes.body.notifications.length).toBe(1);

    // ACT: Mark as read
    const readRes = await request(app)
      .put(`/api/:id/read`.replace(':id', dummyNotif._id)) // Using your specific route
      .set('Authorization', `Bearer ${farmer.token}`);

    // Wait! Your route is /api/notifications/:id/read
    const fixedReadRes = await request(app)
      .put(`/api/notifications/${dummyNotif._id}/read`)
      .set('Authorization', `Bearer ${farmer.token}`);

    expect(fixedReadRes.status).toBe(200);

    const updatedNotif = await Notification.findById(dummyNotif._id);
    expect(updatedNotif.isRead).toBe(true);
  });

  it('3. Security: Unauthorized Role Access', async () => {
    const farmer = await getAuthToken('farmer3@test.com', 'Farmer');

    // Attempt to access Admin management
    const response = await request(app)
      .get('/api/notifications/admin/manage')
      .set('Authorization', `Bearer ${farmer.token}`);

    expect(response.status).toBe(403);
  });
});