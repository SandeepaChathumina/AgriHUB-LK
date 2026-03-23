import Message from '../models/Message.js';
import User from '../models/User.js';
import { encryptMessage, decryptMessage } from '../utils/messageCrypto.js';

const allowedRoles = ['Farmer', 'Distributor', 'Transporter'];

const canChatWithEachOther = (role1, role2) => {
  const allowedPairs = [
    ['Farmer', 'Distributor'],
    ['Farmer', 'Transporter'],
    ['Distributor', 'Transporter'],
  ];

  return allowedPairs.some(
    ([a, b]) =>
      (role1 === a && role2 === b) || (role1 === b && role2 === a)
  );
};

const formatMessage = (message) => ({
  _id: message._id,
  sender: message.sender,
  receiver: message.receiver,
  content: decryptMessage(message.content),
  isRead: message.isRead,
  createdAt: message.createdAt,
  updatedAt: message.updatedAt,
});

export const sendMessage = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { receiverId, content } = req.body;

    if (!receiverId || !content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Receiver ID and content are required',
      });
    }

    if (senderId.toString() === receiverId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot send a message to yourself',
      });
    }

    const sender = await User.findById(senderId).select('fullName email role');
    const receiver = await User.findById(receiverId).select('fullName email role');

    if (!sender || !receiver) {
      return res.status(404).json({
        success: false,
        message: 'Sender or receiver not found',
      });
    }

    if (
      !allowedRoles.includes(sender.role) ||
      !allowedRoles.includes(receiver.role)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Messaging is only available for farmers, distributors, and transporters',
      });
    }

    if (!canChatWithEachOther(sender.role, receiver.role)) {
      return res.status(403).json({
        success: false,
        message: 'These users are not allowed to chat with each other',
      });
    }

    const encryptedContent = encryptMessage(content.trim());

    const savedMessage = await Message.create({
      sender: senderId,
      receiver: receiverId,
      content: encryptedContent,
    });

    const populatedMessage = await Message.findById(savedMessage._id)
      .populate('sender', 'fullName email role')
      .populate('receiver', 'fullName email role');

    const safeMessage = formatMessage(populatedMessage);

    req.io.to(receiverId).emit('receive_message', safeMessage);
    req.io.to(senderId.toString()).emit('message_sent', safeMessage);

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: safeMessage,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message,
    });
  }
};

export const getConversation = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const otherUserId = req.params.userId;

    const otherUser = await User.findById(otherUserId).select('fullName email role');

    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'fullName email role')
      .populate('receiver', 'fullName email role');

    await Message.updateMany(
      {
        sender: otherUserId,
        receiver: currentUserId,
        isRead: false,
      },
      {
        $set: { isRead: true },
      }
    );

    const decryptedMessages = messages.map(formatMessage);

    return res.status(200).json({
      success: true,
      data: decryptedMessages,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch conversation',
      error: error.message,
    });
  }
};

export const getChatUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const currentUserRole = req.user.role;

    let allowedPartnerRoles = [];

    if (currentUserRole === 'Farmer') {
      allowedPartnerRoles = ['Distributor', 'Transporter'];
    } else if (currentUserRole === 'Distributor') {
      allowedPartnerRoles = ['Farmer', 'Transporter'];
    } else if (currentUserRole === 'Transporter') {
      allowedPartnerRoles = ['Farmer', 'Distributor'];
    }

    const users = await User.find({
      _id: { $ne: currentUserId },
      role: { $in: allowedPartnerRoles },
    }).select('fullName email role phone location');

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch chat users',
      error: error.message,
    });
  }
};

export const getConversationList = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const messages = await Message.find({
      $or: [{ sender: currentUserId }, { receiver: currentUserId }],
    })
      .sort({ createdAt: -1 })
      .populate('sender', 'fullName email role')
      .populate('receiver', 'fullName email role');

    const conversationMap = new Map();

    for (const message of messages) {
      const otherUser =
        message.sender._id.toString() === currentUserId.toString()
          ? message.receiver
          : message.sender;

      if (!conversationMap.has(otherUser._id.toString())) {
        conversationMap.set(otherUser._id.toString(), {
          user: otherUser,
          lastMessage: formatMessage(message),
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: Array.from(conversationMap.values()),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch conversation list',
      error: error.message,
    });
  }
};