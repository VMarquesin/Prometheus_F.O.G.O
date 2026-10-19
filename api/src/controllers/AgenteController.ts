import type { Request, Response } from 'express';
import { AgenteService } from '../services/AgenteService';
import { ValidacaoError } from '../services/EquipamentoService';

export class AgenteController {
  constructor(private readonly service: AgenteService) {}

  criar = async (req: Request, res: Response) => {
    try {
      const agente = await this.service.criarAgente(req.body);
      return res.status(201).json(agente);
    } catch (error) {
      if (error instanceof ValidacaoError) {
        return res.status(400).json({ error: error.message });
      }
      console.error(error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  };

  listar = async (_req: Request, res: Response) => {
    try {
      const agentes = await this.service.listarAgentes();
      return res.status(200).json(agentes);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  };
}
