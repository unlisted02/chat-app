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
  searchResults: [],
  isSearchLoading: false,
  globalSearchQuery: "",
  starredMessages: [],
  isStarredLoading: false,

  searchMessages: async (q, userId = null) => {
    const query = (q || "").trim();
    if (!query) {
      set({ searchResults: [], isSearchLoading: false });
      return;
    }
    set({ isSearchLoading: true });
    try {
      const params = new URLSearchParams({ q: query });
      if (userId) params.set("userId", userId);
      const res = await axiosInstance.get(`/messages/search?${params.toString()}`);
      set({ searchResults: res.data || [], isSearchLoading: false });
    } catch (error) {
      set({ searchResults: [], isSearchLoading: false });
      toast.error(error.response?.data?.error || "Search failed");
    }
  },

  clearSearchResults: () => set({ searchResults: [], globalSearchQuery: "" }),

  setGlobalSearchQuery: (query) => set({ globalSearchQuery: query || "" }),

  fetchStarredMessages: async () => {
    set({ isStarredLoading: true });
    try {
      const res = await axiosInstance.get("/messages/starred");
      set({ starredMessages: res.data || [], isStarredLoading: false });
    } catch (error) {
      set({ starredMessages: [], isStarredLoading: false });
      toast.error(error.response?.data?.error || "Failed to load starred messages");
    }
  },

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
      toast.error(error.response.data.message);
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
    const { selectedUser, messages, users } = get();
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      const newMessage = res.data;
      set({
        messages: [...messages, newMessage],
        users: users.map((u) =>
          u._id === selectedUser._id ? { ...u, lastMessageAt: newMessage.createdAt } : u
        ),
      });
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
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
      const state = get();
      const { selectedUser, messages, unreadCounts, users } = state;

      const isForOpenChat = selectedUser && newMessage.senderId === selectedUser._id;

      if (isForOpenChat) {
        set({
          messages: [...messages, newMessage],
          users: users.map((u) =>
            u._id === selectedUser._id ? { ...u, lastMessageAt: newMessage.createdAt } : u
          ),
        });
      } else {
        const senderId = newMessage.senderId;
        const current = unreadCounts[senderId] || 0;
        set({
          unreadCounts: {
            ...unreadCounts,
            [senderId]: current + 1,
          },
          users: users.map((u) =>
            u._id === senderId ? { ...u, lastMessageAt: newMessage.createdAt } : u
          ),
        });
      }
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

  setSelectedUser: (selectedUser) =>
    set((state) => {
      if (!selectedUser) {
        return { selectedUser: null };
      }

      const nextUnread = {
        ...state.unreadCounts,
        [selectedUser._id]: 0,
      };

      return {
        selectedUser,
        unreadCounts: nextUnread,
      };
    }),
}));
