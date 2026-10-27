import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const CENTRO_TUPA = { lat: -21.9348, lng: -50.5146 };
const DISPERSAO = 0.05;
const TOTAL_EQUIPAMENTOS = 20;
const TOTAL_AGENTES = 15;

const SITUACOES_EQUIPAMENTO: Array<{ valor: string; percentual: number }> = [
    { valor: 'operacional', percentual: 60 },
    { valor: 'mau_funcionamento', percentual: 30 },
    { valor: 'desativado', percentual: 10 },
];

const SITUACOES_AGENTE: Array<{ valor: string; percentual: number }> = [
    { valor: 'Patrulhamento Ativo', percentual: 50 },
    { valor: 'Disponível na Base', percentual: 30 },
    { valor: 'Em Ocorrência', percentual: 10 },
    { valor: 'inativo', percentual: 10 },
];

const LOGRADOUROS = [
    'Av. Tamoios',
    'Av. Tapuias',
    'Av. Brasil',
    'Rua Aimorés',
    'Rua Caingangs',
    'Rua Guaianás',
    'Rua Cherentes',
    'Rua Coroados',
    'Rua Nhambiquaras',
    'Rua Paiaguás',
    'Rua Carijós',
    'Rua Bororós',
];

const BAIRROS = ['Centro', 'Jardim América', 'Vila Abarca', 'Parque Universitário', 'Jardim Ipiranga'];

const SOBRENOMES = [
    'Silva', 'Santos', 'Costa', 'Oliveira', 'Souza', 'Pereira', 'Almeida', 'Ferreira',
    'Rodrigues', 'Lima', 'Gomes', 'Ribeiro', 'Carvalho', 'Martins', 'Rocha', 'Barbosa',
];

const coordenadaAleatoria = (): { lat: number; lng: number } => ({
    lat: Number((CENTRO_TUPA.lat + (Math.random() - 0.5) * DISPERSAO).toFixed(6)),
    lng: Number((CENTRO_TUPA.lng + (Math.random() - 0.5) * DISPERSAO).toFixed(6)),
});

const sortear = <T>(lista: readonly T[]): T => lista[Math.floor(Math.random() * lista.length)];

const embaralhar = <T>(lista: T[]): T[] => {
    const copia = [...lista];
    for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
};

const distribuirPorPercentual = (
    total: number,
    faixas: Array<{ valor: string; percentual: number }>,
): string[] => {
    const brutos = faixas.map((f) => ({ ...f, exato: (f.percentual / 100) * total }));
    const contagens = brutos.map((b) => Math.floor(b.exato));
    let restante = total - contagens.reduce((a, b) => a + b, 0);

    brutos
        .map((b, i) => ({ i, resto: b.exato - Math.floor(b.exato) }))
        .sort((a, b) => b.resto - a.resto)
        .forEach(({ i }) => {
            if (restante > 0) {
                contagens[i]++;
                restante--;
            }
        });

    const resultado = faixas.flatMap((f, i) => Array<string>(contagens[i]).fill(f.valor));
    return embaralhar(resultado);
};

const geradorUnico = (fabrica: () => string) => {
    const usados = new Set<string>();
    return (): string => {
        let valor = fabrica();
        while (usados.has(valor)) valor = fabrica();
        usados.add(valor);
        return valor;
    };
};

const diasAPartirDeHoje = (dias: number): Date => {
    const data = new Date();
    data.setDate(data.getDate() + dias);
    return data;
};

const inteiroEntre = (min: number, max: number): number =>
    Math.floor(Math.random() * (max - min + 1)) + min;


