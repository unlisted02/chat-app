# Real-Time Chat Application

**MERN Stack Real-Time Chat App with Socket.io**  
A full-stack chat application enabling instant messaging with real-time updates and secure authentication.

---

## Features

- Real-time messaging with Socket.io  
- User authentication with JWT and bcrypt  
- Persistent message storage using MongoDB  
- Responsive UI for seamless experience  
- Handles multiple active users efficiently  
- Secure login and data handling  

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
npm install
npm start
```

> Make sure MongoDB is running and configured properly, and update environment variables if necessary.

---

## Usage

1. Register or log in to your account  
2. Join or create chat rooms  
3. Send and receive messages in real time  
4. Enjoy secure, persistent, and responsive chat  

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
