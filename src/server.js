import express from 'express';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { RepairDesk, quotes, createSlots } from './domain.js';
import { createMcpServer } from './mcp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export function createApp({ dataFile = resolve(root, 'data/tasks.json'), clock } = {}) {
  const desk = new RepairDesk(dataFile, clock); const app = express();
  const mcpActivity = [];
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    const host = req.headers.host;
    if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host ?? '')) return res.status(403).json({ error: 'Local host required.' });
    if (req.headers.origin && ![`http://${host}`].includes(req.headers.origin)) return res.status(403).json({ error: 'Origin not allowed.' });
    res.set({ 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Cache-Control': 'no-store', 'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'" });
    next();
  });
  app.use(express.json({ limit: '16kb' }));
  app.get('/api/health', (req, res) => res.json({ ok: true, mode: 'local-fixture-simulation', mcp: '2025-11-25', externalBooking: false, modelConnected: false }));
  app.get('/api/desk', (req, res) => res.json({ tasks: desk.list(), quotes, slots: createSlots(desk.clock()), timezone: 'Asia/Kuala_Lumpur' }));
  app.get('/api/mcp-activity', (req, res) => res.json({ mode: 'local fictional household', calls: mcpActivity, runtimeModelConnected: false }));
  app.post('/api/report', (req, res) => res.json(desk.report(req.body)));
  app.post('/api/compare', (req, res) => res.json(desk.compare(req.body)));
  app.post('/api/propose', (req, res) => res.json(desk.propose(req.body)));
  app.get('/api/review/:id', (req, res) => res.json(desk.review(req.params.id)));
  app.post('/api/renew-review', (req,res)=>res.json(desk.renewReview(req.body)));
  app.post('/api/approve', (req, res) => res.json(desk.approve(req.body)));
  app.post('/api/cancel', (req, res) => res.json(desk.cancel(req.body)));
  // The visible planning/replanning flow invokes the real MCP endpoint. The
  // target is derived from the local socket, never from user-supplied URLs.
  async function invokeMcp(req, res, name) {
    const client = new Client({ name: 'household-web-experience', version: '0.2.1' });
    try {
      await client.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${req.socket.localPort}/mcp`)));
      const result = await client.callTool({ name, arguments: req.body });
      mcpActivity.push({ tool: name, protocol: '2025-11-25', transport: 'Streamable HTTP', outcome: result.isError ? 'rejected' : 'completed', at: new Date().toISOString() });
      if (mcpActivity.length > 50) mcpActivity.shift();
      if (result.isError) {
        const text=result.content?.find(c=>c.type==='text')?.text ?? '';
        // SDK schema errors are plain text, while domain errors use JSON.
        // Both are expected failures; neither should become an HTTP 500.
        let detail;
        try {detail=JSON.parse(text);} catch {}
        if(detail && typeof detail.code==='string' && typeof detail.error==='string') return res.status(409).json(detail);
        return res.status(400).json({code:'INVALID_TOOL_ARGUMENTS',error:name==='plan_repair' ? 'Check the planning arguments. Enter a USD budget above zero and at most 5,000, then refresh the task if needed.' : 'Check the availability arguments and refresh the task before retrying.'});
      }
      res.json({ ...result.structuredContent, toolReceipt: { name, protocol: '2025-11-25', transport: 'Streamable HTTP', executed: true } });
    } finally { await client.close(); }
  }
  app.post('/api/plan', async (req, res) => invokeMcp(req, res, 'plan_repair'));
  app.post('/api/availability', async (req, res) => invokeMcp(req, res, 'update_household_availability'));
  app.post('/mcp', async (req, res, next) => {
    const protocol = req.headers['mcp-protocol-version'];
    if (protocol && protocol !== '2025-11-25') return res.status(400).json({ error: 'Use MCP 2025-11-25.' });
    if (req.body?.method === 'initialize' && req.body.params?.protocolVersion !== '2025-11-25') return res.status(400).json({ error: 'This demo requires MCP 2025-11-25.' });
    const server = createMcpServer(desk);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    res.on('close', () => { void transport.close(); void server.close(); });
    try { await server.connect(transport); await transport.handleRequest(req, res, req.body); } catch (error) { next(error); }
  });
  app.all('/mcp', (req, res) => res.status(405).set('Allow', 'POST').end());
  app.use('/fixtures', express.static(resolve(root, 'fixtures')));
  app.use(express.static(resolve(root, 'public')));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    res.status(error.status ?? 500).json({ code: error.code ?? 'REQUEST_ERROR', error: error.status && error.status < 500 ? error.message : 'Request failed. Please retry.' });
  });
  return { app, desk };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { app } = createApp(); const port = Number(process.env.PORT ?? 4317);
  app.listen(port, '127.0.0.1', () => console.log(`Household Repair Desk: http://127.0.0.1:${port}\nMCP: http://127.0.0.1:${port}/mcp\nFixture simulation only; no Alexa device or model connection.`));
}
