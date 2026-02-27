import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import Sidebar from "../components/Sidebar";
import { Star } from "lucide-react";
import { formatMessageTime } from "../lib/utils";

const StarredPage = () => {
  const { starredMessages, fetchStarredMessages } = useChatStore();
  const { authUser } = useAuthStore();

  useEffect(() => {
    fetchStarredMessages();
  }, [fetchStarredMessages]);

  return (
    <div className="h-screen bg-base-200">
      <div className="flex items-center justify-center pt-20 px-4">
        <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-6xl h-[calc(100vh-8rem)] flex overflow-hidden">
          <Sidebar />

          <div className="flex-1 flex flex-col p-4 overflow-y-auto">
            <div className="flex items-center gap-2 mb-4 border-b border-base-300 pb-2">
              <Star className="w-5 h-5 text-warning" />
              <h2 className="text-lg font-semibold">Starred messages</h2>
            </div>

            {starredMessages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-base-content/70 text-sm">
                You have no starred messages yet.
              </div>
            ) : (
              <div className="space-y-3">
                {starredMessages.map((msg) => {
                  const isOwn =
                    (msg.senderId?._id ?? msg.senderId)?.toString() ===
                    (authUser?._id ?? "").toString();
                  const otherUser = isOwn ? msg.receiverId : msg.senderId;
                  const snippet = msg.text || msg.fileName || "Attachment";

                  return (
                    <div
                      key={msg._id}
                      className="flex flex-col gap-1 p-3 rounded-lg border border-base-300 bg-base-200/60"
                    >
                      <div className="flex items-center justify-between text-xs text-base-content/70">
                        <span className="font-medium">
                          {otherUser?.fullName || otherUser?.email || "Unknown"}
                        </span>
                        <span>{formatMessageTime(msg.createdAt)}</span>
                      </div>
                      <div className="text-sm">
                        {msg.fileName && (
                          <span className="mr-2 underline">
                            {msg.fileName}
                          </span>
                        )}
                        <span>{snippet}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StarredPage;

