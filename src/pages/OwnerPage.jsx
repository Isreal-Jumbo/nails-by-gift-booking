import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  CalendarDays,
  LogOut,
  Plus,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import { supabase } from "../services/supabaseClient.js";
import {
  addBlockedDate,
  addOwnerAppointment,
  getOwnerDashboardData,
  removeBlockedDate,
  removeDateBookingOverride,
  saveDateBookingOverride,
  updateDailyBookingLimit,
  updateOwnerAppointment,
} from "../services/ownerDashboard.js";
import "../styles/owner.css";

const today = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
const dateLabel = (value) =>
  new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Africa/Lagos",
  }).format(new Date(`${value}T12:00:00Z`));
const timeLabel = (value) => value?.slice(0, 5);

function dateToDmy(isoDate) {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

function parseDmy(value) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  const [, dayText, monthText, yearText] = match;
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  )
    return null;
  return `${yearText}-${monthText}-${dayText}`;
}

function NigerianDateInput({ value, min, onChange, required = false }) {
  const [text, setText] = useState(() => dateToDmy(value));
  useEffect(() => {
    if (value) setText(dateToDmy(value));
  }, [value]);

  function handleChange(event) {
    const input = event.currentTarget;
    const nextText = input.value;
    const isoDate = parseDmy(nextText);
    setText(nextText);
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(nextText) && !isoDate) {
      input.setCustomValidity("Enter a real date in DD/MM/YYYY format.");
      onChange("");
      return;
    }
    if (isoDate && min && isoDate < min) {
      input.setCustomValidity("Choose today or a future date.");
      onChange("");
      return;
    }
    input.setCustomValidity("");
    onChange(isoDate || "");
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder="DD/MM/YYYY"
      aria-label="Date in day, month, year format"
      pattern="[0-9]{2}/[0-9]{2}/[0-9]{4}"
      title="Enter a date as DD/MM/YYYY, for example 05/11/2026"
      required={required}
      value={text}
      onChange={handleChange}
    />
  );
}

