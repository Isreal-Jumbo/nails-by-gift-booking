import { supabase } from "./supabaseClient.js";

export async function getPublicAvailability(startDate, endDate) {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Check the values in .env.local and restart Vite.",
    );
  }

  const { data, error } = await supabase.rpc(
    "get_public_booking_time_availability",
    {
      p_start_date: startDate,
      p_end_date: endDate,
    },
  );

  if (error) {
    throw error;
  }

  return data ?? [];
}
