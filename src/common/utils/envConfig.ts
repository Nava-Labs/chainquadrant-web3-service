import dotenv from "dotenv";
import { cleanEnv, host, num, port, str, testOnly } from "envalid";

dotenv.config();

export const env = cleanEnv(process.env, {
  NODE_ENV: str({
    devDefault: testOnly("test"),
    choices: ["development", "production", "test"],
  }),
  HOST: host({ devDefault: testOnly("localhost") }),
  PORT: port({ devDefault: testOnly(3000) }),
  CORS_ORIGIN: str({ devDefault: testOnly("http://localhost:3000") }),
  COMMON_RATE_LIMIT_MAX_REQUESTS: num({ devDefault: testOnly(1000) }),
  COMMON_RATE_LIMIT_WINDOW_MS: num({ devDefault: testOnly(1000) }),
  SUPABASE_URL: str({
    devDefault: testOnly("https://your-supabase-url.supabase.co"),
  }),
  SUPABASE_SERVICE_ROLE: str({ devDefault: testOnly("your-service-role") }),
  PAYMASTER_CLIENT_URL: str({ devDefault: testOnly("paymaster-url") }),
  BUNDLER_CLIENT_URL: str({ devDefault: testOnly("bunlder-url") }),
});
