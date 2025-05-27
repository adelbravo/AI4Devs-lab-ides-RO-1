import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  try {
    const email = await question('Email del admin: ');
    const password = await question('Contraseña: ');
    const name = await question('Nombre (opcional): ');
    const hashed = await bcrypt.hash(password, 10);

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      console.log('Ya existe un usuario con ese email.');
      process.exit(1);
    }

    await prisma.user.create({
      data: {
        email,
        name: name || null,
        password: hashed,
        role: 'ADMIN',
      },
    });
    console.log('Usuario admin creado exitosamente.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main(); 