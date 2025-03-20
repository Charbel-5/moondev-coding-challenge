import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

// Simplified payload interface - only include what's needed
interface WebhookPayload {
  type: string;
  table: string;
  record: {
    email: string;
    full_name: string;
    feedback: string;
    status: string;
  };
  old_record: {
    status: string | null;
  };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const headers = new Headers({ "Content-Type": "application/json", ...corsHeaders });
  
  try {
    // Parse and validate request
    let payload: WebhookPayload;
    try {
      const text = await req.text();
      if (!text) return new Response(JSON.stringify({ success: false, message: "Empty request body" }), { status: 400, headers });
      payload = JSON.parse(text);
    } catch {
      return new Response(JSON.stringify({ success: false, message: "Invalid JSON" }), { status: 400, headers });
    }
    
    // Skip processing if invalid payload or no status change
    if (!payload?.record?.email || payload.table !== "submissions" || 
        (payload.old_record.status === payload.record.status && payload.old_record.feedback === payload.record.feedback) || 
        payload.record.status === "pending" || !payload.record.status) {
      return new Response(JSON.stringify({ success: true, message: "Skipped processing" }), { status: 200, headers });
    }

    // Email setup
    const isAccepted = payload.record.status === "accepted";
    const statusText = isAccepted ? "Welcome to the Team" : "Application Update";
    const primaryColor = isAccepted ? "#3a86ff" : "#ff595e"; 
    const buttonColor = isAccepted ? "#2ecc71" : "#6c757d";
    const email = payload.record.email;
    const name = payload.record.full_name;
    
    // Email credentials
    const username = Deno.env.get("GMAIL_USER") || "";
    const password = Deno.env.get("GMAIL_APP_PASSWORD") || "";
    if (!username || !password) {
      throw new Error("Missing email credentials");
    }
    
    // Create SMTP client and send email
    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: { username, password },
      },
    });
    
    // Streamlined HTML with better design principles
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Application Status</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; line-height: 1.6; color: #2b2d42; margin: 0; padding: 0; background-color: #f8f9fa;">
<table width="100%" cellspacing="0" cellpadding="0" bgcolor="#f8f9fa">
<tr>
<td align="center" style="padding: 40px 0;">
<table width="600" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.08);">
<tr>
<td style="background-color: ${primaryColor}; padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
<h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Application Status</h1>
</td>
</tr>
<tr>
<td style="padding: 40px;">
<p style="margin: 0 0 25px; font-size: 16px;">Dear ${name},</p>
<p style="margin: 0 0 25px; font-size: 16px;">Thank you for your interest in joining our team.</p>

<div style="background-color: ${isAccepted ? '#e8f5e9' : '#ffebee'}; border-radius: 8px; padding: 25px; margin: 30px 0; border-left: 4px solid ${primaryColor};">
<h2 style="margin: 0 0 15px; color: ${primaryColor}; font-size: 22px; font-weight: 600;">${statusText}</h2>
<p style="margin: 0; font-size: 16px;">${isAccepted 
  ? 'We\'re thrilled to inform you that your application has been <strong>accepted</strong>! Your skills and experience stood out to us, and we believe you\'ll be a valuable addition to our team.' 
  : 'After careful consideration, we regret to inform you that we won\'t be moving forward with your application at this time. Our hiring process is highly competitive, and this decision doesn\'t necessarily reflect on your qualifications or skills.'}</p>
</div>

${isAccepted ? `
<div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin: 30px 0;">
<h3 style="margin: 0 0 15px; color: #2b2d42; font-size: 18px; font-weight: 600;">Your Journey Begins Here</h3>
<ul style="margin: 0; padding: 0 0 0 20px;">
<li style="margin: 8px 0;"><strong>Complete Onboarding</strong> - Paperwork and team introduction</li>
<li style="margin: 8px 0;"><strong>Attend Orientation</strong> - Learn about our culture and values</li>
<li style="margin: 8px 0;"><strong>Set Up Your Environment</strong> - Get your development tools ready</li>
<li style="margin: 8px 0;"><strong>Join Team Channels</strong> - Connect with your new colleagues</li>
</ul>
</div>` : ''}

${payload.record.feedback ? `
<div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin: 30px 0; border-left: 4px solid ${primaryColor};">
<h3 style="margin: 0 0 15px; color: #2b2d42; font-size: 18px; font-weight: 600;">Feedback from Our Team</h3>
<p style="margin: 0;">${payload.record.feedback.replace(/\n/g, '<br>')}</p>
</div>` : ''}

<p style="margin: 30px 0;">If you have any questions, please contact <a href="mailto:hr@example.com" style="color: ${primaryColor}; text-decoration: none; font-weight: 500;">hr@example.com</a>.</p>

<div style="text-align: center; margin: 40px 0 20px;">
<a href="https://example.com/${isAccepted ? 'onboarding' : 'opportunities'}" style="background-color: ${buttonColor}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block;">${isAccepted ? 'START ONBOARDING' : 'EXPLORE OPPORTUNITIES'}</a>
</div>
</td>
</tr>
<tr>
<td style="background-color: #f1f5f9; padding: 30px; border-radius: 0 0 8px 8px; text-align: center;">
<p style="margin: 0 0 10px; color: #2b2d42; font-weight: 600; font-size: 16px;">Tech Careers Portal</p>
<p style="margin: 0 0 20px; color: #6c757d; font-size: 14px;">Building the future through innovation and code.</p>
<div style="margin-top: 20px;">
<a href="#" style="color: ${primaryColor}; font-size: 14px; text-decoration: none; margin: 0 10px;">Twitter</a>
<a href="#" style="color: ${primaryColor}; font-size: 14px; text-decoration: none; margin: 0 10px;">LinkedIn</a>
<a href="#" style="color: ${primaryColor}; font-size: 14px; text-decoration: none; margin: 0 10px;">GitHub</a>
</div>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;

    // Simplified plain text version
    const plainText = [
      "Application Status Update",
      "",
      "Dear " + name + ",",
      "",
      "Thank you for your application.",
      "",
      "STATUS: " + statusText,
      "",
      isAccepted 
        ? "Your application has been ACCEPTED! We're excited to welcome you to the team."
        : "We regret to inform you that your application was not selected at this time.",
      "",
      isAccepted 
        ? "NEXT STEPS:\n- Complete onboarding paperwork\n- Attend orientation\n- Set up your environment\n- Join team channels"
        : "Our hiring process is competitive. This decision doesn't necessarily reflect on your qualifications.",
      "",
      payload.record.feedback 
        ? "FEEDBACK:\n" + payload.record.feedback.replace(/\r?\n/g, " ")
        : "",
      "",
      "Questions? Contact hr@example.com",
      "",
      "Tech Careers Portal",
      "Building the future through innovation and code."
    ].filter(Boolean).join("\r\n");

    // Send email
    await client.send({
      from: username,
      to: email,
      subject: "Application Status: " + statusText,
      content: plainText,
      html: html
    });
    
    await client.close();

    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500, headers });
  }
});