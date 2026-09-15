import { appReadyPromise } from '../server';

export default async function handler(req: any, res: any) {
  const app = await appReadyPromise;
  return app(req, res);
}
