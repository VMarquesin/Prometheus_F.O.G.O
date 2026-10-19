import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import equipamentoRoutes from './routes/equipamento.routes';
import agenteRoutes from './routes/agente.routes';
import webSocketService from './websocket';
import { SimuladorService } from './services/SimuladorService';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use('/equipamentos', equipamentoRoutes);
app.use('/agentes', agenteRoutes);

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
