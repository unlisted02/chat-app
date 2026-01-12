const MessageSkeleton = () => {
  const skeletonMessages = Array(6).fill(null);

  return (
    <div className="flex-1 p-4 space-y-4 overflow-y-auto">
      {skeletonMessages.map((_, idx) => (
        <div key={idx} className={`chat ${idx % 2 === 0 ? "chat-start" : "chat-end"}`}>
          <div className="mb-1 chat-header">
            <div className="w-16 h-4 skeleton" />
          </div>

          <div
            className={`chat-bubble ${
              idx % 2 === 0 ? "bg-gray-300" : "bg-green-600"
            }`}
          >
            <div className="h-16 w-[200px] skeleton" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageSkeleton;
