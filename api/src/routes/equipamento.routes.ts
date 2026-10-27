import { Router } from 'express';
import { EquipamentoRepository } from '../repositories/EquipamentoRepository';
import { EquipamentoService } from '../services/EquipamentoService';
import { EquipamentoController } from '../controllers/EquipamentoController';

const repository = new EquipamentoRepository();
const service = new EquipamentoService(repository);
const controller = new EquipamentoController(service);

const router = Router();

router.post('/', controller.criar);
router.get('/', controller.listar);
router.get('/:id', controller.buscarPorId);
router.put('/:id', controller.atualizar);
router.delete('/:id', controller.excluir);

export default router;
