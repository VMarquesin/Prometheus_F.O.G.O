import { EquipamentoInput, EquipamentoRepository } from '../repositories/EquipamentoRepository';

export class ValidacaoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidacaoError';
  }
}

export class EquipamentoService {
  constructor(private readonly repository: EquipamentoRepository) {}

  async criarEquipamento(dados: Partial<EquipamentoInput>) {
    const faltando: string[] = [];
    if (dados.modeloId == null) faltando.push('modeloId');
    if (!dados.situacao) faltando.push('situacao');
    if (dados.bairroId == null) faltando.push('bairroId');

    if (faltando.length > 0) {
      throw new ValidacaoError(`Campos obrigatórios ausentes: ${faltando.join(', ')}`);
    }

    const temLat = dados.latitude != null;
    const temLng = dados.longitude != null;
    if (temLat !== temLng) {
      throw new ValidacaoError('Informe latitude e longitude juntas.');
    }

    return this.repository.criar(dados as EquipamentoInput);
  }

  async listarEquipamentos() {
    return this.repository.listar();
  }

  async buscarPorId(id: number) {
    return this.repository.buscarPorId(id);
  }

  async atualizarEquipamento(id: number, dados: Partial<EquipamentoInput>) {
    const temLat = dados.latitude != null;
    const temLng = dados.longitude != null;
    if (temLat !== temLng) {
      throw new ValidacaoError('Informe latitude e longitude juntas.');
    }
    return this.repository.atualizar(id, dados);
  }

  async excluirEquipamento(id: number) {
    return this.repository.excluir(id);
  }
}
