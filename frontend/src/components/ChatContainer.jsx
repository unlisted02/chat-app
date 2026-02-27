import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import {
  MoreVertical,
  Clipboard,
  CornerDownLeft,
  Edit2,
  Trash2,
  Star,
  Pin,
  ArrowUpRight,
} from "lucide-react";

const MESSAGE_EDIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

const ChatContainer = () => {
  const {
    messages,
    users,
    getMessages,
    getUsers,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    updateMessage,
    deleteMessage,
    sendMessage,
    setReplyTo,
    setEditingMessage,
    forwardMessage,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const [menuOpenForId, setMenuOpenForId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);
  const [messageToForward, setMessageToForward] = useState(null);

  useEffect(() => {
    getMessages(selectedUser._id);

    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (isForwardModalOpen && users.length === 0) {
      getUsers();
    }
  }, [isForwardModalOpen, users.length, getUsers]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleCopy = async (text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  };

  const handleDelete = (id) => {
    deleteMessage(id);
    setMenuOpenForId(null);
  };

  const handleEdit = (message) => {
    setReplyTo(null);
    setEditingMessage(message);
    setMenuOpenForId(null);
  };

  const toggleStar = async (message) => {
    await updateMessage(message._id, { isStarred: !message.isStarred });
    setMenuOpenForId(null);
  };

  const togglePin = async (message) => {
    await updateMessage(message._id, { isPinned: !message.isPinned });
    setMenuOpenForId(null);
  };

  const handleReply = (message) => {
    setReplyTo(message);
    setMenuOpenForId(null);
  };

  const handleForward = (message) => {
    if (!message.text && !message.image && !message.fileUrl) {
      setMenuOpenForId(null);
      return;
    }
    setMessageToForward(message);
    setIsForwardModalOpen(true);
    setMenuOpenForId(null);
  };

  const handleForwardToUser = async (user) => {
    if (!messageToForward) return;

    const payload = {};

    if (messageToForward.text) {
      payload.text = messageToForward.text;
    }

    if (messageToForward.image) {
      payload.imageUrl = messageToForward.image;
    }

    if (messageToForward.fileUrl) {
      payload.fileUrl = messageToForward.fileUrl;
      if (messageToForward.fileName) payload.fileName = messageToForward.fileName;
      if (messageToForward.fileType) payload.fileType = messageToForward.fileType;
    }

    await forwardMessage(user._id, payload);
    setIsForwardModalOpen(false);
    setMessageToForward(null);
  };

  const closeForwardModal = () => {
    setIsForwardModalOpen(false);
    setMessageToForward(null);
  };

  if (isMessagesLoading) {
    return (
      <div className="flex flex-col flex-1 overflow-auto">
        <ChatHeader searchTerm={searchTerm} onSearchTermChange={setSearchTerm} />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  const filteredMessages = messages.filter((m) =>
    searchTerm.trim()
      ? (m.text || m.fileName || "").toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <ChatHeader searchTerm={searchTerm} onSearchTermChange={setSearchTerm} />

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {filteredMessages.map((message) => {
          const isOwn = message.senderId === authUser._id;
          const isDeleted = !!message.deletedAt;
          const replyMessage =
            message.replyTo && messages.find((m) => m._id === message.replyTo);
          const createdAt = message.createdAt ? new Date(message.createdAt) : null;
          const withinEditWindow =
            !!createdAt && Date.now() - createdAt.getTime() <= MESSAGE_EDIT_WINDOW_MS;
          const canEdit =
            isOwn &&
            !isDeleted &&
            !!message.text &&
            !message.seen &&
            withinEditWindow;

          return (
            <div
              key={message._id}
              className={`chat ${isOwn ? "chat-end" : "chat-start"}`}
              ref={messageEndRef}
            >
              <div className="mb-1 chat-header flex items-center gap-2">
                <time className="ml-1 text-xs opacity-50">
                  {formatMessageTime(message.createdAt)}
                </time>
                {message.isEdited && (
                  <span className="text-[10px] opacity-60">(edited)</span>
                )}
              </div>
              <div className="flex items-end gap-1 max-w-full">
                <div
                  className={`chat-bubble flex flex-col ${
                    isOwn ? "bg-primary text-primary-content" : "bg-base-200 text-base-content"
                  }`}
                >
                  {isDeleted ? (
                    <p className="italic opacity-70">This message was deleted</p>
                  ) : (
                    <>
                      {replyMessage && (
                        <div className="mb-1 px-2 py-1 rounded bg-base-300/70 text-xs border-l-4 border-primary max-w-xs">
                          <p className="mb-0.5 text-[10px] font-semibold opacity-80">
                            Replying to
                          </p>
                          <p className="line-clamp-2 break-words">
                            {replyMessage.text || replyMessage.fileName || "Attachment"}
                          </p>
                        </div>
                      )}
                      {message.image && (
                        <img
                          src={message.image}
                          alt="Attachment"
                          className="sm:max-w-[200px] rounded-md mb-2"
                        />
                      )}
                      {message.fileUrl && (
                        <a
                          href={message.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="link link-primary break-all mb-1"
                        >
                          {message.fileName || "Attachment"}
                        </a>
                      )}
                      {message.text && <p>{message.text}</p>}
                      {(message.isStarred || message.isPinned) && (
                        <div className="mt-1 flex gap-1 text-[10px] opacity-70 self-end">
                          {message.isPinned && <Pin className="w-3 h-3" />}
                          {message.isStarred && <Star className="w-3 h-3" />}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {!isDeleted && (
                  <div className="relative">
                    <button
                      className="btn btn-ghost btn-xs"
                      onClick={() =>
                        setMenuOpenForId((prev) => (prev === message._id ? null : message._id))
                      }
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {menuOpenForId === message._id && (
                      <div className="absolute z-20 mt-1 w-40 rounded-lg bg-base-100 shadow-lg border border-base-300 right-0">
                        <ul className="menu menu-sm p-1">
                          {canEdit && (
                            <li>
                              <button onClick={() => handleEdit(message)}>
                                <Edit2 className="w-3 h-3" />
                                Edit
                              </button>
                            </li>
                          )}
                          <li>
                            <button
                              onClick={() => handleReply(message)}
                            >
                              <CornerDownLeft className="w-3 h-3" />
                              Reply
                            </button>
                          </li>
                          <li>
                            <button onClick={() => handleForward(message)}>
                              <ArrowUpRight className="w-3 h-3" />
                              Forward
                            </button>
                          </li>
                          <li>
                            <button
                              onClick={() => {
                                handleCopy(message.text || "");
                                setMenuOpenForId(null);
                              }}
                            >
                              <Clipboard className="w-3 h-3" />
                              Copy
                            </button>
                          </li>
                          <li>
                            <button onClick={() => toggleStar(message)}>
                              <Star className="w-3 h-3" />
                              {message.isStarred ? "Unstar" : "Star"}
                            </button>
                          </li>
                          <li>
                            <button onClick={() => togglePin(message)}>
                              <Pin className="w-3 h-3" />
                              {message.isPinned ? "Unpin" : "Pin"}
                            </button>
                          </li>
                          {isOwn && (
                            <li>
                              <button
                                onClick={() => handleDelete(message._id)}
                                className="text-error"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </button>
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <MessageInput />

      {isForwardModalOpen && messageToForward && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm p-4 rounded-lg shadow-lg bg-base-100">
            <h3 className="mb-1 text-sm font-semibold">Forward message</h3>
            <p className="mb-3 text-xs opacity-80 line-clamp-2">
              {messageToForward.text ||
                messageToForward.fileName ||
                (messageToForward.image ? "Image" : "Message")}
            </p>
            <div className="max-h-64 mb-3 overflow-y-auto divide-y divide-base-300">
              {users
                .filter((u) => u._id !== authUser._id)
                .map((user) => (
                  <button
                    key={user._id}
                    type="button"
                    className="flex items-center justify-between w-full px-2 py-2 text-left hover:bg-base-200"
                    onClick={() => handleForwardToUser(user)}
                  >
                    <span className="text-sm">{user.fullName || user.username || user.email}</span>
                  </button>
                ))}
              {users.filter((u) => u._id !== authUser._id).length === 0 && (
                <div className="py-4 text-xs text-center opacity-70">No contacts available</div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={closeForwardModal}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ChatContainer;
