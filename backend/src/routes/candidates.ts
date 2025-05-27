import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';

const router = Router();
const prisma = new PrismaClient();

// Configuración de S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

// Configuración de multer para S3
const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.AWS_BUCKET_NAME || '',
    metadata: (req: Request, file: Express.Multer.File, cb: (error: any, metadata?: any) => void) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req: Request, file: Express.Multer.File, cb: (error: any, key?: string) => void) => {
      const fileName = `candidates/${Date.now()}-${file.originalname}`;
      cb(null, fileName);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// Función para validar JSON array
const isJsonArray = (value: string) => {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) && parsed.length > 0;
  } catch {
    return false;
  }
};

// Validación de datos del candidato
const candidateValidation = [
  body('firstName').notEmpty().withMessage('El nombre es requerido'),
  body('lastName').notEmpty().withMessage('El apellido es requerido'),
  body('email').isEmail().withMessage('El email debe ser válido'),
  body('phone').optional().isMobilePhone('any').withMessage('El teléfono debe ser válido'),
  body('address').optional(),
  body('education')
    .custom(isJsonArray)
    .withMessage('La educación debe ser un array válido con al menos un registro'),
  body('experience')
    .custom(isJsonArray)
    .withMessage('La experiencia debe ser un array válido con al menos un registro'),
];

// Crear un nuevo candidato
router.post('/', upload.single('cv'), candidateValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Si hay errores de validación y se subió un archivo, intentar eliminarlo de S3
      if (req.file) {
        try {
          await s3Client.send({
            Bucket: process.env.AWS_BUCKET_NAME || '',
            Key: (req.file as any).key,
          });
        } catch (deleteError) {
          console.error('Error al eliminar archivo de S3:', deleteError);
        }
      }
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, phone, address, education, experience } = req.body;
    const cvFile = req.file;

    // Parsear los arrays de educación y experiencia
    const parsedEducation = JSON.parse(education);
    const parsedExperience = JSON.parse(experience);

    // Validar que los arrays no estén vacíos
    if (!Array.isArray(parsedEducation) || parsedEducation.length === 0) {
      throw new Error('La educación debe contener al menos un registro');
    }
    if (!Array.isArray(parsedExperience) || parsedExperience.length === 0) {
      throw new Error('La experiencia debe contener al menos un registro');
    }

    const candidate = await prisma.candidate.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        address,
        education: {
          create: parsedEducation.map((edu: any) => ({
            ...edu,
            startDate: new Date(edu.startDate),
            endDate: edu.endDate ? new Date(edu.endDate) : null,
          })),
        },
        experience: {
          create: parsedExperience.map((exp: any) => ({
            ...exp,
            startDate: new Date(exp.startDate),
            endDate: exp.endDate ? new Date(exp.endDate) : null,
          })),
        },
        documents: cvFile ? {
          create: {
            fileName: cvFile.originalname,
            fileUrl: (cvFile as any).location,
            fileType: cvFile.mimetype,
            fileSize: cvFile.size,
          },
        } : undefined,
        auditLogs: {
          create: {
            action: 'CREATE',
            details: 'Candidato creado',
          },
        },
      },
      include: {
        education: true,
        experience: true,
        documents: true,
      },
    });

    res.status(201).json(candidate);
  } catch (error) {
    console.error('Error al crear candidato:', error);
    // Si hay un error y se subió un archivo, intentar eliminarlo de S3
    if (req.file) {
      try {
        await s3Client.send({
          Bucket: process.env.AWS_BUCKET_NAME || '',
          Key: (req.file as any).key,
        });
      } catch (deleteError) {
        console.error('Error al eliminar archivo de S3:', deleteError);
      }
    }
    res.status(500).json({ error: error instanceof Error ? error.message : 'Error al crear el candidato' });
  }
});

// Obtener todos los candidatos
router.get('/', async (req: Request, res: Response) => {
  try {
    const candidates = await prisma.candidate.findMany({
      include: {
        education: true,
        experience: true,
        documents: true,
      },
    });
    res.json(candidates);
  } catch (error) {
    console.error('Error al obtener candidatos:', error);
    res.status(500).json({ error: 'Error al obtener los candidatos' });
  }
});

// Obtener un candidato por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const candidate = await prisma.candidate.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        education: true,
        experience: true,
        documents: true,
      },
    });

    if (!candidate) {
      return res.status(404).json({ error: 'Candidato no encontrado' });
    }

    res.json(candidate);
  } catch (error) {
    console.error('Error al obtener candidato:', error);
    res.status(500).json({ error: 'Error al obtener el candidato' });
  }
});

// ENDPOINTS DE AUTOCOMPLETADO
router.get('/autocomplete/institutions', async (req: Request, res: Response) => {
  const { query = '' } = req.query;
  try {
    const results = await prisma.education.findMany({
      where: {
        institution: {
          contains: String(query),
          mode: 'insensitive',
        },
      },
      select: { institution: true },
      distinct: ['institution'],
      take: 10,
    });
    res.json(results.map(r => r.institution).filter(Boolean));
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar instituciones' });
  }
});

router.get('/autocomplete/degrees', async (req: Request, res: Response) => {
  const { query = '' } = req.query;
  try {
    const results = await prisma.education.findMany({
      where: {
        degree: {
          contains: String(query),
          mode: 'insensitive',
        },
      },
      select: { degree: true },
      distinct: ['degree'],
      take: 10,
    });
    res.json(results.map(r => r.degree).filter(Boolean));
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar títulos' });
  }
});

router.get('/autocomplete/fields', async (req: Request, res: Response) => {
  const { query = '' } = req.query;
  try {
    const results = await prisma.education.findMany({
      where: {
        fieldOfStudy: {
          contains: String(query),
          mode: 'insensitive',
        },
      },
      select: { fieldOfStudy: true },
      distinct: ['fieldOfStudy'],
      take: 10,
    });
    res.json(results.map(r => r.fieldOfStudy).filter(Boolean));
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar campos de estudio' });
  }
});

router.get('/autocomplete/companies', async (req: Request, res: Response) => {
  const { query = '' } = req.query;
  try {
    const results = await prisma.experience.findMany({
      where: {
        company: {
          contains: String(query),
          mode: 'insensitive',
        },
      },
      select: { company: true },
      distinct: ['company'],
      take: 10,
    });
    res.json(results.map(r => r.company).filter(Boolean));
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar empresas' });
  }
});

router.get('/autocomplete/positions', async (req: Request, res: Response) => {
  const { query = '' } = req.query;
  try {
    const results = await prisma.experience.findMany({
      where: {
        position: {
          contains: String(query),
          mode: 'insensitive',
        },
      },
      select: { position: true },
      distinct: ['position'],
      take: 10,
    });
    res.json(results.map(r => r.position).filter(Boolean));
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar cargos' });
  }
});

export default router; 