import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { prisma } from './config/prisma';
import apiRouter from './routes';
import { handlers } from './errors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({ origin: 'http://localhost:4200', credentials: true }));
app.use(morgan('tiny'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/api/', apiRouter);

// Catch-all 404: risponde in JSON per i path non gestiti (invece dell'HTML default di Express)
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Risorsa non trovata' });
});

app.use(handlers);


const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Connessione al database PostgreSQL (via Prisma) riuscita!');

    app.listen(PORT, () => {
      console.log(`🚀 Server in esecuzione su porta ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Errore avvio server:', error);
    process.exit(1);
  }
};

startServer();

export default app;