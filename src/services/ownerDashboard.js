import { supabase } from "./supabaseClient.js";

function requireSupabase() {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Check .env.local and restart Vite.",
    );
  }
  return supabase;
}

export async function getOwnerDashboardData(today) {
  const client = requireSupabase();
  const [
    settingsResult,
    appointmentsResult,
    blockedDatesResult,
    overridesResult,
  ] = await Promise.all([
    client
      .from("business_settings")
      .select("daily_booking_limit, opening_time, closing_time, time_zone")
      .eq("singleton", true)
      .single(),
    client
      .from("appointments")
      .select(
        "id, appointment_date, start_time, end_time, customer_name, customer_phone, service_name, design_notes, visit_type, home_address, booking_type, agreed_price_ngn, deposit_status, status",
      )
      .gte("appointment_date", today)
      .order("appointment_date", { ascending: true })
      .order("start_time", { ascending: true })
      .limit(100),
    client
      .from("blocked_dates")
      .select("blocked_date, note")
      .gte("blocked_date", today)
      .order("blocked_date", { ascending: true }),
    client
      .from("date_booking_overrides")
      .select("booking_date, daily_booking_limit, unavailable_times, note")
      .gte("booking_date", today)
      .order("booking_date", { ascending: true }),
  ]);

  const firstError =
    settingsResult.error ||
    appointmentsResult.error ||
    blockedDatesResult.error ||
    overridesResult.error;
  if (firstError) throw firstError;

  return {
    settings: settingsResult.data,
    appointments: appointmentsResult.data ?? [],
    blockedDates: blockedDatesResult.data ?? [],
    overrides: overridesResult.data ?? [],
  };
}

export async function updateDailyBookingLimit(limit) {
  const client = requireSupabase();
  const { error } = await client
    .from("business_settings")
    .update({
      daily_booking_limit: limit,
      updated_at: new Date().toISOString(),
    })
    .eq("singleton", true);
  if (error) throw error;
}

export async function addOwnerAppointment(appointment, dailyLimit) {
  const client = requireSupabase();
  const { data: blockedDate, error: blockedDateError } = await client
    .from("blocked_dates")
    .select("blocked_date")
    .eq("blocked_date", appointment.appointment_date)
    .maybeSingle();
  if (blockedDateError) throw blockedDateError;
  if (blockedDate) {
    throw new Error(
      "Gift marked this date as unavailable. Remove it from blocked dates first.",
    );
  }
  const { data: existing, error: lookupError } = await client
    .from("appointments")
    .select("id, start_time, end_time")
    .eq("appointment_date", appointment.appointment_date)
    .in("status", ["awaiting_deposit", "confirmed"]);
  if (lookupError) throw lookupError;

  const overlaps = (existing ?? []).some(
    (item) =>
      appointment.start_time < item.end_time &&
      appointment.end_time > item.start_time,
  );
  if (overlaps) {
    throw new Error(
      "That time overlaps an existing appointment. Choose another time.",
    );
  }
  if (
    appointment.booking_type === "regular" &&
    (existing ?? []).length >= dailyLimit
  ) {
    throw new Error(
      `This date has reached the ${dailyLimit}-booking daily limit.`,
    );
  }

  const { error } = await client.from("appointments").insert(appointment);
  if (error) throw error;
}

export async function updateOwnerAppointment(id, updates) {
  const client = requireSupabase();
  const { error } = await client
    .from("appointments")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function addBlockedDate(blockedDate, note) {
  const client = requireSupabase();
  const { error } = await client
    .from("blocked_dates")
    .insert({ blocked_date: blockedDate, note: note.trim() || null });
  if (error) throw error;
}

export async function removeBlockedDate(blockedDate) {
  const client = requireSupabase();
  const { error } = await client
    .from("blocked_dates")
    .delete()
    .eq("blocked_date", blockedDate);
  if (error) throw error;
}

export async function saveDateBookingOverride(override) {
  const client = requireSupabase();
  const { error } = await client.from("date_booking_overrides").upsert(
    {
      booking_date: override.booking_date,
      daily_booking_limit: override.daily_booking_limit,
      unavailable_times: override.unavailable_times,
      note: override.note.trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "booking_date" },
  );
  if (error) throw error;
}

export async function removeDateBookingOverride(bookingDate) {
  const client = requireSupabase();
  const { error } = await client
    .from("date_booking_overrides")
    .delete()
    .eq("booking_date", bookingDate);
  if (error) throw error;
}
