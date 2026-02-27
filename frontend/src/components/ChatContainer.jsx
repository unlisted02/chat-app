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

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    updateMessage,
    deleteMessage,
    sendMessage,
    setReplyTo,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const [menuOpenForId, setMenuOpenForId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    getMessages(selectedUser._id);

    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

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

  const handleEdit = async (message) => {
    const nextText = window.prompt("Edit message", message.text || "");
    if (nextText !== null && nextText.trim() !== message.text) {
      await updateMessage(message._id, { text: nextText.trim() });
    }
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

  const handleForward = async (message) => {
    if (!message.text) {
      setMenuOpenForId(null);
      return;
    }
    await sendMessage({ text: message.text });
    setMenuOpenForId(null);
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
                          {isOwn && (
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
    </div>
  );
};
export default ChatContainer;