export default function OwnerPage() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [checkingOwner, setCheckingOwner] = useState(false);
  const [data, setData] = useState({
    settings: null,
    appointments: [],
    blockedDates: [],
    overrides: [],
  });
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return undefined;
    }
    supabase.auth.getSession().then(({ data: result }) => {
      setSession(result.session);
      setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        setAllowed(false);
      },
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let active = true;
    async function verifyOwner() {
      if (!session?.user) {
        setAllowed(false);
        return;
      }
      setCheckingOwner(true);
      const { data: membership, error } = await supabase
        .from("business_owners")
        .select("user_id")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (active) {
        setAllowed(!error && Boolean(membership));
        if (error) setPageError(error.message);
        setCheckingOwner(false);
      }
    }
    verifyOwner();
    return () => {
      active = false;
    };
  }, [session]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setPageError("");
    try {
      setData(await getOwnerDashboardData(today()));
    } catch (error) {
      setPageError(error.message || "Could not load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (allowed) refresh();
  }, [allowed, refresh]);

  async function signOut() {
    await supabase.auth.signOut();
    setAllowed(false);
    setData({
      settings: null,
      appointments: [],
      blockedDates: [],
      overrides: [],
    });
  }

  if (!supabase)
    return (
      <main className="owner-page">
        <div className="owner-card">
          <h1>Dashboard setup needed</h1>
          <p>
            Add the Supabase URL and publishable key to <code>.env.local</code>,
            then restart the development server.
          </p>
          <Link to="/">Return to the website</Link>
        </div>
      </main>
    );
  if (authLoading)
    return (
      <main className="owner-page">
        <p className="owner-loading">Checking your secure session…</p>
      </main>
    );
  if (!session) return <OwnerSignIn />;
  if (checkingOwner)
    return (
      <main className="owner-page">
        <p className="owner-loading">Checking dashboard access…</p>
      </main>
    );
  if (!allowed)
    return (
      <main className="owner-page">
        <div className="owner-card">
          <div className="owner-mark">
            <ShieldCheck />
          </div>
          <p className="owner-eyebrow">PRIVATE OWNER AREA</p>
          <h1>This account has no dashboard access</h1>
          <p>
            Sign in with the email account Gift was invited with. If the message
            persists, the owner account still needs to be added to the business
            owners list in Supabase.
          </p>
          {pageError && <p className="owner-error">{pageError}</p>}
          <button className="owner-button secondary" onClick={signOut}>
            Sign out
          </button>
        </div>
      </main>
    );

  const activeAppointments = data.appointments.filter(
    (appointment) => appointment.status !== "cancelled",
  );
  const awaitingDeposit = activeAppointments.filter(
    (appointment) => appointment.deposit_status === "pending",
  ).length;

  return (
    <main className="owner-page">
      <div className="owner-shell">
        <header className="owner-topbar">
          <Link to="/" className="owner-back">
            <ArrowLeft size={16} /> Nails By Gift
          </Link>
          <button className="owner-button quiet" onClick={signOut}>
            <LogOut size={16} /> Sign out
          </button>
        </header>
        <section className="owner-heading">
          <div>
            <p className="owner-eyebrow">GIFT’S PRIVATE SPACE</p>
            <h1>
              Studio dashboard<span>.</span>
            </h1>
            <p>
              Manage appointments, deposits, daily capacity and unavailable
              dates.
            </p>
          </div>
          <button
            className="owner-button secondary"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </section>
        {notice && (
          <div className="owner-notice">
            {notice}
            <button onClick={() => setNotice("")} aria-label="Dismiss">
              <X size={15} />
            </button>
          </div>
        )}
        {pageError && (
          <div className="owner-error" role="alert">
            {pageError}
          </div>
        )}
        <div className="owner-stats">
          <Stat
            label="Upcoming appointments"
            value={activeAppointments.length}
          />
          <Stat label="Deposits to follow up" value={awaitingDeposit} />
          <Stat
            label="Daily booking limit"
            value={data.settings?.daily_booking_limit ?? "—"}
          />
        </div>

        <section className="owner-panel">
          <div className="owner-panel-heading">
            <div>
              <p className="owner-eyebrow">SCHEDULE</p>
              <h2>Upcoming appointments</h2>
            </div>
            <span className="owner-count">
              {activeAppointments.length} listed
            </span>
          </div>
          {loading ? (
            <p className="owner-empty">Loading appointments…</p>
          ) : activeAppointments.length === 0 ? (
            <p className="owner-empty">
              No appointments yet. Add a booking Gift has confirmed in WhatsApp.
            </p>
          ) : (
            <div className="owner-appointments">
              {activeAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  onUpdate={async (updates) => {
                    await updateOwnerAppointment(appointment.id, updates);
                    setNotice("Appointment updated.");
                    refresh();
                  }}
                />
              ))}
            </div>
          )}
        </section>

        <div className="owner-columns">
          <AppointmentForm
            dailyLimit={data.settings?.daily_booking_limit ?? 2}
            onAdd={async (appointment) => {
              await addOwnerAppointment(
                appointment,
                data.settings?.daily_booking_limit ?? 2,
              );
              setNotice("Appointment added to the schedule.");
              refresh();
            }}
          />
          <div className="owner-side-stack">
            <section className="owner-panel owner-compact">
              <div className="owner-panel-heading">
                <div>
                  <p className="owner-eyebrow">CAPACITY</p>
                  <h2>Bookings per day</h2>
                </div>
              </div>
              <p>Set the maximum regular appointments for each date.</p>
              <div className="owner-limit-options">
                {[2, 3].map((limit) => (
                  <button
                    key={limit}
                    className={
                      data.settings?.daily_booking_limit === limit
                        ? "selected"
                        : ""
                    }
                    onClick={async () => {
                      try {
                        await updateDailyBookingLimit(limit);
                        setData((current) => ({
                          ...current,
                          settings: {
                            ...current.settings,
                            daily_booking_limit: limit,
                          },
                        }));
                        setNotice(`Daily limit set to ${limit}.`);
                      } catch (error) {
                        setPageError(error.message);
                      }
                    }}
                  >
                    {limit} clients
                  </button>
                ))}
              </div>
            </section>
            <BlockedDates
              dates={data.blockedDates}
              onAdd={async (date, note) => {
                await addBlockedDate(date, note);
                setNotice("Unavailable date added.");
                refresh();
              }}
              onRemove={async (date) => {
                await removeBlockedDate(date);
                setNotice("Date reopened.");
                refresh();
              }}
            />
            <DateBookingOverrides
              overrides={data.overrides}
              globalLimit={data.settings?.daily_booking_limit ?? 2}
              onSave={async (override) => {
                await saveDateBookingOverride(override);
                setNotice("Date-specific availability saved.");
                refresh();
              }}
              onRemove={async (date) => {
                await removeDateBookingOverride(date);
                setNotice("Date-specific settings removed.");
                refresh();
              }}
            />
          </div>
        </div>
        <p className="owner-footnote">
          <CalendarDays size={15} /> Customer requests currently arrive through
          WhatsApp. Add a date here after Gift confirms it so availability stays
          current.
        </p>
      </div>
    </main>
  );
}

