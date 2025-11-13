import { ExtendedError } from 'socket.io/dist/namespace';
import { verifyAccessToken } from '../utils/jwt';
import { TypedSocket } from './socket.types';

/**
 * Middleware de autenticación para Socket.IO
 * Valida el token JWT en el handshake y agrega el usuario al socket.data
 */
export const authenticateSocket = async (
  socket: TypedSocket,
  next: (err?: ExtendedError) => void
): Promise<void> => {
  try {
    // El token puede venir en auth.token o en query.token
    const token = 
      (socket.handshake.auth?.token as string) || 
      (socket.handshake.query?.token as string);

    if (!token) {
      const error: ExtendedError = new Error('Authentication token required') as ExtendedError;
      error.data = { message: 'No token provided' };
      return next(error);
    }

    try {
      // Verificar el token
      const payload = verifyAccessToken(token);
      
      // Agregar el usuario al socket.data
      socket.data.user = payload;
      
      next();
    } catch (error) {
      const authError: ExtendedError = new Error('Invalid authentication token') as ExtendedError;
      authError.data = { message: 'Token verification failed' };
      return next(authError);
    }
  } catch (error) {
    const err: ExtendedError = new Error('Authentication error') as ExtendedError;
    err.data = { message: error instanceof Error ? error.message : 'Unknown error' };
    return next(err);
  }
};

