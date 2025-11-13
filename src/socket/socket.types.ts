import { Server as SocketIOServer, Socket } from 'socket.io';
import { JWTPayload } from '../utils/jwt';

// Extender el tipo Socket para incluir user en data
export interface SocketWithUser extends Socket {
  data: {
    user?: JWTPayload;
  };
}

// Tipos para datos de eventos de citas
export interface AppointmentCreatedData {
  id: string;
  barberId: string;
  userId: string;
  serviceId?: string;
  date: Date;
  time: string;
  status: string;
  paymentMethod?: string;
  paymentStatus?: string;
  paymentProof?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  barber?: {
    id: string;
    name: string;
    email: string;
    specialty: string;
    rating: number;
    image?: string;
    avatarSeed?: string;
    location: string;
  };
  client?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    avatarSeed?: string;
  };
  service?: {
    id: string;
    name: string;
    price: number;
    description?: string;
  };
}

export interface AppointmentUpdatedData extends AppointmentCreatedData {}

export interface AppointmentCancelledData {
  id: string;
  barberId: string;
  date: Date;
  time: string;
}

export interface AppointmentPaymentVerifiedData extends AppointmentCreatedData {}

export interface BarberQueueUpdatedData {
  barberId: string;
  date: string; // YYYY-MM-DD
  appointments: AppointmentCreatedData[];
}

// Eventos del cliente al servidor
export interface ClientToServerEvents {
  'join:barber-queue': (data: { barberId: string }) => void;
  'leave:barber-queue': (data: { barberId: string }) => void;
}

// Eventos del servidor al cliente
export interface ServerToClientEvents {
  'appointment:created': (data: AppointmentCreatedData) => void;
  'appointment:updated': (data: AppointmentUpdatedData) => void;
  'appointment:cancelled': (data: AppointmentCancelledData) => void;
  'appointment:payment-verified': (data: AppointmentPaymentVerifiedData) => void;
  'barber:queue-updated': (data: BarberQueueUpdatedData) => void;
}

// Tipos para el servidor Socket.IO
export type TypedSocketIOServer = SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents
>;

export type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents
> & SocketWithUser;

