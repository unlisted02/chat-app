import { X, Search, Trash2, Clipboard } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const ChatHeader = ({ searchTerm, onSearchTermChange, onCopyChat }) => {
  const { selectedUser, setSelectedUser, clearChat, messages } = useChatStore();
  const { onlineUsers } = useAuthStore();

  const handleClearChat = async () => {
    if (!selectedUser) return;
    const confirmClear = window.confirm("Clear all messages in this chat?");
    if (!confirmClear) return;
    await clearChat(selectedUser._id);
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
            <button onClick={() => setSelectedUser(null)} className="btn btn-ghost btn-xs sm:btn-sm">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
            <input
              type="text"
              className="input input-bordered input-xs sm:input-sm w-full pl-8"
              placeholder="Search in this chat..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
export default ChatHeader;
