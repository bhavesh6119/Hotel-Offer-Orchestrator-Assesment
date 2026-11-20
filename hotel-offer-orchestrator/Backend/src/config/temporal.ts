import { Client, Connection } from "@temporalio/client";
import { env } from "./env";
import { logger } from "./logger";

let _client: Client | null = null;

export async function getTemporalClient(): Promise<Client> {
  if (_client) return _client;

  const connection = await Connection.connect({
    address: env.TEMPORAL_ADDRESS,
  });

  _client = new Client({
    connection,
    namespace: env.TEMPORAL_NAMESPACE,
  });

  logger.info({ address: env.TEMPORAL_ADDRESS }, "Temporal client connected");
  return _client;
}
