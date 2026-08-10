import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleDriveRequest } from './_driveHandler.ts';

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return handleDriveRequest(req, res);
}
