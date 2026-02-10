import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useThemeStore } from "../store/useThemeStore";
import { DARK_THEMES } from "../constants";
import { Image, Send, X, Smile } from "lucide-react";
import toast from "react-hot-toast";
import EmojiPicker from "emoji-picker-react";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const { sendMessage } = useChatStore();
  const { theme } = useThemeStore();
  const emojiPickerTheme = DARK_THEMES.has(theme) ? "dark" : "light";

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onEmojiClick = (emojiData) => {
    setText((prevText) => prevText + emojiData.emoji);
    setShowEmojiPicker(false);
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview,
      });

      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="w-full p-4">
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

      <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
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
                imagePreview ? "text-primary" : "text-base-content/60"
              }`}
              onClick={() => fileInputRef.current?.click()}
              title="Add image"
            >
              <Image size={18} />
            </button>
          </div>

          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
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
