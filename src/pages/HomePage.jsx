import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Clock3,
  MapPin,
  Menu,
  X,
} from "lucide-react";
import BookingForm from "../components/BookingForm.jsx";
import { getPublicBookingSettings } from "../services/businessSettings.js";
import { createWhatsAppLink } from "../services/whatsapp.js";

const services = [
  {
    number: "01",
    name: "Acrylic nails",
    price: "₦18,000–₦20,000",
    label: "SHAPES",
    options: ["Almond", "Duck", "Stiletto", "Square"],
  },
  {
    number: "02",
    name: "Gel nails",
    price: "₦12,000–₦15,000",
    label: "DESIGNS",
    options: ["Cat eye", "French tips", "Marble", "Plain"],
  },
  {
    number: "03",
    name: "Toe nails",
    price: "Ask for a quote",
    note: "Gel: ₦10,000–₦13,000 · Acrylic: ₦15,000–₦20,000. Custom designs may change the final price. Ask Gift for a quote.",
  },
];

const nailPhotos = Array.from({ length: 12 }, (_, index) => ({
  src: `/images/nail-work-${String(index + 1).padStart(2, "0")}.jpg`,
  alt: `Nail set by Nails By Gift, portfolio photo ${index + 1}`,
}));

function WhatsAppButton({
  children,
  className = "button button-light",
  message,
}) {
  return (
    <a
      className={className}
      href={createWhatsAppLink(message)}
      target="_blank"
      rel="noreferrer"
    >
      {children}
      <ArrowUpRight size={17} aria-hidden="true" />
    </a>
  );
}

