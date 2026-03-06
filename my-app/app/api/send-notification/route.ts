import nodemailer from "nodemailer";
//Email setup function that is called when panic button is called
//Loads email creds and sends Notification email
export async function POST() {
  try {
    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
    const notificationEmail = process.env.NOTIFICATION_EMAIL;

    if (!gmailUser || !gmailAppPassword || !notificationEmail) {
      return Response.json(
        { success: false, error: "Missing required environment variables." },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

    await transporter.sendMail({
      from: gmailUser,
      to: notificationEmail,
      subject: "Notification",
      text: "Notification",
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Email send failed:", error);

    return Response.json(
      { success: false, error: "Failed to send notification email." },
      { status: 500 }
    );
  }
}