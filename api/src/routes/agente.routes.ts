import { Router } from 'express';
import { AgenteRepository } from '../repositories/AgenteRepository';
import { AgenteService } from '../services/AgenteService';
import { AgenteController } from '../controllers/AgenteController';

const repository = new AgenteRepository();
const service = new AgenteService(repository);
const controller = new AgenteController(service);

const router = Router();

router.post('/', controller.criar);
router.get('/', controller.listar);

export default router;
