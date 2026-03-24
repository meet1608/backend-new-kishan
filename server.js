require("dotenv").config();

const express    = require("express");
const cors       = require("cors");
const rateLimit  = require("express-rate-limit");
const nodemailer = require("nodemailer");

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────

// Request logging middleware — logs every incoming request
app.use((req, res, next) => {
  const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
  
  console.log("\n" + "=".repeat(70));
  console.log(`📥 INCOMING REQUEST [${timestamp} IST]`);
  console.log("=".repeat(70));
  console.log(`Method:  ${req.method}`);
  console.log(`Path:    ${req.path}`);
  console.log(`Origin:  ${req.headers.origin || "none"}`);
  console.log(`IP:      ${ip}`);
  console.log(`User-Agent: ${req.headers["user-agent"] || "none"}`);
  
  if (req.method === "POST" && req.body) {
    console.log(`Body:    ${JSON.stringify(req.body, null, 2)}`);
  }
  
  // Log response when it finishes
  const originalSend = res.send;
  res.send = function (data) {
    console.log(`✅ Response: ${res.statusCode}`);
    console.log("=".repeat(70) + "\n");
    originalSend.call(this, data);
  };
  
  next();
});

app.use(express.json());

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

// Handle preflight for all routes
app.options("*", (_req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.sendStatus(204);
});

// Rate-limit: max 10 enquiries per IP per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many requests. Please try again later." },
});
app.use("/api/contact", limiter);

