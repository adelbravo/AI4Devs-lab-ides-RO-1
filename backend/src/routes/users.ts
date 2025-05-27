import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { authenticateJWT, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Crear nuevo usuario (solo admin)
router.post('/', authenticateJWT, async (req: AuthRequest, res) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Solo los administradores pueden crear usuarios' });
  }
  const { email, name, password, role } = req.body;
  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Email, contraseña y rol son requeridos' });
  }
  if (!['ADMIN', 'USER'].includes(role)) {
    return res.status(400).json({ error: 'Rol inválido' });
  }
  try {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return res.status(409).json({ error: 'Ya existe un usuario con ese email' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        password: hashed,
        role,
      },
      select: { id: true, email: true, name: true, role: true },
    });
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

export default router; 