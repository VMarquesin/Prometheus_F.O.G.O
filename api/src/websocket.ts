import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';

export class WebSocketService {
  private static instance: WebSocketService | null = null;
  private io: Server | null = null;

  private constructor() {}

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  inicializar(httpServer: HttpServer): Server {
    this.io = new Server(httpServer, {
      cors: { origin: '*' },
    });

    this.io.on('connection', (socket) => {
      console.log(`Cliente conectado ao PROMETHEUS: ${socket.id}`);
    });

    return this.io;
  }

  getIO(): Server {
    if (!this.io) {
      throw new Error('WebSocketService não foi inicializado. Chame inicializar(httpServer) primeiro.');
    }
    return this.io;
  }
}

export default WebSocketService.getInstance();