// ─── Nodemailer transporter ───────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// ─── Helpers ─────────────────────────────────────────────────
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildOwnerEmail(data) {
  const { name, phone, email, pipeType, pipeSize, quantity, message } = data;
  const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>New Enquiry – New Kishan</title>
  <style>
    @media only screen and (max-width: 600px) {
      .email-wrapper  { padding: 16px 8px !important; }
      .email-card     { border-radius: 12px !important; }
      .header-pad     { padding: 22px 20px !important; }
      .header-badge   { display: none !important; }
      .body-pad       { padding: 24px 20px !important; }
      .footer-pad     { padding: 16px 20px !important; }
      .data-label     { display: block !important; width: 100% !important; padding: 10px 16px 2px !important; font-size: 11px !important; }
      .data-value     { display: block !important; width: 100% !important; padding: 2px 16px 10px !important; font-size: 14px !important; }
      .cta-table td   { display: block !important; width: 100% !important; text-align: center !important; padding-bottom: 8px !important; }
      .cta-btn        { width: 100% !important; text-align: center !important; box-sizing: border-box !important; }
      .timestamp      { font-size: 11px !important; }
      h1              { font-size: 18px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f5f4f1;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

  <table class="email-wrapper" width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background:#f5f4f1;padding:32px 16px;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table class="email-card" width="100%" cellpadding="0" cellspacing="0" border="0"
               style="background:#ffffff;border-radius:16px;overflow:hidden;
                      max-width:600px;width:100%;
                      box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- ── Header ── -->
          <tr>
            <td class="header-pad" style="background:#1a2035;padding:26px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <p style="margin:0 0 4px;color:#c9922a;font-size:11px;font-weight:700;
                               letter-spacing:0.18em;text-transform:uppercase;">
                      New Kishan &middot; Cement Pipes
                    </p>
                    <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;line-height:1.3;">
                      New Enquiry Received
                    </h1>
                  </td>
                  <td class="header-badge" align="right" style="vertical-align:middle;padding-left:12px;white-space:nowrap;">
                    <span style="display:inline-block;background:#c9922a;color:#1a2035;
                                 font-size:11px;font-weight:700;letter-spacing:0.1em;
                                 text-transform:uppercase;padding:6px 14px;border-radius:999px;">
                      Quote Request
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Body ── -->
          <tr>
            <td class="body-pad" style="padding:28px 32px;">

              <!-- Section label -->
              <p style="margin:0 0 14px;font-size:12px;font-weight:700;color:#6b7280;
                         text-transform:uppercase;letter-spacing:0.14em;">
                Customer Details
              </p>

              <!-- Customer table -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="border:1px solid #e8e5e0;border-radius:10px;overflow:hidden;margin-bottom:24px;">
                ${mobileRow("Full Name", escapeHtml(name),  true)}
                ${mobileRow("Phone",     escapeHtml(phone), false)}
                ${mobileRow("Email",     escapeHtml(email), true)}
              </table>

              <!-- Section label -->
              <p style="margin:0 0 14px;font-size:12px;font-weight:700;color:#6b7280;
                         text-transform:uppercase;letter-spacing:0.14em;">
                Product Requirements
              </p>

              <!-- Product table -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="border:1px solid #e8e5e0;border-radius:10px;overflow:hidden;margin-bottom:24px;">
                ${mobileRow("Pipe Type", escapeHtml(pipeType) || "&mdash;", true)}
                ${mobileRow("Pipe Size", escapeHtml(pipeSize) || "&mdash;", false)}
                ${mobileRow("Quantity",  escapeHtml(quantity) || "&mdash;", true)}
              </table>

              ${message ? `
              <!-- Additional requirements -->
              <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#6b7280;
                         text-transform:uppercase;letter-spacing:0.14em;">
                Additional Requirements
              </p>
              <div style="background:#f9f8f6;border:1px solid #e8e5e0;border-radius:10px;
                          padding:14px 18px;font-size:14px;color:#374151;line-height:1.75;
                          margin-bottom:24px;white-space:pre-wrap;word-break:break-word;">
                ${escapeHtml(message)}
              </div>` : ""}

              <!-- CTA row -->
              <table class="cta-table" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-bottom:4px;">
                    <a class="cta-btn" href="mailto:${escapeHtml(email)}"
                       style="display:inline-block;background:#c9922a;color:#1a2035;
                              font-size:14px;font-weight:700;text-decoration:none;
                              padding:12px 24px;border-radius:10px;">
                      Reply to ${escapeHtml(name)}
                    </a>
                  </td>
                  <td class="timestamp" align="right"
                      style="font-size:12px;color:#9ca3af;vertical-align:middle;padding-left:8px;">
                    ${timestamp} IST
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ── Footer ── -->
          <tr>
            <td class="footer-pad"
                style="background:#f9f8f6;border-top:1px solid #e8e5e0;
                       padding:18px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                This email was sent automatically from the New Kishan website contact form.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Single data row — stacks label above value on mobile via CSS classes
function mobileRow(label, value, shaded) {
  const bg = shaded ? "#f9f8f6" : "#ffffff";
  return `
  <tr style="background:${bg};">
    <td class="data-label"
        style="padding:11px 18px;font-size:12px;font-weight:700;color:#6b7280;
               text-transform:uppercase;letter-spacing:0.1em;
               width:36%;border-bottom:1px solid #e8e5e0;vertical-align:top;">
      ${label}
    </td>
    <td class="data-value"
        style="padding:11px 18px;font-size:14px;color:#111827;
               border-bottom:1px solid #e8e5e0;vertical-align:top;
               word-break:break-word;">
      ${value}
    </td>
  </tr>`;
}

function buildCustomerEmail(name) {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>We received your enquiry – New Kishan</title>
  <style>
    @media only screen and (max-width: 600px) {
      .email-wrapper { padding: 16px 8px !important; }
      .email-card    { border-radius: 12px !important; }
      .header-pad    { padding: 22px 20px !important; }
      .body-pad      { padding: 24px 20px !important; }
      .footer-pad    { padding: 16px 20px !important; }
      .cta-btn       { width: 90% !important; text-align: center !important; box-sizing: border-box !important; font-size: 14px !important; padding: 14px 20px !important; }
      h1             { font-size: 18px !important; }
      .body-text     { font-size: 14px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f5f4f1;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

  <table class="email-wrapper" width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background:#f5f4f1;padding:32px 16px;">
    <tr>
      <td align="center">

        <table class="email-card" width="100%" cellpadding="0" cellspacing="0" border="0"
               style="background:#ffffff;border-radius:16px;overflow:hidden;
                      max-width:600px;width:100%;
                      box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- ── Header ── -->
          <tr>
            <td class="header-pad" style="background:#1a2035;padding:28px 32px;text-align:center;">
              <p style="margin:0 0 6px;color:#c9922a;font-size:11px;font-weight:700;
                         letter-spacing:0.18em;text-transform:uppercase;">
                New Kishan &middot; Cement Pipes
              </p>
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;line-height:1.3;">
                We&rsquo;ve Received Your Enquiry
              </h1>
            </td>
          </tr>

          <!-- ── Body ── -->
          <tr>
            <td class="body-pad" style="padding:32px 32px 28px;text-align:center;">

              <p class="body-text" style="margin:0 0 14px;font-size:16px;color:#374151;line-height:1.7;">
                Hi <strong>${escapeHtml(name)}</strong>,
              </p>
              <p class="body-text" style="margin:0 0 14px;font-size:15px;color:#6b7280;line-height:1.75;">
                Thank you for reaching out to <strong style="color:#1a2035;">New Kishan</strong>.
                We have received your enquiry and our team will review your requirements and
                get back to you within
                <strong style="color:#1a2035;">24 hours</strong>.
              </p>
              <p class="body-text" style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.75;">
                If you need an urgent response, feel free to call us directly.
              </p>

              <a class="cta-btn" href="tel:+919879577483"
                 style="display:inline-block;background:#c9922a;color:#1a2035;
                        font-size:15px;font-weight:700;text-decoration:none;
                        padding:14px 32px;border-radius:10px;">
                Call +91 98795 77483
              </a>

            </td>
          </tr>

          <!-- ── Footer ── -->
          <tr>
            <td class="footer-pad"
                style="background:#f9f8f6;border-top:1px solid #e8e5e0;
                       padding:18px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                Near Ramdev Pir Mandir, Otala, Gujarat 363650
                &nbsp;&bull;&nbsp;
                royalhume@gmail.com
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── POST /api/contact ────────────────────────────────────────
app.post("/api/contact", async (req, res) => {
  const { name, phone, email, pipeType, pipeSize, quantity, message } = req.body;

  console.log(`📧 Contact form submission from: ${name} <${email}>`);

  // Required fields
  if (!name || !phone || !email || !pipeType || !pipeSize) {
    console.log("❌ Validation failed: missing required fields");
    return res.status(400).json({
      success: false,
      message: "Please fill in all required fields.",
    });
  }

  // Email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(String(email).trim())) {
    console.log(`❌ Validation failed: invalid email — ${email}`);
    return res.status(400).json({ success: false, message: "Invalid email address." });
  }

  // Phone: exactly 10 digits, starts with 6-9
  const phoneDigits = String(phone).replace(/\s+/g, "");
  if (!/^[6-9]\d{9}$/.test(phoneDigits)) {
    console.log(`❌ Validation failed: invalid phone — ${phone}`);
    return res.status(400).json({ success: false, message: "Enter a valid 10-digit Indian mobile number." });
  }

  // Quantity: must be a positive integer if provided
  if (quantity !== undefined && quantity !== "") {
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      console.log(`❌ Validation failed: invalid quantity — ${quantity}`);
      return res.status(400).json({ success: false, message: "Quantity must be a positive number." });
    }
  }

  console.log("✅ Validation passed — sending emails...");

  try {
    // 1. Email to business owner
    console.log(`📤 Sending owner email to: ${process.env.RECIPIENT_EMAIL}`);
    await transporter.sendMail({
      from: `"New Kishan Website" <${process.env.GMAIL_USER}>`,
      to: process.env.RECIPIENT_EMAIL,
      replyTo: email,
      subject: `New Enquiry: ${pipeType} – ${pipeSize} from ${name}`,
      html: buildOwnerEmail({ name, phone, email, pipeType, pipeSize, quantity, message }),
    });
    console.log("✅ Owner email sent successfully");

    // 2. Confirmation email to customer
    console.log(`📤 Sending confirmation email to customer: ${email}`);
    await transporter.sendMail({
      from: `"New Kishan" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "We received your enquiry – New Kishan",
      html: buildCustomerEmail(name),
    });
    console.log("✅ Customer confirmation email sent successfully");

    return res.status(200).json({
      success: true,
      message: "Enquiry sent successfully.",
    });
  } catch (err) {
    console.error("❌ Mail error:", err.message);
    console.error("   Full error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to send enquiry. Please try again or call us directly.",
    });
  }
});

// ─── Health check ─────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  const uptimeSeconds = Math.floor(process.uptime());
  const hours   = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = uptimeSeconds % 60;

  res.json({
    status:      "ok",
    server:      "New Kishan Backend",
    environment: process.env.NODE_ENV || "development",
    uptime:      `${hours}h ${minutes}m ${seconds}s`,
    timestamp:   new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) + " IST",
    email: {
      configured:    !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD),
      sender:        process.env.GMAIL_USER        || "NOT SET",
      recipient:     process.env.RECIPIENT_EMAIL   || "NOT SET",
    },
    endpoints: {
      health:  "GET  /api/health",
      contact: "POST /api/contact",
    },
  });
});

// ─── Keep-alive ping (prevents Render free tier from sleeping) ─
setInterval(() => {
  const url = `http://localhost:${PORT}/api/health`;
  require("http").get(url, () => {}).on("error", () => {});
}, 14 * 60 * 1000); // every 14 minutes

// ─── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅  New Kishan backend running on http://localhost:${PORT}`);
});
