import { createClient } from "@supabase/supabase-js";
import { publicEnv, serverEnv } from "@/shared/config/env";

export const supabaseServer = createClient(
  publicEnv.supabaseUrl,
  serverEnv.supabaseSecretKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
