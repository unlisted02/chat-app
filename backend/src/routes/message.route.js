import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  clearChat,
  deleteMessage,
  getMessages,
  getUnreadCounts,
  getUsersForSidebar,
  searchMessages,
  sendMessage,
  updateMessage,
} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/unread-counts", protectRoute, getUnreadCounts);
router.get("/search", protectRoute, searchMessages);
router.get("/:id", protectRoute, getMessages);

router.post("/send/:id", protectRoute, sendMessage);
router.patch("/:id", protectRoute, updateMessage);
router.delete("/with/:id", protectRoute, clearChat);
router.delete("/:id", protectRoute, deleteMessage);

export default router;
