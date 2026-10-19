import { Request, Response } from 'express';
import { EquipamentoService, ValidacaoError } from '../services/EquipamentoService';

export class EquipamentoController {
  constructor(private readonly service: EquipamentoService) {}

  criar = async (req: Request, res: Response) => {
    try {
      const equipamento = await this.service.criarEquipamento(req.body);
      return res.status(201).json(equipamento);
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
      const equipamentos = await this.service.listarEquipamentos();
      return res.status(200).json(equipamentos);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  };
}
