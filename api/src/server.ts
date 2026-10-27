import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import equipamentoRoutes from './routes/equipamento.routes';
import agenteRoutes from './routes/agente.routes';
import inteligenciaRoutes from './routes/inteligencia.routes';
import webSocketService from './websocket';
import { SimuladorService } from './services/SimuladorService';

import prisma from './prisma';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use('/equipamentos', equipamentoRoutes);
app.use('/agentes', agenteRoutes);
app.use('/inteligencia', inteligenciaRoutes);
app.use(inteligenciaRoutes);

app.get('/auxiliares', async (_req, res) => {
  try {
    const [orgaos, modelos, tiposLocais, tiposAgentes] = await Promise.all([
      prisma.orgao.findMany({ orderBy: { id: 'asc' } }),
      prisma.modelo.findMany({
        orderBy: { id: 'asc' },
        include: { marca: true, tipoEquipamento: true },
      }),
      prisma.tipoLocal.findMany({ orderBy: { id: 'asc' } }),
      prisma.tipoAgente.findMany({ orderBy: { id: 'asc' } }),
    ]);
    res.json({ orgaos, modelos, tiposLocais, tiposAgentes });
  } catch (err) {
    console.error('Erro ao buscar auxiliares:', err);
    res.status(500).json({ error: 'Erro ao buscar dados auxiliares' });
  }
});

app.get('/ping', (_req, res) => {
  res.json({ message: 'F.O.G.O. API Operacional' });
});

const server = http.createServer(app);
webSocketService.inicializar(server);

const simulador = new SimuladorService();
simulador.iniciar();

server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
