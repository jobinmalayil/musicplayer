import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleAuthRequest } from './_authHandler.js';

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return handleAuthRequest(req, res);
}
