# Real-Time Chat Application

**MERN Stack Real-Time Chat App with Socket.io**  
A full-stack chat application enabling instant messaging with real-time updates and secure authentication.

---

## Features

- Real-time 1:1 messaging with Socket.io  
- User authentication with JWT and bcrypt  
- Persistent message storage using MongoDB  
- Per-message actions: **edit, reply, forward, copy, star, pin, delete**  
- Edit constraints: sender-only, within 1 hour, and only while the message is unseen  
- WhatsApp-like reply UI (quoted context above the replied message)  
- Forward messages to any contact via a contact picker  
- File and image attachments (Cloudinary-backed, including PDFs/docs)  
- Global search across all chats + in-chat search bar  
- Per-chat unread badges, cleared when you open the chat  
- Per-user “clear chat” (local only) vs soft delete for everyone  
- Starred messages overview page  
- Member-since information on profile page  
- Multiline input (Shift+Enter for new line, Enter to send)  
- Emoji picker that stays open while you select multiple emojis  
- Auto-linking of URLs in messages  

---

## Tech Stack

- **Frontend:** React.js  
- **Backend:** Node.js, Express.js  
- **Database:** MongoDB  
- **Real-Time Communication:** Socket.io  
- **Authentication:** JWT, bcrypt  

---

## Installation

### Backend

```bash
# Clone the repository
git clone https://github.com/unlisted02/chat-app.git
cd chat-app/backend

# Install dependencies
npm install

# Set up environment variables
# Copy .env.example to .env and fill in your values
cp .env.example .env
# Edit .env with your actual configuration

# Run in development mode
npm run dev
# Or for production: npm start
```

**Environment Variables:** See `backend/.env.example` for all required environment variables.

### Frontend

```bash
cd frontend
bun install
bun dev
```

> Make sure MongoDB is running and configured properly, and update environment variables if necessary.

---

## Usage

1. Register or log in to your account  
2. Select a contact from the sidebar  
3. Send and receive messages in real time (text, images, docs)  
4. Use the 3‑dot menu on any message to edit, reply, forward, star, pin, copy, or delete  
5. Use global search (sidebar) or in‑chat search (chat header) to find messages  
6. View all your starred messages from the **Starred** page in the navbar  

---

## Future Enhancements

- Add group chat and private messaging  
- Enable multimedia messages (images, videos)  
- Push notifications for new messages  
- Deploy as a web and mobile app  

---

## Author

Unlisted 

---

## License

This project is licensed under the MIT License.
