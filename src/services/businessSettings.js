import { supabase } from "./supabaseClient.js";

export async function getPublicBookingSettings() {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local.",
    );
  }

  const { data, error } = await supabase
    .from("business_settings")
    .select("daily_booking_limit, opening_time, closing_time, time_zone")
    .eq("singleton", true)
    .single();

  if (error) {
    throw error;
  }

  return data;
}
