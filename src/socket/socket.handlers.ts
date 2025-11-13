import { TypedSocket } from './socket.types';
import { joinBarberRoom, leaveBarberRoom, leaveAllBarberRooms } from './socket.rooms';

/**
 * Handler principal para cuando un cliente se conecta
 */
export const onConnection = (socket: TypedSocket): void => {
  const user = socket.data.user;
  
  if (!user) {
    console.warn('⚠️  Socket connected without user data');
    socket.disconnect();
    return;
  }

  console.log(`✅ Socket connected: User ${user.userId} (${user.email})`);

  // Handler para unirse a la cola de un barbero
  socket.on('join:barber-queue', async (data: { barberId: string }) => {
    try {
      if (!data.barberId) {
        socket.emit('error', { message: 'barberId is required' });
        return;
      }

      const result = await joinBarberRoom(socket, data.barberId);
      
      if (result.success) {
        socket.emit('joined:barber-queue', { 
          barberId: data.barberId,
          message: result.message 
        });
      } else {
        socket.emit('error', { message: result.message });
      }
    } catch (error) {
      console.error('Error in join:barber-queue handler:', error);
      socket.emit('error', { 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Handler para salir de la cola de un barbero
  socket.on('leave:barber-queue', async (data: { barberId: string }) => {
    try {
      if (!data.barberId) {
        socket.emit('error', { message: 'barberId is required' });
        return;
      }

      const result = await leaveBarberRoom(socket, data.barberId);
      
      if (result.success) {
        socket.emit('left:barber-queue', { 
          barberId: data.barberId,
          message: result.message 
        });
      } else {
        socket.emit('error', { message: result.message });
      }
    } catch (error) {
      console.error('Error in leave:barber-queue handler:', error);
      socket.emit('error', { 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Handler para desconexión
  socket.on('disconnect', async (reason: string) => {
    console.log(`👋 Socket disconnected: User ${user.userId} - Reason: ${reason}`);
    
    // Limpiar todas las rooms de barberos
    await leaveAllBarberRooms(socket);
  });

  // Handler para errores
  socket.on('error', (error: Error) => {
    console.error(`❌ Socket error for user ${user.userId}:`, error);
  });
};

