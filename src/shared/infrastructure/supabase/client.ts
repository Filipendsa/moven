import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/shared/config/env";

// Browser client for Admin Auth & public interactions
export const supabaseBrowser = createClient(
  publicEnv.supabaseUrl,
  publicEnv.supabasePublishableKey
);
