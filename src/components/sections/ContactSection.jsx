import { useState } from "react";

const initialFormState = {
  fullName: "",
  email: "",
  message: "",
};

export default function ContactSection() {
  const [formValues, setFormValues] = useState(initialFormState);
  const [submittedNotice, setSubmittedNotice] = useState("");

  function handleFieldChange(event) {
    const { name, value } = event.target;
    setFormValues((previous) => ({ ...previous, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    // Production: POST to your API, Shopify app proxy, or form backend.
    // Client-only submit has no persistence and is not suitable for real inquiries.
    setSubmittedNotice(
      "Thanks — this demo does not send email yet. Wire this form to your server or a form service.",
    );
  }

  const fieldClassName =
    "w-full rounded-md border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] shadow-sm transition placeholder:text-[var(--text-muted)] " +
    "focus:border-[var(--color-brand)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/25";

  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="scroll-mt-20 border-b border-[var(--border)] bg-[var(--bg-muted)] px-4 py-12 text-left md:px-6 md:py-16"
    >
      <h2
        id="contact-heading"
        className="mb-3 text-2xl font-medium text-[var(--text-heading)] md:text-3xl"
      >
        Contact us
      </h2>
      <p className="mb-6 max-w-2xl text-[var(--text-muted)]">
        Ask about availability or anything else. We will respond as soon as we
        can.
      </p>
      <form
        className="mx-auto max-w-xl space-y-4"
        onSubmit={handleSubmit}
        noValidate
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text)]" htmlFor="contact-full-name">
            Name
          </label>
          <input
            id="contact-full-name"
            name="fullName"
            type="text"
            autoComplete="name"
            className={fieldClassName}
            value={formValues.fullName}
            onChange={handleFieldChange}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text)]" htmlFor="contact-email">
            Email
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            className={fieldClassName}
            value={formValues.email}
            onChange={handleFieldChange}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text)]" htmlFor="contact-message">
            Message
          </label>
          <textarea
            id="contact-message"
            name="message"
            rows={4}
            className={`${fieldClassName} resize-y min-h-[6rem]`}
            value={formValues.message}
            onChange={handleFieldChange}
          />
        </div>
        <button
          type="submit"
          className="rounded-md border border-[var(--color-brand-border)] bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-[var(--color-brand-foreground)] shadow-sm transition hover:bg-[var(--color-brand-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]"
        >
          Send message
        </button>
        {submittedNotice ? (
          <p className="text-sm text-[var(--text-muted)]" role="status">
            {submittedNotice}
          </p>
        ) : null}
      </form>
    </section>
  );
}
