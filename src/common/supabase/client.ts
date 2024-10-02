import { createClient } from "@supabase/supabase-js";
import { env } from "@/common/utils/envConfig";

export const supabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE,
);
