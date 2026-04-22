// lambdas/shared/email.js
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

const ses = new SESClient({ region: process.env.REGION });
const FROM = process.env.SES_FROM_EMAIL;

async function sendEmail(to, subject, htmlBody, textBody) {
  const toAddresses = Array.isArray(to) ? to : [to];
  const cmd = new SendEmailCommand({
    Source: FROM,
    Destination: { ToAddresses: toAddresses },
    Message: {
      Subject: { Data: subject, Charset: "UTF-8" },
      Body: {
        Html: { Data: htmlBody, Charset: "UTF-8" },
        Text: { Data: textBody || htmlBody.replace(/<[^>]+>/g, ""), Charset: "UTF-8" },
      },
    },
  });
  await ses.send(cmd);
}

/**
 * Notify member(s) when assigned to a task.
 */
async function notifyAssignment(memberEmails, task) {
  if (!memberEmails.length) return;
  const subject = `[Task Management] You've been assigned: ${task.title}`;
  const html = `
    <h2>New Task Assignment</h2>
    <p>You have been assigned to the following task:</p>
    <table style="border-collapse:collapse;width:100%">
      <tr><td style="padding:8px;border:1px solid #ddd"><strong>Title</strong></td><td style="padding:8px;border:1px solid #ddd">${task.title}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd"><strong>Description</strong></td><td style="padding:8px;border:1px solid #ddd">${task.description || "—"}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd"><strong>Priority</strong></td><td style="padding:8px;border:1px solid #ddd">${task.priority || "Normal"}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd"><strong>Due Date</strong></td><td style="padding:8px;border:1px solid #ddd">${task.dueDate || "Not set"}</td></tr>
    </table>
    <p>Please log in to the Task Management System to view full details.</p>
  `;
  await sendEmail(memberEmails, subject, html);
}

/**
 * Notify admin and all assigned members when task status changes.
 */
async function notifyStatusChange(recipients, task, updatedBy) {
  if (!recipients.length) return;
  const subject = `[Task Management] Status Update: ${task.title}`;
  const html = `
    <h2>Task Status Updated</h2>
    <p><strong>${updatedBy}</strong> changed the status of a task:</p>
    <table style="border-collapse:collapse;width:100%">
      <tr><td style="padding:8px;border:1px solid #ddd"><strong>Title</strong></td><td style="padding:8px;border:1px solid #ddd">${task.title}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd"><strong>New Status</strong></td><td style="padding:8px;border:1px solid #ddd">${task.status}</td></tr>
    </table>
    <p>Please log in to the Task Management System for details.</p>
  `;
  await sendEmail(recipients, subject, html);
}

module.exports = { sendEmail, notifyAssignment, notifyStatusChange };
