import { useEffect, useId, useState } from "react";
import { useLocale } from "../../i18n/localeContext.js";
import { TRIP_SUMMARY_EVENT } from "../../lib/tripSummary.js";
import { PlaneIcon } from "../header/icons.jsx";

const EMPTY_FORM = { name: "", email: "", message: "", company: "" };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = true;
  if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = true;
  if (!values.message.trim()) errors.message = true;
  return errors;
}

export default function ContactSection() {
  const { t, language } = useLocale();
  const copy = t.contact;
  const formId = useId();
  const [values, setValues] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error

  useEffect(() => {
    // The calculator's "ask us" button hands over the trip it priced.
    const onTripSummary = (event) => {
      setValues((previous) => ({ ...previous, message: previous.message.trim() ? previous.message : `${event.detail}\n\n` }));
      setStatus("idle");
    };
    window.addEventListener(TRIP_SUMMARY_EVENT, onTripSummary);
    return () => window.removeEventListener(TRIP_SUMMARY_EVENT, onTripSummary);
  }, []);

  const update = (field) => (event) => {
    const value = event.target.value;
    setValues((previous) => ({ ...previous, [field]: value }));
    if (errors[field]) setErrors((previous) => ({ ...previous, [field]: false }));
  };

  async function handleSubmit(event) {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) {
      document.getElementById(`${formId}-${Object.keys(found)[0]}`)?.focus();
      return;
    }
    setStatus("sending");
    try {
      const [response] = await Promise.all([
        fetch("/api/contact", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...values, language }),
        }),
        // Give the paper plane time to fold and take off.
        new Promise((resolve) => setTimeout(resolve, 1200)),
      ]);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setStatus("sent");
      setValues(EMPTY_FORM);
    } catch {
      setStatus("error");
    }
  }

  const field = (name, label, { as = "input", ...rest } = {}) => {
    const Element = as;
    const id = `${formId}-${name}`;
    const errorId = `${id}-error`;
    return (
      <div className="contact-field">
        <label htmlFor={id}>{label}</label>
        <Element
          id={id}
          name={name}
          value={values[name]}
          onChange={update(name)}
          aria-invalid={errors[name] ? "true" : undefined}
          aria-describedby={errors[name] ? errorId : undefined}
          {...rest}
        />
        {errors[name] ? (
          <p id={errorId} className="contact-error">
            {copy.errors[name]}
          </p>
        ) : null}
      </div>
    );
  };

  return (
    <section id="contact" aria-labelledby="contact-heading" className="page-section contact-section">
      <div className="section-inner grid items-start gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
        <div className="lg:sticky lg:top-28">
          <p className="chapter-eyebrow mb-3">{copy.eyebrow}</p>
          <h2 id="contact-heading" className="section-heading">
            {copy.title}
          </h2>
          <p className="section-lede">{copy.body}</p>
          <div className="contact-stamp" aria-hidden="true">
            <PlaneIcon className="h-7 w-7" />
            <span>YVR</span>
          </div>
        </div>

        <div className={`postcard ${status === "sending" ? "is-sending" : ""}`}>
          {status === "sent" ? (
            <div className="postcard-sent" role="status">
              <span className="postcard-sent-plane" aria-hidden="true">
                <PlaneIcon className="h-10 w-10" />
              </span>
              <p className="postcard-sent-text">{copy.success}</p>
              <button type="button" className="postcard-secondary" onClick={() => setStatus("idle")}>
                {copy.sendAnother}
              </button>
            </div>
          ) : (
            <form noValidate onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {field("name", copy.fields.name, { autoComplete: "name", maxLength: 120 })}
                {field("email", copy.fields.email, { type: "email", autoComplete: "email", inputMode: "email", maxLength: 200 })}
              </div>
              {field("message", copy.fields.message, {
                as: "textarea",
                rows: 6,
                maxLength: 5000,
                placeholder: copy.fields.messagePlaceholder,
              })}
              {/* Hidden from people; bots tend to fill it in. */}
              <div className="contact-trap" aria-hidden="true">
                <label htmlFor={`${formId}-company`}>Company</label>
                <input id={`${formId}-company`} name="company" tabIndex={-1} autoComplete="off" value={values.company} onChange={update("company")} />
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <button type="submit" className="contact-submit" disabled={status === "sending"}>
                  <span>{status === "sending" ? copy.sending : copy.submit}</span>
                  <span className="contact-submit-plane" aria-hidden="true">
                    <PlaneIcon className="h-5 w-5" />
                  </span>
                </button>
                <p className="contact-status" role="status" aria-live="polite">
                  {status === "error" ? copy.error : ""}
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
