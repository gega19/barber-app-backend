/**
 * Valida y normaliza URLs de redes sociales
 */

export interface SocialMediaValidationResult {
  isValid: boolean;
  normalizedUrl: string | null;
  error?: string;
}

/**
 * Normaliza una URL de Instagram
 * Acepta:
 * - https://www.instagram.com/usuario/
 * - https://instagram.com/usuario/
 * - instagram.com/usuario
 * - @usuario
 */
export function validateAndNormalizeInstagram(input: string | null | undefined): SocialMediaValidationResult {
  if (!input || input.trim() === '') {
    return { isValid: true, normalizedUrl: null };
  }

  const trimmed = input.trim();

  // Si es solo @usuario, convertir a URL completa
  if (trimmed.startsWith('@')) {
    const username = trimmed.substring(1);
    if (username.length === 0) {
      return { isValid: false, normalizedUrl: null, error: 'Instagram username cannot be empty' };
    }
    return {
      isValid: true,
      normalizedUrl: `https://www.instagram.com/${username}/`,
    };
  }

  // Si no tiene protocolo, agregarlo
  let url = trimmed;
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    url = `https://${trimmed}`;
  }

  try {
    const urlObj = new URL(url);
    
    // Validar dominio
    const hostname = urlObj.hostname.toLowerCase();
    const validDomains = ['instagram.com', 'www.instagram.com'];
    
    if (!validDomains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`))) {
      return { isValid: false, normalizedUrl: null, error: 'Invalid Instagram URL. Must be from instagram.com' };
    }

    // Normalizar a formato estándar
    const pathname = urlObj.pathname.replace(/\/$/, ''); // Remover trailing slash
    const normalized = `https://www.instagram.com${pathname}/`;
    
    return { isValid: true, normalizedUrl: normalized };
  } catch (error) {
    return { isValid: false, normalizedUrl: null, error: 'Invalid URL format' };
  }
}

/**
 * Normaliza una URL de TikTok
 * Acepta:
 * - https://www.tiktok.com/@usuario
 * - https://tiktok.com/@usuario
 * - tiktok.com/@usuario
 * - @usuario
 */
export function validateAndNormalizeTikTok(input: string | null | undefined): SocialMediaValidationResult {
  if (!input || input.trim() === '') {
    return { isValid: true, normalizedUrl: null };
  }

  const trimmed = input.trim();

  // Si es solo @usuario, convertir a URL completa
  if (trimmed.startsWith('@')) {
    const username = trimmed.substring(1);
    if (username.length === 0) {
      return { isValid: false, normalizedUrl: null, error: 'TikTok username cannot be empty' };
    }
    return {
      isValid: true,
      normalizedUrl: `https://www.tiktok.com/@${username}`,
    };
  }

  // Si no tiene protocolo, agregarlo
  let url = trimmed;
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    url = `https://${trimmed}`;
  }

  try {
    const urlObj = new URL(url);
    
    // Validar dominio
    const hostname = urlObj.hostname.toLowerCase();
    const validDomains = ['tiktok.com', 'www.tiktok.com'];
    
    if (!validDomains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`))) {
      return { isValid: false, normalizedUrl: null, error: 'Invalid TikTok URL. Must be from tiktok.com' };
    }

    // Normalizar a formato estándar
    const pathname = urlObj.pathname;
    let normalized = `https://www.tiktok.com${pathname}`;
    
    // Asegurar que tenga @ si es un perfil
    if (!normalized.includes('@') && pathname !== '/') {
      // Intentar extraer username del pathname
      const match = pathname.match(/\/([^\/]+)$/);
      if (match && match[1]) {
        normalized = `https://www.tiktok.com/@${match[1]}`;
      }
    }
    
    return { isValid: true, normalizedUrl: normalized };
  } catch (error) {
    return { isValid: false, normalizedUrl: null, error: 'Invalid URL format' };
  }
}

