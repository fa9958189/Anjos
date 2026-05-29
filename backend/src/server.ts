import cors from 'cors';
import express from 'express';

const app = express();
const port = Number(process.env.PORT ?? 3333);
const defaultCorsOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://anjosambiental.com.br',
  'https://www.anjosambiental.com.br',
  'https://anjos-oito.vercel.app'
];
const corsOrigins = (process.env.CORS_ORIGIN ?? defaultCorsOrigins.join(','))
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable('x-powered-by');

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      console.warn('Origem bloqueada pelo CORS:', origin, 'Origens permitidas:', corsOrigins.join(','));
      callback(new Error('Origem nao permitida pelo CORS'));
    }
  })
);
app.use(express.json());

const dashboardPayload = {
  summary: {
    activeProcesses: 18,
    openProposals: 7,
    expiringContracts: 3,
    pendingTasks: 11,
    monthlyRevenue: 84200,
    delayedProcesses: 2
  },
  processes: [
    {
      id: 'AMB-001/2026',
      client: 'Fazenda Boa Vista',
      service: 'Licenciamento Ambiental Rural',
      status: 'Em análise técnica',
      owner: 'Técnico escritório',
      dueDate: '28/05/2026'
    },
    {
      id: 'AMB-002/2026',
      client: 'Sítio Santa Clara',
      service: 'CAR e regularização documental',
      status: 'Proposta enviada',
      owner: 'Comercial',
      dueDate: '31/05/2026'
    },
    {
      id: 'AMB-003/2026',
      client: 'Agro Veredas',
      service: 'Visita técnica e relatório fotográfico',
      status: 'Em execução',
      owner: 'Técnico campo',
      dueDate: '03/06/2026'
    }
  ]
};

app.get('/', (_request, response) => {
  response.json({ status: 'ok', service: 'Anjos Ambiental API', health: '/health' });
});

app.get('/health', (_request, response) => {
  response.json({ status: 'ok', service: 'Anjos Ambiental API' });
});

app.get('/api/dashboard/summary', (_request, response) => {
  response.json(dashboardPayload);
});

app.listen(port, () => {
  console.log('Anjos Ambiental API running on http://localhost:' + port);
});
