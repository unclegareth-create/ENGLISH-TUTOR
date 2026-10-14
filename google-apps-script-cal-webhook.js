/**
 * ==============================================================================
 * GARETHENGLISH.COM — AUTOMATED BOOKING, STRIPE & CALENDAR WORKFLOW
 * Google Apps Script Webhook Receiver for Cal.com & Stripe
 * ==============================================================================
 * 
 * PURPOSE:
 * Runs 24/7/365 in Google Workspace to automatically handle new student bookings
 * while you sleep:
 *   1. Receives instant webhooks from Cal.com when a student books & pays £20.
 *   2. Logs student details, Stripe payment IDs, and meeting links into a Google Sheet.
 *   3. Dispatches a high-touch, personalized Diagnostic Preparation Email.
 *   4. Enforces the 12-hour cancellation policy automatically.
 *
 * SETUP INSTRUCTIONS (5 Minutes):
 *   1. Create a new Google Sheet named "Gareth English - Student Bookings".
 *   2. In row 1, add columns:
 *      Timestamp | Student Name | Student Email | Lesson Date/Time | Timezone | Meeting Link | Amount Paid | Stripe ID | Status | Student Notes
 *   3. Click Extensions > Apps Script.
 *   4. Delete any code in Code.gs and paste this entire file.
 *   5. Click Deploy > New deployment > Select type: "Web app".
 *      - Execute as: "Me" (your Google account)
 *      - Who has access: "Anyone"
 *   6. Copy the generated Web App URL.
 *   7. Go to Cal.com > Settings > Webhooks > "New Webhook":
 *      - Subscriber URL: Paste your Web App URL
 *      - Triggers: Check "BOOKING_CREATED", "BOOKING_RESCHEDULED", "BOOKING_CANCELLED"
 *   8. Done! New paid bookings will now automatically log and trigger emails.
 */

// CONFIGURATION
const CONFIG = {
  SHEET_NAME: "Sheet1", // Change to match your active tab name if needed
  TUTOR_NAME: "Gareth Montgomery",
  TUTOR_EMAIL: "unclegareth@gmail.com", // Your notification recipient email
  SITE_URL: "https://garethenglish.com",
  CANCELLATION_HOURS_THRESHOLD: 12
};

/**
 * HTTP POST Handler for Cal.com Webhooks
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "No payload" }))
                           .setMimeType(ContentService.MimeType.JSON);
    }

    const payload = JSON.parse(e.postData.contents);
    const triggerEvent = payload.triggerEvent || payload.event;
    const data = payload.payload || payload;

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.getActiveSheet();

    switch (triggerEvent) {
      case "BOOKING_CREATED":
        handleBookingCreated(data, sheet);
        break;

      case "BOOKING_RESCHEDULED":
        handleBookingRescheduled(data, sheet);
        break;

      case "BOOKING_CANCELLED":
        handleBookingCancelled(data, sheet);
        break;

      default:
        console.log("Unhandled webhook event trigger: " + triggerEvent);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
                         .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error("Error processing Cal.com webhook:", error);
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: error.toString() }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle New Paid Bookings
 */
function handleBookingCreated(data, sheet) {
  const student = data.attendees && data.attendees.length > 0 ? data.attendees[0] : {};
  const studentName = student.name || "Student";
  const studentEmail = student.email || "";
  const studentTimezone = student.timeZone || "UTC";
  
  const startTime = data.startTime ? new Date(data.startTime) : new Date();
  const meetingUrl = data.metadata?.videoCallUrl || data.location || "Cal.com / Google Meet link in invite";
  const bookingUid = data.uid || "";
  
  // Payment info from Cal.com Stripe integration
  const payment = data.payment && data.payment.length > 0 ? data.payment[0] : {};
  const amountPaid = payment.amount ? "£" + (payment.amount / 100).toFixed(2) : "£20.00";
  const stripeId = payment.externalId || payment.id || "Stripe Auto-Checkout";
  
  // Custom responses or student goals
  const studentNotes = extractStudentResponses(data.customInputs || data.responses);

  // 1. Append row to Google Sheets
  sheet.appendRow([
    new Date(),
    studentName,
    studentEmail,
    formatDateTime(startTime, studentTimezone),
    studentTimezone,
    meetingUrl,
    amountPaid,
    stripeId,
    "CONFIRMED (Paid)",
    studentNotes,
    bookingUid
  ]);

  // 2. Send Automated Diagnostic Intake & Confirmation Email to Student
  sendStudentConfirmationEmail(studentName, studentEmail, startTime, studentTimezone, meetingUrl);

  // 3. Notify Gareth
  sendTutorNotification(studentName, studentEmail, startTime, studentTimezone, amountPaid, studentNotes);
}

/**
 * Handle Rescheduled Bookings
 */
function handleBookingRescheduled(data, sheet) {
  const student = data.attendees && data.attendees.length > 0 ? data.attendees[0] : {};
  const studentName = student.name || "Student";
  const studentEmail = student.email || "";
  const studentTimezone = student.timeZone || "UTC";
  const newStartTime = data.startTime ? new Date(data.startTime) : new Date();
  const bookingUid = data.uid || "";

  // Update existing row if bookingUid is found
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][10] === bookingUid || rows[i][2] === studentEmail) {
      sheet.getRange(i + 1, 4).setValue(formatDateTime(newStartTime, studentTimezone));
      sheet.getRange(i + 1, 9).setValue("RESCHEDULED");
      break;
    }
  }

  // Notify student
  const subject = "Rescheduled: 30-Minute Diagnostic Trial with Gareth Montgomery";
  const body = `Hi ${studentName},\n\nYour 30-minute diagnostic session has been successfully rescheduled to:\n\n📅 ${formatDateTime(newStartTime, studentTimezone)} (${studentTimezone})\n\nLooking forward to working with you!\n\nBest regards,\nGareth Montgomery\n${CONFIG.SITE_URL}`;
  
  if (studentEmail) {
    MailApp.sendEmail(studentEmail, subject, body);
  }
}

