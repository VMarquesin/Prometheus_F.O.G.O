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

  buscarPorId = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }
      const agente = await this.service.buscarPorId(id);
      if (!agente) {
        return res.status(404).json({ error: 'Agente não encontrado' });
      }
      return res.status(200).json(agente);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  };

  atualizar = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }
      const agente = await this.service.atualizarAgente(id, req.body);
      return res.status(200).json(agente);
    } catch (error) {
      if (error instanceof ValidacaoError) {
        return res.status(400).json({ error: error.message });
      }
      console.error(error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  };

  excluir = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }
      const resultado = await this.service.excluirAgente(id);
      return res.status(200).json(resultado);
    } catch (error) {
      if (error instanceof ValidacaoError) {
        return res.status(400).json({ error: error.message });
      }
      console.error(error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  };
}
