import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleUserDataRequest } from './_userDataHandler.js';

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return handleUserDataRequest(req, res);
}
