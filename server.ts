import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(cors());

  // Health check for platform monitoring
  app.get('/health', (req, res) => res.status(200).send('OK'));

  // Simple password protection middleware
  const isAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const password = req.query.pw; // Access via /admin-homiie?pw=YourSecretPassword123
    if (password === process.env.ADMIN_PASSWORD) {
      next(); // Password matches, proceed to the admin page
    } else {
      res.status(403).send("Unauthorized: Access Denied.");
    }
  };

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    pingTimeout: 10000,
    pingInterval: 5000,
    transports: ['websocket', 'polling']
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
      
      const existingIndex = room.participants.findIndex((p: any) => p.id === user.id);
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
      rooms.forEach((room, code) => {
        const index = room.participants.findIndex((p: any) => p.socketId === socket.id);
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    
    // The Secret Admin Route
    app.get('/admin-homiie', isAdmin, async (req, res, next) => {
      try {
        const url = req.originalUrl;
        const templateHtml = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        let template = await vite.transformIndexHtml(url, templateHtml);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    
    app.get('/admin-homiie', isAdmin, (req, res) => {
      // In production, we'll send the index.html but maybe we need to inject the admin flag
      // For simplicity, we can just send the index.html and let React check the URL
      res.sendFile(path.join(distPath, 'index.html'));
    });

    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Homiies Multi-server running on port ${PORT}`);
  });
}

startServer();
