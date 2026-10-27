import { Router } from 'express';
import { InteligenciaController } from '../controllers/InteligenciaController';

const inteligenciaController = new InteligenciaController();

const routes = Router();

routes.get('/predicoes', inteligenciaController.gerarPredicoes);

export default routes;