function GalleryPhoto({ photo, index }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <a
      className={`gallery-photo gallery-photo-${(index % 6) + 1}`}
      href="https://www.tiktok.com/@nailsbygift145"
      target="_blank"
      rel="noreferrer"
      aria-label={`View ${photo.alt} and more work on TikTok`}
    >
      {!loaded && !failed && (
        <span className="image-skeleton" aria-hidden="true" />
      )}
      {failed ? (
        <div className="photo-fallback" role="img" aria-label={photo.alt}>
          Nails By Gift
        </div>
      ) : (
        <img
          src={photo.src}
          alt={photo.alt}
          width="720"
          height="1280"
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
      <figcaption>
        <span>VIEW ON TIKTOK</span>
        <span>NAILS BY GIFT</span>
      </figcaption>
    </a>
  );
}

function formatBusinessTime(timeValue) {
  if (!timeValue) return "";
  const [hourValue, minuteValue = "00"] = timeValue.split(":");
  const hour = Number(hourValue);
  return `${hour % 12 || 12}:${minuteValue} ${hour >= 12 ? "pm" : "am"}`;
}

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [bookingSettings, setBookingSettings] = useState(null);
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    let active = true;

    getPublicBookingSettings()
      .then((settings) => {
        if (active) {
          setBookingSettings(settings);
          console.info(
            "Nails By Gift public booking settings loaded from Supabase.",
          );
        }
      })
      .catch((error) => {
        console.error(
          "Could not load public booking settings from Supabase.",
          error,
        );
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <header className="site-header">
        <a className="wordmark" href="#top" onClick={closeMenu}>
          <span className="wordmark-icon">G</span>
          <span>
            NAILS BY <b>GIFT</b>
          </span>
        </a>
        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <nav
          className={menuOpen ? "main-nav is-open" : "main-nav"}
          aria-label="Main navigation"
        >
          <a href="#services" onClick={closeMenu}>
            Services
          </a>
          <a href="#booking" onClick={closeMenu}>
            Book
          </a>
          <a href="#gallery" onClick={closeMenu}>
            Gallery
          </a>
          <a href="#visit" onClick={closeMenu}>
            Visit
          </a>
          <WhatsAppButton
            className="button button-small"
            message="Hi Gift, I would like to ask about booking a nail appointment."
          >
            Book on WhatsApp
          </WhatsAppButton>
        </nav>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-media" aria-hidden="true">
            <img
              className="hero-poster"
              src="/images/nail-work-01.jpg"
              alt=""
            />
            <video
              className="hero-video"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster="/images/nail-work-01.jpg"
            >
              <source
                src="/videos/nails-hero-background.mov"
                type="video/quicktime"
              />
            </video>
          </div>
          <div className="hero-shade" />
          <div className="hero-content page-width">
            <p className="eyebrow">
              <span /> CUSTOM NAIL ART · LAGOS
            </p>
            <h1>
              Your nails,
              <br />
              <em>your kind</em> of beautiful.
            </h1>
            <p className="hero-intro">
              Thoughtful nail sets made for your style, your moment, and you.
            </p>
            <div className="hero-actions">
              <a className="button button-light" href="#booking">
                Start a booking <ArrowUpRight size={17} aria-hidden="true" />
              </a>
              <a className="button button-outline" href="#gallery">
                Explore the work <ArrowDown size={16} />
              </a>
            </div>
            <p className="hero-note">
              DESIGN IN MIND? SEND IT TO GIFT ON WHATSAPP FOR A QUOTE.
            </p>
          </div>
          <div className="hero-index">
            <span>01</span> / NBG
          </div>
        </section>

        <section className="intro-strip page-width">
          <span>NAILS BY GIFT</span>
          <p>Detail in every set. A little more you in every detail.</p>
          <span>ABULE-EGBA, LAGOS</span>
        </section>

        <section className="services section-pad page-width" id="services">
          <div className="section-heading">
            <div>
              <p className="eyebrow eyebrow-dark">THE MENU</p>
              <h2>
                A set for
                <br />
                <em>every mood.</em>
              </h2>
            </div>
            <p className="section-copy">
              Choose a service, bring your inspiration, and talk through the
              details with Gift. Designs can change the final price, so every
              custom set is quoted personally.
            </p>
          </div>
          <div className="service-list">
            {services.map((service) => (
              <article className="service-row" key={service.name}>
                <span className="service-number">{service.number}</span>
                <h3>{service.name}</h3>
                <div className="service-details">
                  {service.options ? (
                    <>
                      <span className="service-detail-label">
                        {service.label}
                      </span>
                      <div className="service-options">
                        {service.options.map((option) => (
                          <span className="service-option" key={option}>
                            {option}
                          </span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p>{service.note}</p>
                  )}
                </div>
                <strong>{service.price}</strong>
                <a
                  href={createWhatsAppLink(
                    `Hi Gift, I'm interested in ${service.name}. Could you help me with design options and a quote?`,
                  )}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Ask Gift about ${service.name}`}
                >
                  <ArrowUpRight size={18} />
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="gallery-section" id="gallery">
          <div className="gallery-head page-width">
            <div>
              <p className="eyebrow eyebrow-dark">THE GALLERY</p>
              <h2>
                Made by hand.
                <br />
                <em>Made to be seen.</em>
              </h2>
            </div>
            <a
              href="https://www.tiktok.com/@nailsbygift145"
              target="_blank"
              rel="noreferrer"
              className="social-link"
            >
              More on TikTok <ArrowUpRight size={16} />
            </a>
          </div>
          <div className="gallery-grid page-width">
            {nailPhotos.map((photo, index) => (
              <GalleryPhoto photo={photo} index={index} key={photo.src} />
            ))}
          </div>
        </section>

        <BookingForm />

        <section className="booking-band">
          <div className="booking-inner page-width">
            <p className="eyebrow">YOUR NEXT SET STARTS HERE</p>
            <h2>
              Bring the idea.
              <br />
              <em>We’ll make it yours.</em>
            </h2>
            <p>
              Send your inspiration to Gift on WhatsApp to talk through the
              design, pricing, and available times.
            </p>
            <WhatsAppButton message="Hi Gift, I have a nail design in mind. I'd like to send you my inspiration photo and ask about pricing and available appointment times.">
              Talk to Gift <ArrowRight size={16} />
            </WhatsAppButton>
          </div>
        </section>

        <section className="visit-section page-width section-pad" id="visit">
          <div>
            <p className="eyebrow eyebrow-dark">COME BY OR BOOK A VISIT</p>
            <h2>
              A little care,
              <br />
              <em>close to home.</em>
            </h2>
          </div>
          <div className="visit-details">
            <div className="detail-row">
              <MapPin size={18} />
              <p>
                13 Amusan Street, off Babs Ogunwole Street,
                <br />
                by Samadola Junction, Abule-Egba, Lagos
              </p>
            </div>
            <div className="detail-row">
              <Clock3 size={18} />
              <p>
                Monday–Saturday ·{" "}
                {bookingSettings
                  ? `${formatBusinessTime(bookingSettings.opening_time)}–${formatBusinessTime(bookingSettings.closing_time)}`
                  : "10:00 am–6:00 pm"}
                <br />
                Sunday · Closed
              </p>
            </div>
            <p className="home-service-note">
              Home service available within Lagos. Ask Gift about travel costs
              when you message.
            </p>
            <WhatsAppButton
              className="button button-dark"
              message="Hi Gift, I would like to ask about a salon or home-service appointment."
            >
              Ask about an appointment
            </WhatsAppButton>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <a className="wordmark" href="#top">
          <span className="wordmark-icon">G</span>
          <span>
            NAILS BY <b>GIFT</b>
          </span>
        </a>
        <span>MADE WITH CARE IN LAGOS</span>
        <a href="#top">BACK TO TOP ↑</a>
      </footer>
    </>
  );
}
