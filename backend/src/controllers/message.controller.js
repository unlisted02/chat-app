import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

const MESSAGE_EDIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    // Mark all messages from this user to me as seen
    await Message.updateMany(
      {
        senderId: userToChatId,
        receiverId: myId,
        seen: false,
      },
      { $set: { seen: true } }
    );

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUnreadCounts = async (req, res) => {
  try {
    const myId = req.user._id;

    const agg = await Message.aggregate([
      {
        $match: {
          receiverId: myId,
          seen: false,
        },
      },
      {
        $group: {
          _id: "$senderId",
          count: { $sum: 1 },
        },
      },
    ]);

    const map = {};
    agg.forEach((row) => {
      map[row._id.toString()] = row.count;
    });

    res.status(200).json(map);
  } catch (error) {
    console.log("Error in getUnreadCounts controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const searchMessages = async (req, res) => {
  try {
    const myId = req.user._id;
    const { q, userId } = req.query;

    if (!q || !q.trim()) {
      return res.status(400).json({ error: "Query 'q' is required" });
    }

    const regex = new RegExp(q.trim(), "i");

    const baseMatch = userId
      ? {
          $or: [
            { senderId: myId, receiverId: userId },
            { senderId: userId, receiverId: myId },
          ],
        }
      : {
          $or: [{ senderId: myId }, { receiverId: myId }],
        };

    const messages = await Message.find({
      ...baseMatch,
      deletedAt: { $exists: false },
      text: { $regex: regex },
    }).sort({ createdAt: -1 });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in searchMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, file, fileName, fileType, replyTo } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    let fileUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image, {
        folder: "chat-app",
        resource_type: "image",
      });
      imageUrl = uploadResponse.secure_url;
    }

    if (file) {
      const uploadResponse = await cloudinary.uploader.upload(file, {
        folder: "chat-app-files",
        resource_type: "raw",
        public_id: fileName || undefined,
      });
      fileUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      fileUrl,
      fileName,
      fileType,
      replyTo: replyTo || null,
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString();
    const { text, isStarred, isPinned } = req.body;

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (message.senderId.toString() !== userId) {
      return res.status(403).json({ error: "You can only edit your own messages" });
    }

    const now = Date.now();
    if (now - message.createdAt.getTime() > MESSAGE_EDIT_WINDOW_MS) {
      return res
        .status(400)
        .json({ error: "You can only edit messages within 1 hour of sending" });
    }

    if (typeof text === "string") {
      message.text = text;
      message.isEdited = true;
      message.editedAt = new Date();
    }

    if (typeof isStarred === "boolean") {
      message.isStarred = isStarred;
    }

    if (typeof isPinned === "boolean") {
      message.isPinned = isPinned;
    }

    await message.save();

    const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageUpdated", message);
    }

    res.status(200).json(message);
  } catch (error) {
    console.log("Error in updateMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString();

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (message.senderId.toString() !== userId) {
      return res.status(403).json({ error: "You can only delete your own messages" });
    }

    message.deletedAt = new Date();
    await message.save();

    const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDeleted", { _id: message._id });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.log("Error in deleteMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const clearChat = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    await Message.deleteMany({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.log("Error in clearChat controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
