/* eslint-env jest */
import httpMocks from 'node-mocks-http';
import { 
  sendMessage, 
  getConversation, 
  getChatUsers, 
  getConversationList 
} from '../messageController.js';
import Message from '../../models/Message.js';
import User from '../../models/User.js';
import { encryptMessage, decryptMessage } from '../../utils/messageCrypto.js';

// --- MOCK DEPENDENCIES ---
jest.mock('../../models/Message.js');
jest.mock('../../models/User.js');
jest.mock('../../utils/messageCrypto.js');

describe('Message Controller Unit Tests', () => {
  let req, res, mockIo;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Socket.io methods
    mockIo = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };

    res = httpMocks.createResponse();
    req = httpMocks.createRequest({
      user: { _id: 'user1_id', role: 'Farmer' },
      io: mockIo
    });
  });

  describe('1. sendMessage', () => {
    it('should return 400 if receiverId or content is missing', async () => {
      req.body = { receiverId: 'user2_id', content: '' };

      await sendMessage(req, res);

      expect(res.statusCode).toBe(400);
      expect(res._getJSONData().message).toContain('Receiver ID and content are required');
    });

    it('should return 400 if user tries to message themselves', async () => {
      req.body = { receiverId: 'user1_id', content: 'Hello myself' };

      await sendMessage(req, res);

      expect(res.statusCode).toBe(400);
      expect(res._getJSONData().message).toContain('cannot send a message to yourself');
    });

    it('should return 403 if roles are not allowed to chat (e.g., Farmer to Farmer)', async () => {
      req.body = { receiverId: 'user2_id', content: 'Hello neighbor' };

      User.findById.mockImplementation((id) => ({
        select: jest.fn().mockResolvedValue({ 
          _id: id, 
          role: 'Farmer' 
        })
      }));

      await sendMessage(req, res);

      expect(res.statusCode).toBe(403);
    });

    it('should successfully send an encrypted message between allowed roles', async () => {
      req.body = { receiverId: 'user2_id', content: 'Hello Distributor' };
      
      encryptMessage.mockReturnValue('encrypted_text');
      decryptMessage.mockReturnValue('Hello Distributor');

      User.findById.mockImplementation((id) => ({
        select: jest.fn().mockResolvedValue({ 
          _id: id, 
          role: id === 'user1_id' ? 'Farmer' : 'Distributor' 
        })
      }));

      const savedMsgMock = { _id: 'msg123', content: 'encrypted_text' };
      Message.create.mockResolvedValue(savedMsgMock);

      // FIX: Proper Mongoose Chaining Mock
      Message.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue({
            _id: 'msg123',
            sender: { _id: 'user1_id', fullName: 'Farmer John' },
            receiver: { _id: 'user2_id', fullName: 'Distri Bob' },
            content: 'encrypted_text',
            isRead: false,
            createdAt: new Date(),
            updatedAt: new Date()
          })
        })
      });

      await sendMessage(req, res);

      expect(res.statusCode).toBe(201);
      expect(encryptMessage).toHaveBeenCalledWith('Hello Distributor');
      expect(Message.create).toHaveBeenCalled();
      expect(mockIo.to).toHaveBeenCalledWith('user2_id');
      expect(mockIo.emit).toHaveBeenCalledWith('receive_message', expect.any(Object));
    });
  });

  describe('2. getConversation', () => {
    it('should return 404 if the other user does not exist', async () => {
      req.params = { userId: 'fake_user' };
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      await getConversation(req, res);

      expect(res.statusCode).toBe(404);
    });

    it('should fetch, mark as read, and decrypt the conversation', async () => {
      req.params = { userId: 'user2_id' };
      
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: 'user2_id', role: 'Distributor' })
      });

      // FIX: Proper Mongoose Chaining Mock for find().sort().populate().populate()
      Message.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue([
              { 
                _id: 'msg1', 
                content: 'encrypted1', 
                sender: 'user1_id', 
                receiver: 'user2_id',
                isRead: false 
              }
            ])
          })
        })
      });

      Message.updateMany.mockResolvedValue({ modifiedCount: 1 });
      decryptMessage.mockReturnValue('decrypted_message');

      await getConversation(req, res);

      expect(res.statusCode).toBe(200);
      expect(Message.updateMany).toHaveBeenCalled();
      expect(decryptMessage).toHaveBeenCalledWith('encrypted1');
    });
  });

  describe('3. getChatUsers', () => {
    it('should return a list of allowed partner users based on role', async () => {
      const mockPartners = [
        { _id: 'user2', role: 'Distributor' },
        { _id: 'user3', role: 'Transporter' }
      ];

      User.find.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockPartners)
      });

      await getChatUsers(req, res);

      expect(res.statusCode).toBe(200);
      expect(res._getJSONData().data.length).toBe(2);
    });
  });

  describe('4. getConversationList', () => {
    it('should return a list of grouped conversations with unread counts', async () => {
      const mockMessages = [
        { 
          _id: 'msg1', 
          content: 'enc_text',
          sender: { _id: 'user1_id' }, 
          receiver: { _id: 'user2_id', fullName: 'Partner User' },
          isRead: false
        }
      ];

      // FIX: Proper Mongoose Chaining Mock
      Message.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockMessages)
          })
        })
      });

      Message.countDocuments.mockResolvedValue(3);
      decryptMessage.mockReturnValue('Hello there');

      await getConversationList(req, res);

      const responseData = res._getJSONData();
      expect(res.statusCode).toBe(200);
      expect(responseData.data.length).toBe(1);
      expect(responseData.data[0].unreadCount).toBe(3);
      expect(responseData.data[0].lastMessage.content).toBe('Hello there');
    });
  });
});