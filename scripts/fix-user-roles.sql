-- Actualizar roles antiguos a los nuevos valores del enum
UPDATE users SET role = 'CLIENT' WHERE role = 'BARBER';
UPDATE users SET role = 'USER' WHERE role NOT IN ('ADMIN', 'CLIENT', 'USER') OR role IS NULL;

