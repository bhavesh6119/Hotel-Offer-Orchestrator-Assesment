import { z } from "zod";

/** Coerces "true"/"false" strings to booleans safely */
const boolFlag = z
  .string()
  .toLowerCase()
  .pipe(z.enum(["true", "false"]))
  .transform((v) => v === "true")
  .default("false");

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3000),

  REDIS_URL: z.string().url(),

  TEMPORAL_ADDRESS: z.string().min(1),
  TEMPORAL_NAMESPACE: z.string().default("default"),
  TEMPORAL_TASK_QUEUE: z.string().default("hotel-offers"),

  SUPPLIER_A_URL: z.string().url(),
  SUPPLIER_B_URL: z.string().url(),

  /** Set to "true" to make GET /supplierA/hotels return 503 */
  SUPPLIER_A_DOWN: boolFlag,
  /** Set to "true" to make GET /supplierB/hotels return 503 */
  SUPPLIER_B_DOWN: boolFlag,

  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),

  CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(300),
  PARTIAL_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(30),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:",
    parsed.error.flatten().fieldErrors,
  );
  process.exit(1);
}

export const env = parsed.data;
