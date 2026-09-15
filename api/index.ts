// @ts-ignore
import { appReadyPromise } from '../dist/server.cjs';

export default async function handler(req: any, res: any) {
  const app = await appReadyPromise;
  return app(req, res);
}