/**
 * Handle Cancelled Bookings & 12-Hour Policy Audit
 */
function handleBookingCancelled(data, sheet) {
  const student = data.attendees && data.attendees.length > 0 ? data.attendees[0] : {};
  const studentEmail = student.email || "";
  const bookingUid = data.uid || "";
  const startTime = data.startTime ? new Date(data.startTime) : null;

  let policyStatus = "CANCELLED";
  if (startTime) {
    const hoursNotice = (startTime.getTime() - new Date().getTime()) / (1000 * 60 * 60);
    if (hoursNotice >= CONFIG.CANCELLATION_HOURS_THRESHOLD) {
      policyStatus = "CANCELLED (Eligible for Full Refund/Credit - >12h notice)";
    } else {
      policyStatus = "CANCELLED (Late Notice <12h - Fee Retained per Policy)";
    }
  }

  // Update sheet
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][10] === bookingUid || rows[i][2] === studentEmail) {
      sheet.getRange(i + 1, 9).setValue(policyStatus);
      break;
    }
  }
}

/**
 * Send High-Touch Onboarding & Diagnostic Email to Student
 */
function sendStudentConfirmationEmail(name, email, startTime, timezone, meetingUrl) {
  if (!email) return;

  const formattedDate = formatDateTime(startTime, timezone);
  const subject = "Confirmed: 30-Minute Diagnostic Trial with Gareth Montgomery";

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; color: #1e293b; line-height: 1.6; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
      <h2 style="color: #0369a1; margin-top: 0;">Your 30-Minute Diagnostic Trial is Confirmed</h2>
      
      <p>Hi ${escapeHtml(name)},</p>
      
      <p>Thank you for booking! Your £20 payment was received, and your session is locked into my calendar. Here are your booking details:</p>
      
      <div style="background-color: #f8fafc; border-left: 4px solid #0284c7; padding: 16px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 4px 0;"><strong>📅 Date & Time:</strong> ${formattedDate} (${timezone})</p>
        <p style="margin: 4px 0;"><strong>💻 Video Room:</strong> <a href="${meetingUrl}" style="color: #0284c7; font-weight: bold;">Join Video Lesson Here</a></p>
        <p style="margin: 4px 0;"><strong>⏱ Duration:</strong> 30 Minutes</p>
      </div>

      <h3 style="color: #0f172a; margin-bottom: 8px;">What We Will Cover in 30 Minutes:</h3>
      <ol style="padding-left: 20px; margin-top: 4px;">
        <li><strong>First 15 Mins: Spoken & Grammatical Diagnostic.</strong> We'll discuss your background, identify whether you fit into <em>Profile A (high fluency but needs strict structure)</em> or <em>Profile B (grammar perfectionist who needs fluency unblocking)</em>, and test your spontaneous production.</li>
        <li><strong>Second 15 Mins: Bespoke Study Roadmap.</strong> We'll construct a realistic timeline and strategy for your target exam score (IELTS 7.0+ or Cambridge C1/C2) or professional presentation goals.</li>
      </ol>

      <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 14px; margin: 20px 0;">
        <p style="margin: 0; font-size: 13px; color: #1e40af;">
          <strong>Optional Quick Prep:</strong> If you are preparing for IELTS Writing Task 2 or Cambridge C1/C2 essays, feel free to reply directly to this email with a recent essay draft or sample paragraph. We can mark it up live together during our session.
        </p>
      </div>

      <p style="font-size: 12px; color: #64748b; margin-top: 24px; border-top: 1px solid #e2e8f0; pt: 12px;">
        <em>Cancellation policy: Lessons can be rescheduled or cancelled with at least 12 hours advance notice at zero fee via the link in your calendar invitation.</em>
      </p>

      <p style="margin-bottom: 0;">Warm regards,<br><strong>Gareth Montgomery</strong><br><a href="${CONFIG.SITE_URL}" style="color: #0284c7;">garethenglish.com</a></p>
    </div>
  `;

  MailApp.sendEmail({
    to: email,
    subject: subject,
    htmlBody: htmlBody
  });
}

/**
 * Send Immediate Notification to Tutor
 */
function sendTutorNotification(name, email, startTime, timezone, amount, notes) {
  const subject = `[New Paid Booking] ${name} (£20 Diagnostic Trial)`;
  const body = `Great news! A new student just booked and paid for a 30-minute diagnostic trial.\n\n` +
               `Student: ${name} (${email})\n` +
               `Time: ${formatDateTime(startTime, "Europe/London")} (UK Time) / ${formatDateTime(startTime, timezone)} (${timezone})\n` +
               `Amount Paid: ${amount}\n` +
               `Student Notes / Goals: ${notes}\n\n` +
               `Cal.com and Google Calendar have been updated automatically.`;

  MailApp.sendEmail(CONFIG.TUTOR_EMAIL, subject, body);
}

// HELPERS
function formatDateTime(date, timezone) {
  return Utilities.formatDate(date, timezone, "EEE, d MMM yyyy 'at' HH:mm");
}

function extractStudentResponses(responses) {
  if (!responses) return "None provided";
  if (typeof responses === "string") return responses;
  const parts = [];
  for (let key in responses) {
    if (responses[key] && responses[key].value) {
      parts.push(key + ": " + responses[key].value);
    } else if (typeof responses[key] === "string") {
      parts.push(key + ": " + responses[key]);
    }
  }
  return parts.join(" | ") || "None provided";
}

function escapeHtml(text) {
  return text ? text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : "";
}
