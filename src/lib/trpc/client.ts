import 'server-only';

import { headers } from 'next/headers';

import { appRouter } from '@/server/routers/_app';
import { createTRPCContext } from '@/server/trpc';

export const api = async () => {
  const heads = await headers();
  const context = await createTRPCContext({ headers: heads });
  
  return appRouter.createCaller(context);
};