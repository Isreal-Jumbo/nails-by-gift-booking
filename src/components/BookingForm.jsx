import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  MessageCircle,
  RotateCw,
} from "lucide-react";
import { createWhatsAppLink } from "../services/whatsapp.js";
import { getPublicAvailability } from "../services/availability.js";
import "../styles/booking.css";

const timeOptions = ["10:00", "13:00", "16:00"];
const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const availabilityDays = 60;

function getLagosDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}

function addDays(dateKey, amount) {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function formatDate(dateKey, options) {
  return new Intl.DateTimeFormat("en-NG", {
    timeZone: "Africa/Lagos",
    ...options,
  }).format(new Date(`${dateKey}T12:00:00Z`));
}

function formatNigerianDate(dateKey) {
  return formatDate(dateKey, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function parseMonth(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return { year, month };
}

function shiftMonth(monthKey, amount) {
  const { year, month } = parseMonth(monthKey);
  const date = new Date(Date.UTC(year, month - 1 + amount, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function buildWhatsAppMessage({
  name,
  service,
  visitType,
  homeAddress,
  designNotes,
  date,
  time,
}) {
  const visitLabel =
    visitType === "home_service" ? "Home service in Lagos" : "At the salon";
  const lines = [
    "Hi Gift, I would like to request a nail appointment.",
    `Name: ${name.trim()}`,
    `Service: ${service}`,
    `Visit: ${visitLabel}`,
    `Preferred date: ${formatNigerianDate(date)}`,
    `Preferred time: ${timeLabel(time)} (Lagos time)`,
  ];

  if (visitType === "home_service" && homeAddress.trim()) {
    lines.push(`Home address: ${homeAddress.trim()}`);
  }
  if (designNotes.trim()) {
    lines.push(`Design notes: ${designNotes.trim()}`);
  }

  lines.push(
    "I understand this is a request and the appointment is not confirmed until you reply.",
  );
  return lines.join("\n");
}

function timeLabel(value) {
  const [hourText, minute] = value.split(":");
  const hour = Number(hourText);
  const period = hour >= 12 ? "pm" : "am";
  return `${hour % 12 || 12}:${minute} ${period}`;
}

export default function BookingForm() {
  const today = getLagosDateKey();
  const lastBookableDate = addDays(today, availabilityDays);
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(today.slice(0, 7));
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [service, setService] = useState("");
  const [visitType, setVisitType] = useState("salon");
  const [name, setName] = useState("");
  const [homeAddress, setHomeAddress] = useState("");
  const [designNotes, setDesignNotes] = useState("");

  async function loadAvailability() {
    setLoading(true);
    setLoadError(false);
    try {
      const rows = await getPublicAvailability(today, lastBookableDate);
      setAvailability(
        Object.fromEntries(rows.map((row) => [row.availability_date, row])),
      );
    } catch (error) {
      console.error("Could not load public appointment availability.", error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAvailability();
    // The date window is fixed when this booking form opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function refreshWhenVisible() {
      if (document.visibilityState === "visible") loadAvailability();
    }
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
    // Availability should refresh when a customer returns to this browser tab.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const availableTimes = availability[selectedDate]?.available_times;
    if (
      selectedTime &&
      availableTimes &&
      !availableTimes.includes(selectedTime)
    ) {
      setSelectedTime("");
    }
  }, [availability, selectedDate, selectedTime]);

  const { year, month } = parseMonth(visibleMonth);
  const monthTitle = new Intl.DateTimeFormat("en-NG", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const leadingBlanks =
    (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
  const days = useMemo(
    () => Array.from({ length: daysInMonth }, (_, index) => index + 1),
    [daysInMonth],
  );
  const nextMonth = shiftMonth(visibleMonth, 1);
  const canGoBack = visibleMonth > today.slice(0, 7);
  const canGoForward = `${nextMonth}-01` <= lastBookableDate;
  const currentDayInfo = selectedDate ? availability[selectedDate] : null;
  const isFormComplete = Boolean(
    name.trim() &&
    service &&
    selectedDate &&
    selectedTime &&
    (visitType === "salon" || homeAddress.trim()),
  );
  const whatsappMessage = isFormComplete
    ? buildWhatsAppMessage({
        name,
        service,
        visitType,
        homeAddress,
        designNotes,
        date: selectedDate,
        time: selectedTime,
      })
    : "";

  function selectDate(dateKey) {
    setSelectedDate(dateKey);
    setSelectedTime("");
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!event.currentTarget.reportValidity() || !isFormComplete) {
      return;
    }
    window.open(
      createWhatsAppLink(whatsappMessage),
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <section
      className="booking-section page-width"
      id="booking"
      aria-labelledby="booking-title"
    >
      <div className="booking-section-heading">
        <p className="eyebrow eyebrow-dark">REQUEST AN APPOINTMENT</p>
        <h2 id="booking-title">
          Choose your <em>moment.</em>
        </h2>
        <p>
          Pick an open date and preferred time. Gift will confirm the
          appointment with you on WhatsApp.
        </p>
      </div>

      <form className="booking-form" onSubmit={handleSubmit}>
        <div className="booking-form-main">
          <div className="booking-form-intro">
            <span className="booking-step">01</span>
            <div>
              <h3>Choose a date</h3>
              <p>Sunday is closed. Dates are shown in Lagos time.</p>
            </div>
          </div>

          <div className="calendar-card">
            <div className="calendar-header">
              <button
                className="calendar-nav"
                type="button"
                aria-label="Previous month"
                disabled={!canGoBack || loading}
                onClick={() => setVisibleMonth(shiftMonth(visibleMonth, -1))}
              >
                <ChevronLeft size={18} />
              </button>
              <strong>{monthTitle}</strong>
              <button
                className="calendar-nav"
                type="button"
                aria-label="Next month"
                disabled={!canGoForward || loading}
                onClick={() => setVisibleMonth(nextMonth)}
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="calendar-grid calendar-weekdays" aria-hidden="true">
              {weekdayLabels.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
            <div
              className="calendar-grid calendar-days"
              aria-label={`${monthTitle} appointment dates`}
            >
              {Array.from({ length: leadingBlanks }, (_, index) => (
                <span className="calendar-blank" key={`blank-${index}`} />
              ))}
              {days.map((day) => {
                const dateKey = `${visibleMonth}-${String(day).padStart(2, "0")}`;
                const dateValue = new Date(`${dateKey}T12:00:00Z`);
                const sunday = dateValue.getUTCDay() === 0;
                const outsideWindow =
                  dateKey < today || dateKey > lastBookableDate;
                const dayInfo = availability[dateKey];
                const full =
                  !sunday &&
                  dayInfo &&
                  !dayInfo.is_available &&
                  !dayInfo.is_blocked;
                const blocked = dayInfo?.is_blocked;
                const unavailable =
                  sunday || outsideWindow || !dayInfo?.is_available;
                const label = blocked
                  ? "Unavailable"
                  : full
                    ? "Fully booked"
                    : sunday
                      ? "Closed Sundays"
                      : "Available";

                return (
                  <button
                    className={`calendar-day${selectedDate === dateKey ? " is-selected" : ""}${unavailable ? " is-unavailable" : ""}`}
                    type="button"
                    key={dateKey}
                    disabled={loading || unavailable}
                    aria-label={`${formatDate(dateKey, { weekday: "long", day: "numeric", month: "long" })}, ${label}`}
                    aria-pressed={selectedDate === dateKey}
                    title={label}
                    onClick={() => selectDate(dateKey)}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {loading && (
              <div className="availability-message" role="status">
                <span className="calendar-skeleton" /> Checking dates with
                Gift’s calendar…
              </div>
            )}
            {loadError && (
              <div className="availability-error" role="alert">
                <p>Dates could not be loaded just now.</p>
                <button
                  type="button"
                  className="text-button"
                  onClick={loadAvailability}
                >
                  <RotateCw size={14} /> Try again
                </button>
              </div>
            )}
            {!loading && !loadError && (
              <div className="calendar-legend" aria-label="Availability key">
                <span>
                  <i className="legend-dot legend-open" /> Available
                </span>
                <span>
                  <i className="legend-dot legend-closed" /> Closed or full
                </span>
              </div>
            )}
          </div>

          <div className="time-picker">
            <div className="booking-form-intro booking-form-intro-small">
              <span className="booking-step">02</span>
              <div>
                <h3>Choose a preferred time</h3>
                <p>
                  {selectedDate
                    ? formatNigerianDate(selectedDate)
                    : "Choose an available date first."}
                </p>
              </div>
            </div>
            <div className="time-options">
              {timeOptions.map((time) => {
                const availableTimes = currentDayInfo?.available_times;
                const timeIsAvailable = availableTimes
                  ? availableTimes.includes(time)
                  : Boolean(currentDayInfo?.is_available);
                return (
                  <button
                    className={`time-option${selectedTime === time ? " is-selected" : ""}`}
                    type="button"
                    key={time}
                    disabled={!timeIsAvailable}
                    aria-pressed={selectedTime === time}
                    aria-label={`${timeLabel(time)}${timeIsAvailable ? " available" : " unavailable"}`}
                    title={timeIsAvailable ? "Available" : "Unavailable"}
                    onClick={() => setSelectedTime(time)}
                  >
                    <Clock3 size={15} /> {timeLabel(time)}
                  </button>
                );
              })}
            </div>
            <p className="time-note">
              This is your preferred start time. Gift will confirm it based on
              the service and appointment length.
            </p>
          </div>
        </div>

        <div className="booking-form-details">
          <div className="booking-form-intro">
            <span className="booking-step">03</span>
            <div>
              <h3>Tell Gift what you have in mind</h3>
              <p>
                Your details are sent to Gift in WhatsApp, not saved by this
                form.
              </p>
            </div>
          </div>

          <label className="form-field">
            <span>Your name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              placeholder="Name"
              required
            />
          </label>
          <label className="form-field">
            <span>Service</span>
            <select
              value={service}
              onChange={(event) => setService(event.target.value)}
              required
            >
              <option value="">Choose a service</option>
              <option>Acrylic nails</option>
              <option>Gel nails</option>
              <option>Toe nails</option>
            </select>
          </label>
          <fieldset className="visit-choice">
            <legend>Where would you like your appointment?</legend>
            <label>
              <input
                type="radio"
                name="visitType"
                value="salon"
                checked={visitType === "salon"}
                onChange={() => setVisitType("salon")}
              />
              <span>
                <MapPin size={15} /> At the salon
              </span>
            </label>
            <label>
              <input
                type="radio"
                name="visitType"
                value="home_service"
                checked={visitType === "home_service"}
                onChange={() => setVisitType("home_service")}
              />
              <span>
                <MapPin size={15} /> Home service
              </span>
            </label>
          </fieldset>
          {visitType === "home_service" && (
            <label className="form-field">
              <span>Home address in Lagos</span>
              <input
                value={homeAddress}
                onChange={(event) => setHomeAddress(event.target.value)}
                autoComplete="street-address"
                placeholder="Enter your area and street"
                required
              />
            </label>
          )}
          <label className="form-field">
            <span>
              Design idea <small>optional</small>
            </span>
            <textarea
              value={designNotes}
              onChange={(event) => setDesignNotes(event.target.value)}
              rows="3"
              placeholder="Shape, colours, or a short note. Send a reference photo in WhatsApp."
            />
          </label>
          <button
            className="button button-dark booking-submit"
            type="submit"
            disabled={
              !isFormComplete ||
              loading ||
              loadError ||
              !currentDayInfo?.is_available
            }
          >
            <MessageCircle size={17} /> Request on WhatsApp
          </button>
          <p className="booking-disclaimer">
            This sends a booking request only. Your appointment is confirmed
            after Gift replies. For an emergency booking,{" "}
            <a
              href={createWhatsAppLink(
                "Hi Gift, I need to ask about an emergency nail appointment.",
              )}
              target="_blank"
              rel="noreferrer"
            >
              message Gift on WhatsApp
            </a>
            .
          </p>
        </div>
      </form>
    </section>
  );
}
