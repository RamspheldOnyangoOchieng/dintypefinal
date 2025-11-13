export const emailTemplates = {
  welcome: {
    subject: "Welcome to {{siteName}}!",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to {{siteName}}!</h1>
          </div>
          <div class="content">
            <h2>Hi {{username}},</h2>
            <p>Thank you for joining {{siteName}}! We're excited to have you on board.</p>
            <p>Your account has been successfully created and you can now start exploring our platform.</p>
            <p>Here's what you can do next:</p>
            <ul>
              <li>Complete your profile</li>
              <li>Create your first character</li>
              <li>Explore premium features</li>
            </ul>
            <center>
              <a href="{{dashboardUrl}}" class="button">Go to Dashboard</a>
            </center>
            <p>If you have any questions, feel free to reach out to our support team.</p>
            <p>Best regards,<br>The {{siteName}} Team</p>
          </div>
          <div class="footer">
            <p>&copy; {{year}} {{siteName}}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Welcome to {{siteName}}!

Hi {{username}},

Thank you for joining {{siteName}}! We're excited to have you on board.

Your account has been successfully created and you can now start exploring our platform.

Visit your dashboard: {{dashboardUrl}}

Best regards,
The {{siteName}} Team
    `,
  },

  paymentConfirmation: {
    subject: "Payment Confirmation - {{siteName}}",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .invoice { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .invoice-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .total { font-weight: bold; font-size: 18px; }
          .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Payment Confirmed</h1>
          </div>
          <div class="content">
            <h2>Hi {{username}},</h2>
            <p>Thank you for your payment! Your transaction has been successfully processed.</p>
            
            <div class="invoice">
              <h3>Order Details</h3>
              <div class="invoice-row">
                <span>Order ID:</span>
                <span>{{orderId}}</span>
              </div>
              <div class="invoice-row">
                <span>Date:</span>
                <span>{{orderDate}}</span>
              </div>
              <div class="invoice-row">
                <span>Item:</span>
                <span>{{itemName}}</span>
              </div>
              <div class="invoice-row total">
                <span>Total:</span>
                <span>{{amount}}</span>
              </div>
            </div>

            <p>{{purchaseDetails}}</p>

            <center>
              <a href="{{invoiceUrl}}" class="button">View Invoice</a>
            </center>

            <p>If you have any questions about your purchase, please contact our support team.</p>
            <p>Best regards,<br>The {{siteName}} Team</p>
          </div>
          <div class="footer">
            <p>&copy; {{year}} {{siteName}}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Payment Confirmation - {{siteName}}

Hi {{username}},

Thank you for your payment! Your transaction has been successfully processed.

Order ID: {{orderId}}
Date: {{orderDate}}
Item: {{itemName}}
Total: {{amount}}

{{purchaseDetails}}

View your invoice: {{invoiceUrl}}

Best regards,
The {{siteName}} Team
    `,
  },

  passwordReset: {
    subject: "Password Reset Request - {{siteName}}",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ef4444; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #ef4444; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hi {{username}},</h2>
            <p>We received a request to reset your password for your {{siteName}} account.</p>
            <p>Click the button below to reset your password:</p>
            <center>
              <a href="{{resetLink}}" class="button">Reset Password</a>
            </center>
            <p>This link will expire in 24 hours.</p>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong> If you didn't request this password reset, please ignore this email or contact support if you have concerns about your account security.
            </div>
            <p>Best regards,<br>The {{siteName}} Team</p>
          </div>
          <div class="footer">
            <p>&copy; {{year}} {{siteName}}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Password Reset Request - {{siteName}}

Hi {{username}},

We received a request to reset your password for your {{siteName}} account.

Reset your password: {{resetLink}}

This link will expire in 24 hours.

If you didn't request this password reset, please ignore this email.

Best regards,
The {{siteName}} Team
    `,
  },

  subscriptionRenewal: {
    subject: "Subscription Renewal Reminder - {{siteName}}",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #3b82f6; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Subscription Reminder</h1>
          </div>
          <div class="content">
            <h2>Hi {{username}},</h2>
            <p>Your premium subscription will expire soon.</p>
            
            <div class="info-box">
              <h3>Subscription Details</h3>
              <p><strong>Plan:</strong> {{planName}}</p>
              <p><strong>Expires:</strong> {{expiryDate}}</p>
              <p><strong>Days Remaining:</strong> {{daysRemaining}}</p>
            </div>

            <p>Renew now to continue enjoying premium features:</p>
            <ul>
              <li>Unlimited character creation</li>
              <li>Advanced AI features</li>
              <li>Priority support</li>
              <li>Exclusive content</li>
            </ul>

            <center>
              <a href="{{renewalUrl}}" class="button">Renew Subscription</a>
            </center>

            <p>Questions? Our support team is here to help!</p>
            <p>Best regards,<br>The {{siteName}} Team</p>
          </div>
          <div class="footer">
            <p>&copy; {{year}} {{siteName}}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Subscription Renewal Reminder - {{siteName}}

Hi {{username}},

Your premium subscription will expire soon.

Plan: {{planName}}
Expires: {{expiryDate}}
Days Remaining: {{daysRemaining}}

Renew now: {{renewalUrl}}

Best regards,
The {{siteName}} Team
    `,
  },
}

export type EmailTemplate = keyof typeof emailTemplates

export interface EmailData {
  [key: string]: string | number
}

export function renderTemplate(
  templateType: EmailTemplate,
  data: EmailData
): { subject: string; html: string; text: string } {
  const template = emailTemplates[templateType]
  
  const replaceVars = (text: string): string => {
    return text.replace(/{{(\w+)}}/g, (match, key) => {
      return data[key]?.toString() || match
    })
  }

  return {
    subject: replaceVars(template.subject),
    html: replaceVars(template.html),
    text: replaceVars(template.text),
  }
}
