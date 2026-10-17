import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export function createMcpServer(desk) {
  const server = new McpServer({ name: 'household-repair-desk', version: '0.2.1' });
  const taskId = z.string().uuid(); const version = z.number().int().nonnegative();
  const tools = [
    ['report_repair', 'Report a leaking kitchen sink in the fictional household. Other repair types are unsupported.', { description: z.string().min(8).max(1000), member: z.enum(['Alex', 'Sam']) }, a => desk.report(a), false],
    ['compare_quotes', 'Compare two fictional source-backed quotes; expose parts exclusions, warranty and household availability.', { taskId }, a => desk.compare(a), false],
    ['propose_repair', 'Create an expiring household review request only. Does not contact a provider or book/pay. Human approval is available only through the local review UI.', { taskId, quoteId: z.enum(['q-clear', 'q-home']), slotId: z.enum(['mon-am', 'mon-pm', 'tue-am']), version }, a => desk.propose(a), false],
    ['get_repair', 'Read the persistent task and audit timeline. Confirmation secrets are never returned.', { taskId }, a => desk.get(a.taskId), true],
    ['list_repairs', 'List fictional household repair tasks.', {}, () => ({ tasks: desk.list() }), true],
    ['cancel_repair', 'Cancel a local task and invalidate its review request. Does not cancel an external booking because none exists.', { taskId, version }, a => desk.cancel(a), false],
    ['plan_repair', 'Compare quote scope against a hard USD cap, intersect future provider/household availability, and create the earliest eligible review request. Unknown extra costs never count as budget certainty. Does not approve, book or pay.', { taskId, version, maxTotal: z.number().positive().max(5000) }, a => desk.plan(a), false],
    ['update_household_availability', 'Update the assigned demo member availability. If it conflicts with a pending or approved plan, immediately withdraw that plan and invalidate the old review. Does not authenticate a real identity.', { taskId, version, slotId: z.enum(['mon-am','mon-pm','tue-am']), member: z.enum(['Alex','Sam']), available: z.boolean(), reason: z.string().min(3).max(240) }, a => desk.availability(a), false]
  ];
  for (const [name, description, inputSchema, fn, readOnlyHint] of tools) {
    server.registerTool(name, { description, inputSchema, annotations: { readOnlyHint, destructiveHint: name === 'cancel_repair', openWorldHint: false } }, async args => {
      try { const result = fn(args); return { content: [{ type: 'text', text: JSON.stringify(result) }], structuredContent: result }; }
      catch (error) { return { isError: true, content: [{ type: 'text', text: JSON.stringify({ code: error.code ?? 'TOOL_ERROR', error: error.message }) }] }; }
    });
  }
  return server;
}
