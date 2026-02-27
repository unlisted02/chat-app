import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  replyTo: null,
  editingMessage: null,
  unreadCounts: {},
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  fetchUnreadCounts: async () => {
    try {
      const res = await axiosInstance.get("/messages/unread-counts");
      set({ unreadCounts: res.data });
    } catch (error) {
      // silent
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  setReplyTo: (message) => set({ replyTo: message }),
  clearReplyTo: () => set({ replyTo: null }),

  forwardMessage: async (targetUserId, messageData) => {
    try {
      await axiosInstance.post(`/messages/send/${targetUserId}`, messageData);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to forward message");
    }
  },

  setEditingMessage: (message) => set({ editingMessage: message }),
  clearEditingMessage: () => set({ editingMessage: null }),

  updateMessage: async (messageId, payload) => {
    try {
      const res = await axiosInstance.patch(`/messages/${messageId}`, payload);
      set({
        messages: get().messages.map((m) => (m._id === messageId ? res.data : m)),
      });
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update message");
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await axiosInstance.delete(`/messages/${messageId}`);
      set({
        messages: get().messages.filter((m) => m._id !== messageId),
      });
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete message");
    }
  },

  clearChat: async (userId) => {
    try {
      await axiosInstance.delete(`/messages/with/${userId}`);
      set({ messages: [] });
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to clear chat");
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      set({
        messages: [...get().messages, newMessage],
      });
    });

    socket.on("messageUpdated", (updatedMessage) => {
      set({
        messages: get().messages.map((m) => (m._id === updatedMessage._id ? updatedMessage : m)),
      });
    });

    socket.on("messageDeleted", (payload) => {
      const deletedId = payload?._id;
      if (!deletedId) return;
      set({
        messages: get().messages.map((m) =>
          m._id === deletedId ? { ...m, deletedAt: new Date().toISOString() } : m
        ),
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
     socket.off("messageUpdated");
     socket.off("messageDeleted");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
