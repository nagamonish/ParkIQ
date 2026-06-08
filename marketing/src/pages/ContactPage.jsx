import { useState } from "react";

import { PageHeader } from "../components/PageHeader.jsx";
import { Reveal } from "../components/Reveal.jsx";
import { Icon } from "../components/Icon.jsx";
import { CONTACT_EMAIL } from "../config.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [state, setState] = useState("idle");
  const set = (k) => (e) => {
    setForm({ ...form, [k]: e.target.value });
    if (state === "error") setState("idle");
  };
  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !EMAIL_RE.test(form.email) || form.message.trim().length < 5) {
      setState("error");
      return;
    }
    setState("done");
  };

  return (
    <>
      <PageHeader kicker="Contact" title="Let's talk parking." lead="Questions, demos, partnerships — we usually reply within a day." />
      <section className="section">
        <div className="contact-grid">
          <Reveal as="div" className="contact-info">
            <div className="contact-line"><Icon name="bolt" size={18} /> <div><b>Sales & demos</b><span>{CONTACT_EMAIL}</span></div></div>
            <div className="contact-line"><Icon name="shield" size={18} /> <div><b>Privacy & security</b><span>privacy@parkiq.io</span></div></div>
            <div className="contact-line"><Icon name="pin" size={18} /> <div><b>HQ</b><span>San Francisco, CA</span></div></div>
          </Reveal>

          {state === "done" ? (
            <div className="contact-done">
              <span className="contact-check">✓</span>
              <h3>Thanks, {form.name.split(" ")[0]}!</h3>
              <p>Your message is on its way. We'll be in touch shortly.</p>
            </div>
          ) : (
            <Reveal as="form" className="contact-form" onSubmit={submit} delay={80}>
              <label>Name<input value={form.name} onChange={set("name")} placeholder="Your name" /></label>
              <label>Email<input value={form.email} onChange={set("email")} placeholder="you@company.com" /></label>
              <label>Message<textarea rows={5} value={form.message} onChange={set("message")} placeholder="How can we help?" /></label>
              {state === "error" && <p className="form-error">Please fill in every field with a valid email.</p>}
              <button className="btn btn-primary btn-lg" type="submit">Send message</button>
            </Reveal>
          )}
        </div>
      </section>
    </>
  );
}