function OwnerSignIn() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function sendLink(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/owner`,
      },
    });
    if (authError) setError(authError.message);
    else
      setMessage(
        "If this email belongs to an invited account, a sign-in link will arrive shortly.",
      );
    setBusy(false);
  }
  return (
    <main className="owner-page">
      <div className="owner-card">
        <Link to="/" className="owner-back">
          <ArrowLeft size={16} /> Back to the website
        </Link>
        <div className="owner-mark">
          <ShieldCheck />
        </div>
        <p className="owner-eyebrow">NAILS BY GIFT · OWNER ACCESS</p>
        <h1>
          Welcome back<span>.</span>
        </h1>
        <p>Enter Gift’s invited email and we’ll send a secure sign-in link.</p>
        <form onSubmit={sendLink} className="owner-signin-form">
          <label htmlFor="owner-email">Email address</label>
          <input
            id="owner-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Gift’s invited email"
          />
          <button className="owner-button primary" disabled={busy}>
            {busy ? "Sending link…" : "Email me a sign-in link"}
          </button>
        </form>
        {message && (
          <p className="owner-success" role="status">
            {message}
          </p>
        )}
        {error && (
          <p className="owner-error" role="alert">
            {error}
          </p>
        )}
        <p className="owner-small">
          Only accounts approved for this studio can open the dashboard.
        </p>
      </div>
    </main>
  );
}

function Stat({ label, value }) {
  return (
    <article className="owner-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function AppointmentCard({ appointment, onUpdate }) {
  const [saving, setSaving] = useState(false);
  async function save(field, value) {
    setSaving(true);
    try {
      await onUpdate({ [field]: value });
    } finally {
      setSaving(false);
    }
  }
  return (
    <article className="owner-appointment">
      <div className="appointment-date">
        <strong>{dateLabel(appointment.appointment_date)}</strong>
        <span>
          {timeLabel(appointment.start_time)}–{timeLabel(appointment.end_time)}{" "}
          · {appointment.booking_type}
        </span>
      </div>
      <div className="appointment-client">
        <strong>{appointment.customer_name}</strong>
        <a href={`tel:${appointment.customer_phone}`}>
          {appointment.customer_phone}
        </a>
        <span>
          {appointment.service_name} ·{" "}
          {appointment.visit_type === "home_service"
            ? "Home service"
            : "At salon"}
        </span>
        {appointment.home_address && <span>{appointment.home_address}</span>}
        {appointment.design_notes && (
          <span className="appointment-notes">{appointment.design_notes}</span>
        )}
      </div>
      <div className="appointment-controls">
        <label>
          Booking
          <select
            disabled={saving}
            value={appointment.status}
            onChange={(event) => save("status", event.target.value)}
          >
            <option value="awaiting_deposit">Awaiting deposit</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        <label>
          Deposit
          <select
            disabled={saving}
            value={appointment.deposit_status}
            onChange={(event) => save("deposit_status", event.target.value)}
          >
            <option value="pending">Pending</option>
            <option value="received">Received</option>
          </select>
        </label>
        <label>
          Agreed price (₦)
          <input
            disabled={saving}
            type="number"
            min="0"
            value={appointment.agreed_price_ngn ?? ""}
            placeholder="Not set"
            onBlur={(event) => {
              if (
                event.target.value !==
                String(appointment.agreed_price_ngn ?? "")
              )
                save(
                  "agreed_price_ngn",
                  event.target.value ? Number(event.target.value) : null,
                );
            }}
          />
        </label>
      </div>
    </article>
  );
}

function AppointmentForm({ dailyLimit, onAdd }) {
  const [form, setForm] = useState({
    appointment_date: "",
    start_time: "10:00",
    duration: "2",
    customer_name: "",
    customer_phone: "",
    service_name: "Acrylic nails",
    visit_type: "salon",
    home_address: "",
    booking_type: "regular",
    agreed_price_ngn: "",
    design_notes: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    if (
      form.booking_type === "regular" &&
      new Date(`${form.appointment_date}T12:00:00`).getDay() === 0
    ) {
      setError(
        "The salon is closed on Sundays. Emergency appointments are arranged directly with Gift on WhatsApp.",
      );
      setBusy(false);
      return;
    }
    const [hours, minutes] = form.start_time.split(":").map(Number);
    const end = new Date(2000, 0, 1, hours + Number(form.duration), minutes);
    const end_time = `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}:00`;
    try {
      await onAdd({
        appointment_date: form.appointment_date,
        start_time: `${form.start_time}:00`,
        end_time,
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim(),
        service_name: form.service_name,
        visit_type: form.visit_type,
        home_address:
          form.visit_type === "home_service" ? form.home_address.trim() : null,
        booking_type: form.booking_type,
        agreed_price_ngn: form.agreed_price_ngn
          ? Number(form.agreed_price_ngn)
          : null,
        design_notes: form.design_notes.trim() || null,
        status: "awaiting_deposit",
        deposit_status: "pending",
      });
      setForm((current) => ({
        ...current,
        appointment_date: "",
        customer_name: "",
        customer_phone: "",
        home_address: "",
        agreed_price_ngn: "",
        design_notes: "",
      }));
    } catch (caught) {
      setError(caught.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="owner-panel">
      <div className="owner-panel-heading">
        <div>
          <p className="owner-eyebrow">MANUAL ENTRY</p>
          <h2>Add an appointment</h2>
        </div>
        <Plus size={19} />
      </div>
      <p>Record a booking Gift confirmed with a customer.</p>
      <form className="owner-form" onSubmit={submit}>
        <label>
          Customer name
          <input
            required
            value={form.customer_name}
            onChange={(e) => set("customer_name", e.target.value)}
          />
        </label>
        <label>
          Phone / WhatsApp
          <input
            required
            type="tel"
            value={form.customer_phone}
            onChange={(e) => set("customer_phone", e.target.value)}
          />
        </label>
        <label>
          Date
          <NigerianDateInput
            required
            min={today()}
            value={form.appointment_date}
            onChange={(value) => set("appointment_date", value)}
          />
        </label>
        <div className="owner-form-row">
          <label>
            Start time
            <select
              value={form.start_time}
              onChange={(e) => {
                const startTime = e.target.value;
                setForm((current) => ({
                  ...current,
                  start_time: startTime,
                  duration: startTime === "16:00" ? "2" : current.duration,
                }));
              }}
            >
              {Array.from(
                { length: 9 - Number(form.duration) },
                (_, index) => `${String(10 + index).padStart(2, "0")}:00`,
              ).map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </label>
          <label>
            Duration
            <select
              value={form.duration}
              onChange={(e) => set("duration", e.target.value)}
            >
              <option value="2">2 hours</option>
              {form.start_time !== "16:00" && (
                <option value="3">3 hours</option>
              )}
            </select>
          </label>
          {form.start_time === "16:00" && (
            <p className="owner-small owner-form-note">
              4:00 pm appointments are fixed at 2 hours to finish by 6:00 pm.
            </p>
          )}
        </div>
        <label>
          Service
          <select
            value={form.service_name}
            onChange={(e) => set("service_name", e.target.value)}
          >
            {[
              "Acrylic nails",
              "Gel nails",
              "Toe nails",
              "Other / custom design",
            ].map((service) => (
              <option key={service}>{service}</option>
            ))}
          </select>
        </label>
        <label>
          Appointment type
          <select
            value={form.booking_type}
            onChange={(e) => set("booking_type", e.target.value)}
          >
            <option value="regular">Regular</option>
            <option value="emergency">Emergency (WhatsApp arranged)</option>
          </select>
        </label>
        <label>
          Visit type
          <select
            value={form.visit_type}
            onChange={(e) => set("visit_type", e.target.value)}
          >
            <option value="salon">At salon</option>
            <option value="home_service">Home service</option>
          </select>
        </label>
        {form.visit_type === "home_service" && (
          <label>
            Customer address
            <input
              required
              value={form.home_address}
              onChange={(e) => set("home_address", e.target.value)}
            />
          </label>
        )}
        <label>
          Agreed price (₦)
          <input
            type="number"
            min="0"
            value={form.agreed_price_ngn}
            onChange={(e) => set("agreed_price_ngn", e.target.value)}
            placeholder="Optional"
          />
        </label>
        <label>
          Design / booking notes
          <textarea
            rows="3"
            value={form.design_notes}
            onChange={(e) => set("design_notes", e.target.value)}
          />
        </label>
        {error && <p className="owner-error">{error}</p>}
        <button className="owner-button primary" disabled={busy}>
          {busy
            ? "Saving…"
            : `Add to schedule${form.booking_type === "regular" ? ` · limit ${dailyLimit}/day` : ""}`}
        </button>
      </form>
    </section>
  );
}

function BlockedDates({ dates, onAdd, onRemove }) {
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      await onAdd(date, note);
      setDate("");
      setNote("");
    } catch (caught) {
      setError(caught.message);
    }
  }
  return (
    <section className="owner-panel owner-compact">
      <div className="owner-panel-heading">
        <div>
          <p className="owner-eyebrow">AVAILABILITY</p>
          <h2>Unavailable dates</h2>
        </div>
      </div>
      <form className="owner-form" onSubmit={submit}>
        <label>
          Close a date
          <NigerianDateInput
            required
            min={today()}
            value={date}
            onChange={setDate}
          />
        </label>
        <label>
          Note (optional)
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Personal day, travel…"
          />
        </label>
        <button className="owner-button secondary">Block date</button>
      </form>
      {error && <p className="owner-error">{error}</p>}
      <ul className="owner-blocked-list">
        {dates.map((item) => (
          <li key={item.blocked_date}>
            <span>
              <strong>{dateLabel(item.blocked_date)}</strong>
              {item.note && <small>{item.note}</small>}
            </span>
            <button
              onClick={() => onRemove(item.blocked_date)}
              aria-label={`Reopen ${item.blocked_date}`}
            >
              <X size={16} />
            </button>
          </li>
        ))}
      </ul>
      {dates.length === 0 && (
        <p className="owner-small">No future dates are blocked.</p>
      )}
    </section>
  );
}

const preferredStartTimes = [
  { value: "10:00", label: "10:00 am" },
  { value: "13:00", label: "1:00 pm" },
  { value: "16:00", label: "4:00 pm" },
];

function DateBookingOverrides({ overrides, globalLimit, onSave, onRemove }) {
  const [date, setDate] = useState("");
  const [limit, setLimit] = useState("");
  const [unavailableTimes, setUnavailableTimes] = useState([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const existing = overrides.find((item) => item.booking_date === date);
    setLimit(
      existing?.daily_booking_limit ? String(existing.daily_booking_limit) : "",
    );
    setUnavailableTimes(
      (existing?.unavailable_times ?? []).map((time) => time.slice(0, 5)),
    );
    setNote(existing?.note ?? "");
  }, [date, overrides]);

  function toggleTime(time) {
    setUnavailableTimes((current) =>
      current.includes(time)
        ? current.filter((value) => value !== time)
        : [...current, time],
    );
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    if (new Date(`${date}T12:00:00Z`).getUTCDay() === 0) {
      setError("Sundays are already closed. Choose another date.");
      setBusy(false);
      return;
    }
    try {
      await onSave({
        booking_date: date,
        daily_booking_limit: limit ? Number(limit) : null,
        unavailable_times: unavailableTimes.map((time) => `${time}:00`),
        note,
      });
    } catch (caught) {
      setError(caught.message);
    } finally {
      setBusy(false);
    }
  }

  async function clearOverride(bookingDate) {
    setError("");
    try {
      await onRemove(bookingDate);
      if (date === bookingDate) {
        setLimit("");
        setUnavailableTimes([]);
        setNote("");
      }
    } catch (caught) {
      setError(caught.message);
    }
  }

  return (
    <section className="owner-panel owner-compact">
      <div className="owner-panel-heading">
        <div>
          <p className="owner-eyebrow">DATE-SPECIFIC SCHEDULE</p>
          <h2>Adjust one date</h2>
        </div>
      </div>
      <p>
        Set a one-day booking limit and close individual start times. For two
        bookings from 1:00 pm, set the limit to 2 and close 10:00 am.
      </p>
      <form className="owner-form" onSubmit={submit}>
        <label>
          Date
          <NigerianDateInput
            required
            min={today()}
            value={date}
            onChange={setDate}
          />
        </label>
        <label>
          Maximum bookings for this date
          <select
            value={limit}
            onChange={(event) => setLimit(event.target.value)}
          >
            <option value="">Use usual limit ({globalLimit})</option>
            {[1, 2, 3].map((value) => (
              <option key={value} value={value}>
                {value} {value === 1 ? "booking" : "bookings"}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="date-override-times">
          <legend>Close these start times</legend>
          {preferredStartTimes.map((time) => (
            <label key={time.value}>
              <input
                type="checkbox"
                checked={unavailableTimes.includes(time.value)}
                onChange={() => toggleTime(time.value)}
              />
              <span>{time.label}</span>
            </label>
          ))}
        </fieldset>
        <label>
          Note (optional)
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Late start, personal arrangement…"
          />
        </label>
        {error && <p className="owner-error">{error}</p>}
        <button className="owner-button secondary" disabled={busy || !date}>
          {busy ? "Saving…" : "Save date settings"}
        </button>
      </form>
      <ul className="owner-blocked-list date-override-list">
        {overrides.map((item) => (
          <li key={item.booking_date}>
            <span>
              <strong>{dateLabel(item.booking_date)}</strong>
              <small>
                Limit: {item.daily_booking_limit ?? globalLimit} · Closed times:{" "}
                {item.unavailable_times?.length
                  ? item.unavailable_times
                      .map((time) => timeLabel(time))
                      .join(", ")
                  : "none"}
              </small>
              {item.note && <small>{item.note}</small>}
            </span>
            <button
              type="button"
              onClick={() => clearOverride(item.booking_date)}
              aria-label={`Remove date settings for ${dateLabel(item.booking_date)}`}
            >
              <X size={16} />
            </button>
          </li>
        ))}
      </ul>
      {overrides.length === 0 && (
        <p className="owner-small">No dates have special booking settings.</p>
      )}
    </section>
  );
}
