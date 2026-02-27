import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useThemeStore } from "../store/useThemeStore";
import { DARK_THEMES } from "../constants";
import { Send, X, Smile, Paperclip } from "lucide-react";
import toast from "react-hot-toast";
import EmojiPicker from "emoji-picker-react";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [fileInfo, setFileInfo] = useState(null); // non-image files (pdf, doc, etc.)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const inputRef = useRef(null);
  const {
    sendMessage,
    replyTo,
    clearReplyTo,
    editingMessage,
    clearEditingMessage,
    updateMessage,
    selectedUser,
  } = useChatStore();
  const { theme } = useThemeStore();
  const emojiPickerTheme = DARK_THEMES.has(theme) ? "dark" : "light";

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const MAX_SIZE_MB = 20;
    const maxBytes = MAX_SIZE_MB * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error(`File is too large. Maximum size is ${MAX_SIZE_MB}MB.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (file.type.startsWith("image/")) {
        setImagePreview(reader.result);
        setFileInfo(null);
      } else {
        setFileInfo({
          data: reader.result,
          name: file.name,
          type: file.type,
        });
        setImagePreview(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    setFileInfo(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onEmojiClick = (emojiData) => {
    setText((prevText) => prevText + emojiData.emoji);
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target) &&
        !event.target.closest('[data-emoji-button]')
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Focus the input when a chat is opened/changed
  useEffect(() => {
    if (selectedUser && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedUser]);

  // When entering or leaving edit mode, sync the input and attachments
  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.text || "");
      setImagePreview(null);
      setFileInfo(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else {
      setText("");
    }
  }, [editingMessage]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview && !fileInfo) return;

    try {
      if (editingMessage) {
        const newText = text.trim();
        if (!newText) return;
        await updateMessage(editingMessage._id, { text: newText });
        clearEditingMessage();
        setText("");
      } else {
        const payload = {
          text: text.trim(),
        };

        if (imagePreview) {
          payload.image = imagePreview;
        }

        if (fileInfo) {
          payload.file = fileInfo.data;
          payload.fileName = fileInfo.name;
          payload.fileType = fileInfo.type;
        }

        if (replyTo?._id) {
          payload.replyTo = replyTo._id;
        }

        await sendMessage(payload);

        setText("");
        setImagePreview(null);
        setFileInfo(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (replyTo) clearReplyTo();
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="w-full p-4">
      {editingMessage && (
        <div className="mb-3 flex items-start justify-between gap-2 rounded-lg bg-warning/10 px-3 py-2 text-xs border border-warning/40">
          <div className="flex-1">
            <p className="font-medium mb-0.5">Editing message</p>
            <p className="line-clamp-2">
              {editingMessage.text || editingMessage.fileName || "Message"}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-xs btn-circle"
            onClick={clearEditingMessage}
          >
            <X className="size-3" />
          </button>
        </div>
      )}

      {replyTo && (
        <div className="mb-3 flex items-start justify-between gap-2 rounded-lg bg-base-200 px-3 py-2 text-xs">
          <div className="flex-1">
            <p className="font-medium mb-0.5">Replying to</p>
            <p className="line-clamp-2">
              {replyTo.text || replyTo.fileName || "Attachment"}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-xs btn-circle"
            onClick={clearReplyTo}
          >
            <X className="size-3" />
          </button>
        </div>
      )}

      {imagePreview && (
        <div className="flex items-center gap-2 mb-3">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="object-cover w-20 h-20 border rounded-lg border-base-300"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
              flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      {fileInfo && !imagePreview && (
        <div className="flex items-center justify-between gap-2 mb-3 rounded-lg border border-base-300 px-3 py-2 text-xs">
          <div className="flex items-center gap-2">
            <Paperclip className="size-4" />
            <div className="flex flex-col">
              <span className="font-medium break-all">{fileInfo.name}</span>
              <span className="opacity-70">{fileInfo.type}</span>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-xs btn-circle"
            onClick={removeImage}
          >
            <X className="size-3" />
          </button>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            ref={inputRef}
            className="w-full pr-24 rounded-lg input input-bordered input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          {showEmojiPicker && (
            <div
              ref={emojiPickerRef}
              className="absolute left-0 z-50 mb-2 bottom-full"
            >
              <EmojiPicker
                onEmojiClick={onEmojiClick}
                theme={emojiPickerTheme}
                width={350}
                height={400}
              />
            </div>
          )}

          <div className="absolute flex items-center gap-2 -translate-y-1/2 right-2 top-1/2">
            <button
              type="button"
              data-emoji-button
              className="btn btn-circle btn-ghost btn-xs sm:btn-sm"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              title="Add emoji"
            >
              <Smile size={18} />
            </button>

            <button
              type="button"
              className={`btn btn-circle btn-ghost btn-xs sm:btn-sm ${
                imagePreview || fileInfo ? "text-primary" : "text-base-content/60"
              }`}
              onClick={() => fileInputRef.current?.click()}
              title="Add attachment"
            >
              <Paperclip size={18} />
            </button>
          </div>

          <input
            type="file"
            accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
        </div>

        <button
          type="submit"
          className="btn btn-sm btn-circle"
          title="Send"
          disabled={!text.trim() && !imagePreview}
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};
export default MessageInput;
