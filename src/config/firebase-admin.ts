import admin from 'firebase-admin';
import { config } from './env';

let initialized = false;

/**
 * Inicializa Firebase Admin SDK
 */
export const initializeFirebaseAdmin = (): void => {
  if (initialized) {
    return;
  }

  // Si ya hay una app inicializada, no inicializar de nuevo
  if (admin.apps.length > 0) {
    initialized = true;
    return;
  }

  try {
    // Verificar que tenemos las credenciales necesarias
    if (!config.firebase.projectId || !config.firebase.privateKey || !config.firebase.clientEmail) {
      console.warn('⚠️  Firebase Admin credentials not configured. Push notifications will be disabled.');
      return;
    }

    const serviceAccount = {
      projectId: config.firebase.projectId,
      privateKey: config.firebase.privateKey,
      clientEmail: config.firebase.clientEmail,
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });

    initialized = true;
    console.log('✅ Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin SDK:', error);
    console.warn('⚠️  Push notifications will be disabled.');
  }
};

/**
 * Obtiene la instancia de Firebase Admin
 */
export const getFirebaseAdmin = (): admin.app.App | null => {
  if (!initialized || admin.apps.length === 0) {
    return null;
  }
  return admin.app();
};

/**
 * Verifica si Firebase Admin está inicializado
 */
export const isFirebaseInitialized = (): boolean => {
  return initialized && admin.apps.length > 0;
};

