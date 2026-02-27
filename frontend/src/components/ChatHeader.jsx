import { X, Search, Trash2, Clipboard } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const ChatHeader = ({ searchTerm, onSearchTermChange, onCopyChat }) => {
  const { selectedUser, setSelectedUser, clearChat, messages } = useChatStore();
  const { onlineUsers } = useAuthStore();

  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  const handleClearChat = async () => {
    if (!selectedUser) return;
    setIsClearModalOpen(true);
  };

  const confirmClearChat = async () => {
    if (!selectedUser) return;
    await clearChat(selectedUser._id);
    setIsClearModalOpen(false);
  };

  const handleCopyChat = async () => {
    if (!messages.length) return;
    const lines = messages
      .filter((m) => !m.deletedAt)
      .map(
        (m) =>
          `${new Date(m.createdAt).toLocaleString()} - ${m.senderId === selectedUser._id ? selectedUser.fullName : "You"}: ${
            m.text || m.fileName || "[attachment]"
          }`
      );
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
    } catch {
      // ignore
    }
    if (onCopyChat) onCopyChat();
  };

  return (
    <>
      <div className="p-2.5 border-b border-base-300">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="avatar">
                <div className="size-10 rounded-full relative">
                  <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} />
                </div>
              </div>

              {/* User info */}
              <div>
                <h3 className="font-medium">{selectedUser.fullName}</h3>
                <p className="text-sm text-base-content/70">
                  {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn btn-ghost btn-xs sm:btn-sm"
                title="Copy chat"
                onClick={handleCopyChat}
              >
                <Clipboard className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-xs sm:btn-sm text-error"
                title="Clear chat"
                onClick={handleClearChat}
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedUser(null)}
                className="btn btn-ghost btn-xs sm:btn-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 flex-1">
              <span className="inline-flex items-center justify-center rounded-full bg-base-200 w-7 h-7">
                <Search className="w-4 h-4 text-base-content/70" />
              </span>
              <input
                type="text"
                className="input input-bordered input-xs sm:input-sm w-full rounded-lg bg-base-200 border-base-300 focus:border-primary focus:outline-none placeholder:text-base-content/50"
                placeholder="Search in this chat..."
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {isClearModalOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm p-4 rounded-lg shadow-lg bg-base-100">
            <h3 className="mb-2 text-sm font-semibold">Clear chat?</h3>
            <p className="mb-4 text-xs opacity-80">
              This will clear the conversation for you only. The other person will still see the
              chat.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => setIsClearModalOpen(false)}
              >
                Cancel
              </button>
              <button type="button" className="btn btn-error btn-xs" onClick={confirmClearChat}>
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
export default ChatHeader;
