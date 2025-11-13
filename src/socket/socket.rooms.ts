import prisma from '../config/prisma';
import { TypedSocket } from './socket.types';

/**
 * Genera el nombre estandarizado de room para un barbero
 */
export const getBarberRoomName = (barberId: string): string => {
  return `barber:${barberId}`;
};

/**
 * Une un socket a la room de un barbero
 * Valida que el usuario tenga permisos antes de unirse
 */
export const joinBarberRoom = async (
  socket: TypedSocket,
  barberId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const user = socket.data.user;
    
    if (!user) {
      return { success: false, message: 'User not authenticated' };
    }

    // Verificar que el barbero existe
    const barber = await prisma.barber.findUnique({
      where: { id: barberId },
      select: { id: true, email: true },
    });

    if (!barber) {
      return { success: false, message: 'Barber not found' };
    }

    // Verificar permisos: el usuario puede unirse si:
    // 1. Es el mismo barbero (su email coincide con el del barbero)
    // 2. Es un cliente (cualquier usuario autenticado puede ver la cola)
    // Por ahora permitimos que cualquier usuario autenticado se una
    // (en el futuro se puede restringir más si es necesario)

    const roomName = getBarberRoomName(barberId);
    await socket.join(roomName);

    console.log(`✅ User ${user.userId} joined room ${roomName}`);
    
    return { success: true, message: `Joined barber room: ${barberId}` };
  } catch (error) {
    console.error('Error joining barber room:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * Saca un socket de la room de un barbero
 */
export const leaveBarberRoom = async (
  socket: TypedSocket,
  barberId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const roomName = getBarberRoomName(barberId);
    await socket.leave(roomName);

    const user = socket.data.user;
    console.log(`👋 User ${user?.userId} left room ${roomName}`);
    
    return { success: true, message: `Left barber room: ${barberId}` };
  } catch (error) {
    console.error('Error leaving barber room:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * Limpia todas las rooms de barberos de un socket
 */
export const leaveAllBarberRooms = async (socket: TypedSocket): Promise<void> => {
  try {
    const rooms = Array.from(socket.rooms);
    const barberRooms = rooms.filter(room => room.startsWith('barber:'));
    
    for (const room of barberRooms) {
      await socket.leave(room);
    }

    if (barberRooms.length > 0) {
      const user = socket.data.user;
      console.log(`🧹 User ${user?.userId} left all barber rooms`);
    }
  } catch (error) {
    console.error('Error leaving all barber rooms:', error);
  }
};

