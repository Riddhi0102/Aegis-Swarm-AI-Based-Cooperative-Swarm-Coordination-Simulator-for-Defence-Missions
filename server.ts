import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json());

  // Retrieve Gemini Key securely on the server side
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Server-side secured /api/gemini endpoint
  app.post('/api/gemini', async (req, res) => {
    try {
      const { prompt, systemInstruction } = req.body;
      if (!apiKey) {
        return res.status(400).json({ error: 'GEMINI_API_KEY is not configured on the server. Please add it in Settings > Secrets.' });
      }

      console.log('[Aegis-Swarm] Consulting Tactical AI model...', prompt);
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: systemInstruction ? { systemInstruction } : undefined,
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      res.status(500).json({ error: error.message || 'Error communicating with Gemini AI' });
    }
  });

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // In development mode, integrate Vite server as Express middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    // Dynamically serve index.html with Vite transformations
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Aegis Swarm | Advanced AI Simulator</title>
  </head>
  <body class="bg-[#0b0f19] text-slate-100 overflow-hidden select-none m-0 p-0 font-sans">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    // In production mode, serve the static compiled assets from /dist
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const port = 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`[Aegis-Swarm] Operational on port ${port}`);
  });
}

startServer();
