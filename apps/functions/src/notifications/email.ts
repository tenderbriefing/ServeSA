import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

interface EmailNotificationData {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  type: 'case_acknowledgment' | 'status_update' | 'sla_breach' | 'general';
  data?: Record<string, any>;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send email notification using Gmail API
 */
export const sendEmailNotification = async (emailData: EmailNotificationData): Promise<EmailResult> => {
  try {
    // For Phase-1, we'll use a simple email service
    // In production, this would integrate with Gmail API or SendGrid
    
    // Log the email for now (in production, this would actually send)
    console.log('Email notification:', {
      to: emailData.to,
      subject: emailData.subject,
      type: emailData.type,
      timestamp: new Date().toISOString()
    });

    // Store email in database for tracking
    await db.collection('email_logs').add({
      to: emailData.to,
      subject: emailData.subject,
      type: emailData.type,
      data: emailData.data,
      status: 'sent',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      messageId: `email_${Date.now()}`
    };

  } catch (error) {
    console.error('Error sending email notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Send case acknowledgment email
 */
export const sendCaseAcknowledgmentEmail = async (
  caseData: any,
  userEmail: string,
  userName?: string
): Promise<EmailResult> => {
  const subject = `Case Acknowledged: ${caseData.title}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Case Acknowledged</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .case-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .button { display: inline-block; background: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Case Acknowledged</h1>
          <p>Your service delivery report has been received</p>
        </div>
        
        <div class="content">
          <p>Dear ${userName || 'Valued Citizen'},</p>
          
          <p>Thank you for reporting this issue to ServeSA. Your case has been successfully submitted and is now being processed.</p>
          
          <div class="case-details">
            <h3>Case Details</h3>
            <p><strong>Case ID:</strong> ${caseData.caseId}</p>
            <p><strong>Title:</strong> ${caseData.title}</p>
            <p><strong>Category:</strong> ${caseData.category}</p>
            <p><strong>Priority:</strong> ${caseData.priority}</p>
            <p><strong>Location:</strong> ${caseData.location.address || 'Location provided'}</p>
            <p><strong>Submitted:</strong> ${new Date(caseData.createdAt).toLocaleString()}</p>
            <p><strong>Estimated Resolution:</strong> ${new Date(caseData.slaTarget).toLocaleString()}</p>
          </div>
          
          <p>You can track the progress of your case using the link below:</p>
          <p><a href="${caseData.shareUrl}" class="button">Track Your Case</a></p>
          
          <p>We will keep you updated on the progress of your case. If you have any questions, please don't hesitate to contact us.</p>
          
          <p>Best regards,<br>The ServeSA Team</p>
        </div>
        
        <div class="footer">
          <p>This is an automated message from ServeSA - South Africa's Service Delivery Platform</p>
          <p>If you did not submit this case, please ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
    Case Acknowledged: ${caseData.title}
    
    Dear ${userName || 'Valued Citizen'},
    
    Thank you for reporting this issue to ServeSA. Your case has been successfully submitted and is now being processed.
    
    Case Details:
    - Case ID: ${caseData.caseId}
    - Title: ${caseData.title}
    - Category: ${caseData.category}
    - Priority: ${caseData.priority}
    - Location: ${caseData.location.address || 'Location provided'}
    - Submitted: ${new Date(caseData.createdAt).toLocaleString()}
    - Estimated Resolution: ${new Date(caseData.slaTarget).toLocaleString()}
    
    Track your case: ${caseData.shareUrl}
    
    We will keep you updated on the progress of your case.
    
    Best regards,
    The ServeSA Team
  `;

  return await sendEmailNotification({
    to: userEmail,
    subject,
    htmlContent,
    textContent,
    type: 'case_acknowledgment',
    data: {
      caseId: caseData.caseId,
      category: caseData.category,
      priority: caseData.priority
    }
  });
};

/**
 * Send case status update email
 */
export const sendCaseStatusUpdateEmail = async (
  caseData: any,
  userEmail: string,
  userName?: string,
  newStatus?: string,
  comment?: string
): Promise<EmailResult> => {
  const subject = `Case Update: ${caseData.title}`;
  
  const statusMessages: Record<string, string> = {
    'acknowledged': 'Your case has been acknowledged and is being reviewed',
    'in_progress': 'Work has begun on your case',
    'resolved': 'Your case has been resolved',
    'closed': 'Your case has been closed'
  };

  const statusMessage = statusMessages[newStatus || caseData.status] || 'Your case status has been updated';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Case Update</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .case-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .status-update { background: #e8f5e8; padding: 15px; border-left: 4px solid #4CAF50; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .button { display: inline-block; background: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Case Update</h1>
          <p>${statusMessage}</p>
        </div>
        
        <div class="content">
          <p>Dear ${userName || 'Valued Citizen'},</p>
          
          <div class="status-update">
            <h3>Status Update</h3>
            <p><strong>New Status:</strong> ${newStatus || caseData.status}</p>
            ${comment ? `<p><strong>Comment:</strong> ${comment}</p>` : ''}
            <p><strong>Updated:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <div class="case-details">
            <h3>Case Details</h3>
            <p><strong>Case ID:</strong> ${caseData.caseId}</p>
            <p><strong>Title:</strong> ${caseData.title}</p>
            <p><strong>Category:</strong> ${caseData.category}</p>
            <p><strong>Priority:</strong> ${caseData.priority}</p>
            <p><strong>Location:</strong> ${caseData.location.address || 'Location provided'}</p>
          </div>
          
          <p>You can view the full details and track progress using the link below:</p>
          <p><a href="${caseData.shareUrl}" class="button">View Case Details</a></p>
          
          <p>Thank you for using ServeSA to improve your community.</p>
          
          <p>Best regards,<br>The ServeSA Team</p>
        </div>
        
        <div class="footer">
          <p>This is an automated message from ServeSA - South Africa's Service Delivery Platform</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmailNotification({
    to: userEmail,
    subject,
    htmlContent,
    type: 'status_update',
    data: {
      caseId: caseData.caseId,
      status: newStatus || caseData.status,
      comment
    }
  });
};

/**
 * Send SLA breach notification email
 */
export const sendSLABreachEmail = async (
  caseData: any,
  userEmail: string,
  userName?: string
): Promise<EmailResult> => {
  const subject = `SLA Breach Alert: ${caseData.title}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>SLA Breach Alert</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f44336; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .alert { background: #ffebee; padding: 15px; border-left: 4px solid #f44336; margin: 15px 0; }
        .case-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .button { display: inline-block; background: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>SLA Breach Alert</h1>
          <p>Service Level Agreement has been exceeded</p>
        </div>
        
        <div class="content">
          <p>Dear ${userName || 'Valued Citizen'},</p>
          
          <div class="alert">
            <h3>⚠️ SLA Breach Alert</h3>
            <p>We apologize, but the estimated resolution time for your case has been exceeded. We are working to resolve this issue as quickly as possible.</p>
          </div>
          
          <div class="case-details">
            <h3>Case Details</h3>
            <p><strong>Case ID:</strong> ${caseData.caseId}</p>
            <p><strong>Title:</strong> ${caseData.title}</p>
            <p><strong>Category:</strong> ${caseData.category}</p>
            <p><strong>Priority:</strong> ${caseData.priority}</p>
            <p><strong>Original SLA Target:</strong> ${new Date(caseData.slaTarget).toLocaleString()}</p>
            <p><strong>Current Status:</strong> ${caseData.status}</p>
          </div>
          
          <p>We sincerely apologize for this delay and are taking immediate action to resolve your case. You can track the progress using the link below:</p>
          <p><a href="${caseData.shareUrl}" class="button">Track Your Case</a></p>
          
          <p>If you have any concerns, please contact us directly.</p>
          
          <p>Best regards,<br>The ServeSA Team</p>
        </div>
        
        <div class="footer">
          <p>This is an automated message from ServeSA - South Africa's Service Delivery Platform</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmailNotification({
    to: userEmail,
    subject,
    htmlContent,
    type: 'sla_breach',
    data: {
      caseId: caseData.caseId,
      slaTarget: caseData.slaTarget,
      status: caseData.status
    }
  });
};
