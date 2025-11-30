function Contact() {
  return (
    <div className="contact-page">
      <div className="contact-grid">

        {/* FORMULAIRE */}
        <section className="card contact-form-card">
          <h2 className="section-title">Contact us</h2>
          <p className="section-subtitle">
            Have a question about an order, a product or a partnership?
            Send us a message and our support team will get back to you quickly.
          </p>

          <form className="contact-form">
            <div className="form-row">
              <div className="form-group">
                <label>First name</label>
                <input className="field" placeholder="John" />
              </div>
              <div className="form-group">
                <label>Last name</label>
                <input className="field" placeholder="Doe" />
              </div>
            </div>

            <div className="form-group">
              <label>Email</label>
              <input className="field" type="email" placeholder="you@example.com" />
            </div>

            <div className="form-group">
              <label>Subject</label>
              <input className="field" placeholder="Order #1234, product info…" />
            </div>

            <div className="form-group">
              <label>Message</label>
              <textarea
                className="field"
                rows="4"
                placeholder="Tell us how we can help you..."
              />
            </div>

            <button type="submit" className="btn-primary contact-submit">
              Send message
            </button>
          </form>
        </section>

        {/* INFOS BOUTIQUE */}
        <section className="card contact-info-card">
          <h2 className="section-title">Our support</h2>
          <p className="section-subtitle">
            We’re available every day to help you with orders,
            returns and product recommendations.
          </p>

          <div className="contact-info-block">
            <div>
              <h3>Contact details</h3>
              <p className="muted">Email: support@gm-shop.com</p>
              <p className="muted">Phone: +216 00 000 000</p>
              <p className="muted">Live chat: 09:00 – 23:00</p>
            </div>

            <div className="contact-stats">
              <div>
                <h3>98%</h3>
                <p className="muted small-label">Customer satisfaction</p>
              </div>
              <div>
                <h3>15 min</h3>
                <p className="muted small-label">Average first reply</p>
              </div>
              <div>
                <h3>24/7</h3>
                <p className="muted small-label">Support</p>
              </div>
            </div>
          </div>

          <div className="contact-note">
            We usually reply within a few minutes.  
            For urgent questions about payments, please mention it in the subject.
          </div>
        </section>

      </div>
    </div>
  );
}

export default Contact;
