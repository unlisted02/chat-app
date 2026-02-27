import { useEffect, useState, useRef, useCallback } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, Search, Loader2 } from "lucide-react";
import { formatMessageTime } from "../lib/utils";

const Sidebar = () => {
  const {
    getUsers,
    fetchUnreadCounts,
    users,
    selectedUser,
    setSelectedUser,
    isUsersLoading,
    unreadCounts,
    searchMessages,
    searchResults,
    isSearchLoading,
    clearSearchResults,
    setGlobalSearchQuery,
    globalSearchQuery,
    getMessages,
  } = useChatStore();

  const { onlineUsers, authUser } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const searchInputRef = useRef(null);
  const searchDropdownRef = useRef(null);

  useEffect(() => {
    getUsers();
    fetchUnreadCounts();
  }, [getUsers, fetchUnreadCounts]);

  const runSearch = useCallback(
    (query) => {
      const q = (query || "").trim();
      if (!q) {
        clearSearchResults();
        return;
      }
      searchMessages(q);
    },
    [searchMessages, clearSearchResults]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setGlobalSearchQuery(localSearchQuery);
      runSearch(localSearchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearchQuery, runSearch, setGlobalSearchQuery]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(e.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target)
      ) {
        setLocalSearchQuery("");
        clearSearchResults();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [clearSearchResults]);

  const getOtherUserFromMessage = (message) => {
    const myId = (authUser?._id ?? "").toString();
    const senderId = (message.senderId?._id ?? message.senderId ?? "").toString();
    const otherId = senderId === myId ? message.receiverId : message.senderId;
    const otherIdStr = (otherId?._id ?? otherId ?? "").toString();
    return users.find((u) => (u._id ?? "").toString() === otherIdStr);
  };

  const handleSearchResultClick = (message) => {
    const other = getOtherUserFromMessage(message);
    if (other) {
      setSelectedUser(other);
      getMessages(other._id);
    }
    setLocalSearchQuery("");
    clearSearchResults();
  };

  const filteredUsers = showOnlineOnly
    ? users.filter((user) => onlineUsers.includes(user._id))
    : users;

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return bTime - aTime;
  });

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200 relative">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="size-6" />
            <span className="font-medium hidden lg:block">Contacts</span>
          </div>
        </div>
        <div className="mt-3 hidden lg:block relative" ref={searchDropdownRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-60" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search all chats..."
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              className="input input-bordered input-sm w-full pl-9 pr-8 rounded-lg bg-base-200 border-base-300 focus:border-primary"
            />
            {isSearchLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin opacity-60" />
            )}
          </div>
          {globalSearchQuery.trim() && (
            <div className="absolute top-full left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded-lg border border-base-300 bg-base-100 shadow-lg z-20">
              {searchResults.length === 0 && !isSearchLoading ? (
                <div className="p-3 text-sm text-base-content/70">No messages found</div>
              ) : (
                <ul className="menu menu-sm p-1">
                  {searchResults.map((msg) => {
                    const other = getOtherUserFromMessage(msg);
                    const snippet = msg.text || msg.fileName || "Attachment";
                    return (
                      <li key={msg._id}>
                        <button
                          type="button"
                          className="flex flex-col items-start gap-0.5 text-left py-2"
                          onClick={() => handleSearchResultClick(msg)}
                        >
                          <span className="font-medium text-sm">
                            {other?.fullName || other?.username || "Unknown"}
                          </span>
                          <span className="text-xs opacity-80 line-clamp-1">{snippet}</span>
                          <span className="text-[10px] opacity-60">
                            {formatMessageTime(msg.createdAt)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
        <div className="mt-3 hidden lg:flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">Show online only</span>
          </label>
          <span className="text-xs text-base-content/60">({onlineUsers.length - 1} online)</span>
        </div>
      </div>

      <div className="overflow-y-auto w-full py-3">
        {sortedUsers.map((user) => {
          const unread = unreadCounts[user._id] || 0;
          const isActive = selectedUser?._id === user._id;

          return (
            <button
              key={user._id}
              onClick={() => setSelectedUser(user)}
              className={`
                w-full p-3 flex items-center gap-3
                hover:bg-base-300 transition-colors
                ${isActive ? "bg-base-300 ring-1 ring-base-300" : ""}
              `}
            >
              <div className="relative mx-auto lg:mx-0">
                <img
                  src={user.profilePic || "/avatar.png"}
                  alt={user.name}
                  className="size-12 object-cover rounded-full"
                />
                {onlineUsers.includes(user._id) && (
                  <span
                    className="absolute bottom-0 right-0 size-3 bg-success 
                    rounded-full ring-2 ring-base-100"
                  />
                )}
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 badge badge-xs badge-primary">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </div>

              {/* User info - only visible on larger screens */}
              <div className="hidden lg:flex text-left min-w-0 flex-1 items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium truncate">{user.fullName}</div>
                  <div className="text-sm text-base-content/70">
                    {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                  </div>
                </div>
              </div>
            </button>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="text-center text-base-content/60 py-4">No online users</div>
        )}
      </div>
    </aside>
  );
};
export default Sidebar;
