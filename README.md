# PROMETHEUS F.O.G.O.
### Centro de Controle de Operações (CCO) Tático e Preditivo

![Status](https://img.shields.io/badge/STATUS-OPERACIONAL%20V4.2-06b6d4?style=for-the-badge&logo=shield&logoColor=white)
![Stack](https://img.shields.io/badge/STACK-FULLSTACK%20TYPESCRIPT-3b82f6?style=for-the-badge&logo=typescript&logoColor=white)
![Database](https://img.shields.io/badge/DATABASE-POSTGIS%20%7C%20PRISMA-10b981?style=for-the-badge&logo=postgresql&logoColor=white)
![Realtime](https://img.shields.io/badge/TELEMETRIA-WEBSOCKETS%20%26%20HEATMAP-f59e0b?style=for-the-badge&logo=socketdotio&logoColor=white)

> **PROMETHEUS F.O.G.O.** (*Força Operacional de Gestão e Ocorrências*) é um ecossistema de gestão para cidades inteligentes e resposta a incidentes críticos em tempo real. A plataforma centraliza a telemetria de hardwares IoT (semáforos, radares micro-doppler, câmeras LPR e sensores meteorológicos) e o efetivo de agentes em campo através de uma malha preditiva e de despacho com **resolução autônoma (*Auto-Healing*)**.

---

## Como Resolve os Problemas (Diferenciais Técnicos)

Os quatro pilares de inovação técnica que sustentam a resiliência e viabilidade econômica do **PROMETHEUS F.O.G.O.**:

### 1. Inteligência Preditiva Híbrida
* **O Problema Tradicional:** CCOs convencionais são puramente *reativos*, despachando equipes somente após a pane de equipamentos ou após o alagamento consumado de vias.
* **A Nossa Solução:** O sistema integra um pipeline em tempo real com a **API Global Open-Meteo**, consumindo coordenadas geográficas e telemetria climática real (*weathercode*, temperatura, ventos e volume pluviométrico). Um **Motor de Regras Heurístico em Node.js** processa essas variáveis e cruza com a topografia dos ativos urbanos cadastrados no banco de dados geoespacial.

### 2. Ciclo de Resolução Autônoma (*Auto-Healing*)
* **O Problema Tradicional:** Despachos manuais geram gargalos de comunicação entre operadores de rádio e agentes de trânsito, elevando o MTTR (*Mean Time to Resolve*).
* **A Nossa Solução:** O módulo de Alertas IA e Crises implementa um ciclo automatizado de cura:
  1. O operador confirma o despacho da viatura/agente mais próximo no mapa tático.
  2. O backend executa `PUT /agentes/:id` definindo o status para **"Em Ocorrência"** e o pino no mapa assume visual de intervenção com telemetria imediata.
  3. O alerta é saneado da fila visual instantaneamente.
  4. **A Mágica do Auto-Healing:** Um gatilho temporal de **15 segundos** processa a conclusão do incidente, restaura o hardware degradado para **"Operacional"**, atualiza a viatura para **"Patrulhamento Ativo"** e notifica o painel via **Cyber-Toast**, liberando o recurso sem necessidade de burocracia manual.

### 3. Mapeamento Tático de Custo Zero (*Zero-Cost Geospatial*)
* **O Problema Tradicional:** Provedores proprietários (Google Maps Platform, Mapbox) cobram valores proibitivos por requisições de mapas escuros customizados e camadas de satélite para centros de comando governamentais.
* **A Nossa Solução:** Implementação baseada em **OpenStreetMap (OSM)** combinada a **React-Leaflet**, aplicando uma camada de filtragem matemática pura via CSS/SVG (`filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)`).

### 4. Rastreabilidade Histórica e Soft Delete (Inativação Lógica)
* **O Problema Tradicional:** A exclusão física de registros de equipamentos danificados ou agentes desligados corrompe séries temporais de machine learning e inviabiliza auditorias de órgãos de controle público.
* **A Nossa Solução:** Arquitetura de persistência baseada em **Soft Delete** (`situacao: 'desativado' | 'inativo'`). Nenhuma tupla crítica é removida fisicamente do banco de dados PostgreSQL.

---

## Stack Tecnológico

| Camada | Tecnologia | Propósito / Aplicação |
| :--- | :--- | :--- |
| **Frontend Core** | **React 18 (Vite)** + **TypeScript** | SPA, tipagem estrita e hot-reload instantâneo. |
| **Estilização** | **Tailwind CSS** + **Vanilla CSS** | Interface tática cyberpunk com tema escuro profundo (`bg-zinc-950`), brilhos neon e microinterações. |
| **Geolocalização** | **React-Leaflet** + **Leaflet.heat** | Renderização vetorial de mapas, marcadores dinâmicos, voos de câmera (*flyTo*) e mapas de calor de incidentes. |
| **Backend API** | **Node.js** + **Express** + **TypeScript** | Arquitetura em camadas (Controllers, Services, Repositories) com separação de responsabilidades. |
| **Persistência / ORM** | **Prisma ORM** | Modelagem robusta, migrações determinísticas e queries com tipagem segura. |
| **Banco de Dados** | **PostgreSQL 15** + **PostGIS** | Armazenamento relacional e indexação espacial (`GIST`) para consultas geoespaciais em tempo real. |
| **Comunicação Realtime** | **Socket.io** (`client` & `server`) | Emissão instantânea de novos alertas da malha IoT para todos os operadores conectados. |
| **Infraestrutura** | **Docker** + **Docker Compose** | Provisionamento reproduzível do banco de dados em contêineres isolados. |

---

## Guia Rápido de Execução (Como Rodar Localmente)

Siga rigorosamente as etapas abaixo para clonar, configurar e executar todo o ecossistema em seu ambiente local.

### Pré-requisitos
* **Node.js** (versão `18.x` ou superior instalada)
* **npm** (versão `9.x` ou superior)
* **Docker** & **Docker Compose** instalados e em execução

---

### Passo 1: Subir o Banco de Dados PostGIS (Docker)

Na raiz do repositório, execute o comando para inicializar o contêiner do PostgreSQL com a extensão espacial PostGIS:

```bash
docker-compose up -d
```

> **Verificação:** Execute `docker ps` e certifique-se de que o contêiner `fogo_postgis` está ativo na porta `5432`.

---

### Passo 2: Configuração e Dependências do Backend

Navegue até a pasta `api` e instale as dependências:

```bash
cd api
npm install
```

Crie o arquivo de ambiente `.env` dentro da pasta `api/` (ou garanta que ele possua a seguinte configuração de conexão):

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fogo_db?schema=public"
```

---

### Passo 3: Migrações, População Inicial (Seed) e Execução da API

Execute as migrações do Prisma para criar todas as tabelas e índices geoespaciais no banco:

```bash
npx prisma migrate dev
```

> **CRÍTICO — População Inicial da Base (Seed):**
> Para que o painel exiba estados, cidades, bairros, órgãos reguladores (PMESP, SEMUTRAN), modelos e tipos de equipamentos, é **obrigatório** rodar o script de seed:

```bash
npm run seed
```
*(Alternativa suportada pelo Prisma CLI: `npx prisma db seed`)*

Inicie o servidor backend em modo de desenvolvimento:

```bash
npm run dev
```

> **Sucesso:** A API estará disponível em `http://localhost:3000` com WebSockets ativos.

---

### Passo 4: Inicialização do Frontend

Abra um novo terminal, navegue até a pasta `frontend` e instale as dependências:

```bash
cd frontend
npm install
```

Inicie o servidor de desenvolvimento do Vite:

```bash
npm run dev
```

> **Acesso:** Abra o navegador no endereço indicado pelo Vite: **`http://localhost:5173`**

---

## Módulos do Sistema e Navegação

O painel conta com rotas dedicadas para atender a todos os níveis de operação:

* **`/` (Dashboard CCO Central):** Mapa tático interativo de tela cheia com alternância de modo de calor (*Heatmap*), radar de nós ativos, relógio UTC ao vivo, gaveta rápida de inventário e widget de **Últimos Alertas IA** com foco rápido no mapa e botão de despacho.
* **`/inventario` (Inventário Geral IoT):** Grade completa de equipamentos com busca full-text, ordenação por urgência de telemetria, filtros por órgão/tipo e visores de telemetria inteligente com fallback defensivo.
* **`/efetivo` (Gestão de Efetivo Tático):** Monitoramento de agentes em campo, viaturas em patrulhamento, densidade operacional por zonas geográficas e histórico de ocorrências.
* **`/inteligencia` (Inteligência Preditiva Híbrida):** Seletor dinâmico de cidades com consumo ao vivo da API meteorológica, cálculo de probabilidades de risco e botões de mitigação semafórica com notificações Cyber-Toast.
* **`/crises` (Gestão de Crises e Despacho Autônomo):** Painel focado em triagem rápida de equipamentos com falha crítica e unidades em ocorrência.
