import type { AgenteInput, AgenteRepository } from '../repositories/AgenteRepository';
import { ValidacaoError } from './EquipamentoService';

export class AgenteService {
  constructor(private readonly repository: AgenteRepository) {}

  async criarAgente(dados: Partial<AgenteInput>) {
    const faltando: string[] = [];
    if (dados.tipoAgenteId == null) faltando.push('tipoAgenteId');
    if (!dados.nome) faltando.push('nome');
    if (!dados.matricula) faltando.push('matricula');
    if (!dados.situacao) faltando.push('situacao');

    if (faltando.length > 0) {
      throw new ValidacaoError(`Campos obrigatórios ausentes: ${faltando.join(', ')}`);
    }

    const temLat = dados.latitude != null;
    const temLng = dados.longitude != null;
    if (temLat !== temLng) {
      throw new ValidacaoError('Informe latitude e longitude juntas.');
    }

    return this.repository.criar(dados as AgenteInput);
  }

  async listarAgentes() {
    return this.repository.listar();
  }
}
