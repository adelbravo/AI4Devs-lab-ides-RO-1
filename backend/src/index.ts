import { Request, Response, NextFunction } from 'express';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import candidatesRouter from './routes/candidates';
import cors from 'cors';
import authRoutes from './routes/auth';
import { authenticateJWT } from './middleware/auth';
import usersRoutes from './routes/users';

dotenv.config();

// Verificar que JWT_SECRET esté definido
if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET no está definido en las variables de entorno.');
  process.exit(1);
}

const prisma = new PrismaClient();

export const app = express();
export default prisma;

const port = 3010;

// Configuración de CORS
app.use(cors({
  origin: 'http://localhost:3000', // URL del frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware para parsear JSON
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes); // login público
app.use('/api/candidates', authenticateJWT, candidatesRouter); // protegido
app.use('/api/users', authenticateJWT, usersRoutes); // solo admin puede crear usuarios

app.get('/', (req, res) => {
  res.send('Hola LTI!');
});

// Middleware de manejo de errores
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
