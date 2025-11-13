import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { config } from '../config/env';
import { authenticateSocket } from './socket.middleware';
import { TypedSocketIOServer, TypedSocket, ServerToClientEvents, ClientToServerEvents, AppointmentCreatedData, AppointmentUpdatedData, AppointmentCancelledData, AppointmentPaymentVerifiedData, BarberQueueUpdatedData } from './socket.types';
import { onConnection } from './socket.handlers';

let io: TypedSocketIOServer | null = null;

/**
 * Crea y configura el servidor Socket.IO
 */
export const createSocketServer = (httpServer: HTTPServer): TypedSocketIOServer => {
  io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: config.socket.corsOrigin === '*' 
        ? true 
        : config.socket.corsOrigin.split(',').map(origin => origin.trim()),
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: config.socket.pingTimeout,
    pingInterval: config.socket.pingInterval,
    transports: ['websocket', 'polling'],
  });

  // Aplicar middleware de autenticación
  io.use(authenticateSocket);

  // Configurar handlers de conexión
  io.on('connection', onConnection);

  console.log('✅ Socket.IO server initialized');

  return io;
};

/**
 * Obtiene la instancia del servidor Socket.IO
 */
export const getSocketServer = (): TypedSocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO server not initialized. Call createSocketServer first.');
  }
  return io;
};

/**
 * Emite un evento a la room de un barbero específico
 */
export const emitToBarberRoom = (
  barberId: string,
  event: keyof ServerToClientEvents,
  data: AppointmentCreatedData | AppointmentUpdatedData | AppointmentCancelledData | AppointmentPaymentVerifiedData | BarberQueueUpdatedData
): void => {
  if (!io) {
    console.warn('⚠️  Socket.IO server not initialized, cannot emit event');
    return;
  }

  const roomName = `barber:${barberId}`;
  io.to(roomName).emit(event, data as any);
  console.log(`📤 Emitted ${event} to room ${roomName}`);
};

/**
 * Emite un evento a todos los clientes conectados
 */
export const emitToAll = (
  event: keyof ServerToClientEvents,
  data: AppointmentCreatedData | AppointmentUpdatedData | AppointmentCancelledData | AppointmentPaymentVerifiedData | BarberQueueUpdatedData
): void => {
  if (!io) {
    console.warn('⚠️  Socket.IO server not initialized, cannot emit event');
    return;
  }

  io.emit(event, data as any);
  console.log(`📤 Emitted ${event} to all clients`);
};