async function main(): Promise<void> {
    console.log(' PROMETHEUS F.O.G.O. — Seed de demonstração');
    console.log('--------------------------------------------------');

    console.log(' Limpando dados transacionais...');
    const [manut, agentesRemovidos, equipRemovidos] = await prisma.$transaction([
        prisma.manutencao.deleteMany(),
        prisma.agente.deleteMany(),
        prisma.equipamento.deleteMany(),
    ]);
    console.log(
        `   ↳ ${manut.count} manutenções, ${agentesRemovidos.count} agentes e ${equipRemovidos.count} equipamentos removidos.`,
    );

    console.log(' Garantindo tabelas de domínio...');

    const estado = await prisma.estado.upsert({
        where: { uf: 'SP' },
        update: {},
        create: { uf: 'SP', nome: 'São Paulo' },
    });

    const cidade =
        (await prisma.cidade.findFirst({ where: { nome: 'Tupã', estadoId: estado.id } })) ??
        (await prisma.cidade.create({ data: { nome: 'Tupã', estadoId: estado.id } }));

    const bairros = await Promise.all(
        BAIRROS.map(
            async (nome) =>
                (await prisma.bairro.findFirst({ where: { nome, cidadeId: cidade.id } })) ??
                (await prisma.bairro.create({ data: { nome, cidadeId: cidade.id } })),
        ),
    );

    const definicaoOrgaos = [
        { chave: 'PM', nome: 'Polícia Militar do Estado', sigla: 'PMESP' },
        { chave: 'MOB', nome: 'Secretaria de Mobilidade Urbana', sigla: 'SEMUTRAN' },
        { chave: 'GCM', nome: 'Guarda Civil Municipal', sigla: 'GCM' },
        { chave: 'DEFCIV', nome: 'Defesa Civil', sigla: 'DEF-CIV' },
        { chave: 'CBM', nome: 'Corpo de Bombeiros', sigla: 'CBM' },
    ] as const;

    const orgaos: Record<(typeof definicaoOrgaos)[number]['chave'], number> = {} as never;
    for (const o of definicaoOrgaos) {
        const registro = await prisma.orgao.upsert({
            where: { nome: o.nome },
            update: { sigla: o.sigla },
            create: { nome: o.nome, sigla: o.sigla },
        });
        orgaos[o.chave] = registro.id;
    }

    const nomesTiposLocais = [
        'Rodovia / Via Expressa',
        'Cruzamento Urbano',
        'Estacionamento Rotativo',
        'Área de Risco Hídrico',
        'Base Operacional',
    ];
    const tiposLocais = await Promise.all(
        nomesTiposLocais.map((nome) =>
            prisma.tipoLocal.upsert({ where: { nome }, update: {}, create: { nome } }),
        ),
    );

    const catalogo = [
        { tipo: 'Câmera de Videomonitoramento', marca: 'Intelbras', modelo: 'VIP 9000', orgao: 'PM', prefixoIp: 10 },
        { tipo: 'Radar de Velocidade', marca: 'Intelbras', modelo: 'SpeedControl X1', orgao: 'MOB', prefixoIp: 11 },
        { tipo: 'Controlador Semafórico IoT', marca: 'Siemens Mobility', modelo: 'Sitraffic sX', orgao: 'MOB', prefixoIp: 12 },
        { tipo: 'Sensor Meteorológico', marca: 'Vaisala', modelo: 'WXT536 Weather Transmitter', orgao: 'DEFCIV', prefixoIp: 13 },
        { tipo: 'Bodycam', marca: 'Motorola Solutions', modelo: 'VB400 Body-Worn Camera', orgao: 'GCM', prefixoIp: 14 },
        { tipo: 'Viatura Tática', marca: 'Toyota', modelo: 'Hilux SW4 Tática', orgao: 'CBM', prefixoIp: 15 },
    ] as const;

    const modelos: Array<{
        id: number;
        tipo: string;
        modelo: string;
        orgaoId: number;
        prefixoIp: number;
    }> = [];

    for (const item of catalogo) {
        const tipo = await prisma.tipoEquipamento.upsert({
            where: { nome: item.tipo },
            update: {},
            create: { nome: item.tipo },
        });
        const marca = await prisma.marca.upsert({
            where: { nome: item.marca },
            update: {},
            create: { nome: item.marca },
        });
        const modelo =
            (await prisma.modelo.findFirst({ where: { nome: item.modelo, marcaId: marca.id } })) ??
            (await prisma.modelo.create({
                data: { nome: item.modelo, marcaId: marca.id, tipoEquipamentoId: tipo.id },
            }));

        modelos.push({
            id: modelo.id,
            tipo: item.tipo,
            modelo: item.modelo,
            orgaoId: orgaos[item.orgao],
            prefixoIp: item.prefixoIp,
        });
    }

    const definicaoTiposAgente = [
        { nome: 'Agente de Trânsito', descricao: 'Fiscalização de vias urbanas', orgao: 'MOB', patentes: ['Agente', 'Inspetor'] },
        { nome: 'Policial Militar', descricao: 'Policiamento ostensivo e preventivo', orgao: 'PM', patentes: ['Sd.', 'Cb.', 'Sgt.', 'Ten.'] },
        { nome: 'Guarda Civil Municipal', descricao: 'Proteção de próprios municipais e apoio viário', orgao: 'GCM', patentes: ['GCM', 'Inspetor', 'Subinspetor'] },
        { nome: 'Agente de Defesa Civil', descricao: 'Prevenção e resposta a desastres naturais', orgao: 'DEFCIV', patentes: ['Agente', 'Coord.'] },
        { nome: 'Bombeiro Militar', descricao: 'Combate a incêndios, salvamento e resgate', orgao: 'CBM', patentes: ['Sd.', 'Cb.', 'Sgt.', 'Cap.'] },
    ] as const;

    const tiposAgente: Array<{ id: number; orgaoId: number; patentes: readonly string[] }> = [];
    for (const t of definicaoTiposAgente) {
        const registro = await prisma.tipoAgente.upsert({
            where: { nome: t.nome },
            update: { descricao: t.descricao },
            create: { nome: t.nome, descricao: t.descricao },
        });
        tiposAgente.push({ id: registro.id, orgaoId: orgaos[t.orgao], patentes: t.patentes });
    }

    console.log(
        `   ↳ ${bairros.length} bairros, ${definicaoOrgaos.length} órgãos, ${modelos.length} modelos e ${tiposAgente.length} tipos de agente prontos.`,
    );

    console.log(` Gerando ${TOTAL_EQUIPAMENTOS} equipamentos IoT...`);

    const novoNumeroSerie = geradorUnico(
        () => `PRM-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    );
    const situacoesEquip = distribuirPorPercentual(TOTAL_EQUIPAMENTOS, SITUACOES_EQUIPAMENTO);

    for (let i = 0; i < TOTAL_EQUIPAMENTOS; i++) {
        const modelo = modelos[i % modelos.length];
        const situacao = situacoesEquip[i];
        const { lat, lng } = coordenadaAleatoria();

        const dataProximaManutencao =
            situacao === 'mau_funcionamento'
                ? diasAPartirDeHoje(inteiroEntre(-7, 2))
                : situacao === 'desativado'
                    ? null
                    : diasAPartirDeHoje(inteiroEntre(15, 180));

        const necessidadeManutencao =
            situacao === 'mau_funcionamento' ? 'imediata' : situacao === 'desativado' ? null : 'periodica';

        const dados: Prisma.EquipamentoUncheckedCreateInput = {
            modeloId: modelo.id,
            numeroSerie: novoNumeroSerie(),
            situacao,
            bairroId: sortear(bairros).id,
            orgaoId: modelo.orgaoId,
            tipoLocalId: sortear(tiposLocais).id,
            logradouro: `${sortear(LOGRADOUROS)}, ${inteiroEntre(10, 2500)}`,
            cep: `17600-${String(inteiroEntre(0, 999)).padStart(3, '0')}`,
            dataInstalacao: diasAPartirDeHoje(-inteiroEntre(60, 1460)),
            dataProximaManutencao,
            necessidadeManutencao,
            caracteristicasEspecificas: {
                ip: `10.14.${modelo.prefixoIp}.${inteiroEntre(2, 254)}`,
                firmware: `v${inteiroEntre(2, 5)}.${inteiroEntre(0, 9)}.${inteiroEntre(0, 20)}`,
                bateria: situacao === 'desativado' ? 0 : inteiroEntre(42, 100),
                temperatura: situacao === 'mau_funcionamento' ? inteiroEntre(68, 91) : inteiroEntre(28, 52),
                latenciaMs: situacao === 'operacional' ? inteiroEntre(8, 40) : inteiroEntre(180, 950),
                descricao: `${modelo.tipo} ${modelo.modelo} integrado à malha CCO. Status: ${situacao}.`,
            },
        };

        const equipamento = await prisma.equipamento.create({ data: dados, select: { id: true } });

        await prisma.$executeRaw`
      UPDATE equipamentos
      SET coordenadas = ST_SetSRID(ST_MakePoint(${lng}::double precision, ${lat}::double precision), 4326)
      WHERE id = ${equipamento.id}
    `;
    }

    console.log(`👮 Gerando ${TOTAL_AGENTES} agentes de campo...`);

    const novaMatricula = geradorUnico(
        () => `MAT-${String(Math.floor(Math.random() * 90000) + 10000)}`,
    );
    const sobrenomesDisponiveis = embaralhar(SOBRENOMES);
    const situacoesAgente = distribuirPorPercentual(TOTAL_AGENTES, SITUACOES_AGENTE);

    for (let i = 0; i < TOTAL_AGENTES; i++) {
        const tipo = tiposAgente[i % tiposAgente.length];
        const situacao = situacoesAgente[i];
        const sobrenome = sobrenomesDisponiveis[i % sobrenomesDisponiveis.length];

        const dados: Prisma.AgenteUncheckedCreateInput = {
            tipoAgenteId: tipo.id,
            orgaoId: tipo.orgaoId,
            nome: `${sortear(tipo.patentes)} ${sobrenome}`,
            matricula: novaMatricula(),
            situacao,
        };

        const agente = await prisma.agente.create({ data: dados, select: { id: true } });

        if (situacao !== 'inativo') {
            const { lat, lng } = coordenadaAleatoria();
            await prisma.$executeRaw`
        UPDATE agentes
        SET coordenadas_atuais = ST_SetSRID(ST_MakePoint(${lng}::double precision, ${lat}::double precision), 4326)
        WHERE id = ${agente.id}
      `;
        }
    }

    const [resumoEquip, resumoAgentes] = await Promise.all([
        prisma.equipamento.groupBy({ by: ['situacao'], _count: { _all: true } }),
        prisma.agente.groupBy({ by: ['situacao'], _count: { _all: true } }),
    ]);

    console.log('--------------------------------------------------');
    console.log(' Base de demonstração criada com sucesso!');
    console.log(' Equipamentos por situação:');
    resumoEquip.forEach((r) => console.log(`   • ${r.situacao.padEnd(20)} ${r._count._all}`));
    console.log(' Agentes por situação:');
    resumoAgentes.forEach((r) => console.log(`   • ${r.situacao.padEnd(20)} ${r._count._all}`));
    console.log('--------------------------------------------------');
}

main()
    .catch((erro: unknown) => {
        console.error('Falha ao executar o seed:', erro);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });