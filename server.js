
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
//const cors = require('cors');

const app = express();
//app.use(cors());

const server = http.createServer(app);
const io = new Server(server);
/*const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 10000,
  pingInterval: 5000
});*/

const PORT = 9000;
app.use(express.static(path.resolve("./"))); // To get absolute path

// Serve the index.html file
app.get("/", (req, res) => {
  res.sendFile("/index.html");
});

const rooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('create_room', ({ user, roomCode }) => {
    const room = {
      code: roomCode,
      hostId: user.id,
      participants: [{
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
        isHost: true,
        isReady: true,
        socketId: socket.id
      }],
      gameState: null
    };
    rooms.set(roomCode, room);
    socket.join(roomCode);
    socket.emit('room_updated', room);
    console.log(`Room created: ${roomCode} by ${user.name}`);
  });

  socket.on('join_room', ({ user, roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room) {
      socket.emit('error', 'Room not found. Check the host code.');
      return;
    }
    if (room.participants.length >= 4) {
      socket.emit('error', 'Room is full');
      return;
    }
    
    // Use user ID to check if already in room, update socket ID if they reconnected
    const existingIndex = room.participants.findIndex(p => p.id === user.id);
    if (existingIndex === -1) {
        const participant = {
          id: user.id,
          name: user.name,
          avatarUrl: user.avatarUrl,
          isHost: false,
          isReady: true,
          socketId: socket.id
        };
        room.participants.push(participant);
    } else {
        room.participants[existingIndex].socketId = socket.id;
    }
    
    socket.join(roomCode);
    // Broadcast to EVERYONE in the room including the joiner
    io.to(roomCode).emit('room_updated', room);
    console.log(`${user.name} joined room: ${roomCode}`);
  });

  socket.on('start_game', (roomCode) => {
    const room = rooms.get(roomCode);
    if (room && room.participants.length === 4) {
      io.to(roomCode).emit('game_started');
    } else if (room) {
      socket.emit('error', 'Exactly 4 players required to start Homiies.');
    }
  });

  socket.on('dice_rolled', ({ roomCode, value, playerIndex }) => {
    io.to(roomCode).emit('sync_dice', { value, playerIndex });
  });

  socket.on('move_pawn', ({ roomCode, pawnId, finalLocation, playerIndex }) => {
    io.to(roomCode).emit('sync_move', { pawnId, finalLocation, playerIndex });
  });

  socket.on('next_turn', ({ roomCode, nextIndex }) => {
    io.to(roomCode).emit('sync_turn', nextIndex);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    rooms.forEach((room, code) => {
      const index = room.participants.findIndex(p => p.socketId === socket.id);
      if (index !== -1) {
        room.participants.splice(index, 1);
        if (room.participants.length === 0) {
          rooms.delete(code);
        } else {
          if (index === 0 && room.participants.length > 0) {
            room.hostId = room.participants[0].id;
            room.participants[0].isHost = true;
          }
          io.to(code).emit('room_updated', room);
        }
      }
    });
  });
});

//const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});
