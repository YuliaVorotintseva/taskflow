import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

export const db = drizzle(postgres(connectionString, { 
  max: 10,
  idle_timeout: 20,
}), { schema });

export const migrationClient = postgres(connectionString, { max: 1 });