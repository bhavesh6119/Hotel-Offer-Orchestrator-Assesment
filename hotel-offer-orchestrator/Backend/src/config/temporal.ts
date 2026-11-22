import { Client, Connection } from "@temporalio/client";
import { env } from "./env";
import { logger } from "./logger";

let _client: Client | null = null;

export async function getTemporalClient(): Promise<Client> {
  if (_client) return _client;

  // Set connect timeout to 5s so failure happens fast if Temporal is down
  const connection = await Connection.connect({
    address: env.TEMPORAL_ADDRESS,
    connectTimeout: 5000,
  });

  _client = new Client({
    connection,
    namespace: env.TEMPORAL_NAMESPACE,
  });

  logger.info({ address: env.TEMPORAL_ADDRESS }, "Temporal client connected");
  return _client;
}
