// Email Service for notifications using Resend
// Resend API: https://resend.com

const ADMIN_EMAIL = 'linkmeucom@gmail.com';
const PLATFORM_NAME = 'LinkMeU';
const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY || '';

// Note: For production, you should use a verified domain in Resend
// During development/testing, Resend allows sending to your own verified email
// Use Resend's test domain until linkmeu.com DNS is verified
// Change to 'LinkMeU <notifications@linkmeu.com>' after DNS setup
const FROM_EMAIL = 'LinkMeU <onboarding@resend.dev>';

/**
 * Send email via Resend API
 */
const sendResendEmail = async ({ to, subject, html }) => {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: subject,
        html: html,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to send email');
    }
    
    console.log('✅ Email sent successfully:', data.id);
    return { success: true, id: data.id };
  } catch (error) {
    console.error('❌ Resend API error:', error);
    throw error;
  }
};

/**
 * Generate admin notification email HTML
 */
const generateAdminEmailHTML = (listing) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #DC2626, #B91C1C); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .header p { margin: 10px 0 0; opacity: 0.9; }
    .content { background: #f9fafb; padding: 30px; }
    .listing-card { background: white; padding: 24px; border-radius: 12px; border-left: 4px solid #DC2626; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .listing-card h2 { margin: 0 0 16px; color: #111; font-size: 20px; }
    .detail { margin: 8px 0; color: #666; }
    .detail strong { color: #333; }
    .btn { display: inline-block; background: #DC2626; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin-top: 24px; font-weight: 600; }
    .footer { text-align: center; padding: 24px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🆕 New Listing Submitted</h1>
      <p>A new listing is awaiting your approval</p>
    </div>
    <div class="content">
      <div class="listing-card">
        <h2>${listing.title || 'Untitled Listing'}</h2>
        <p class="detail"><strong>Category:</strong> ${listing.category || 'N/A'}</p>
        <p class="detail"><strong>Location:</strong> ${listing.location || 'Singapore'}</p>
        <p class="detail"><strong>Submitted by:</strong> ${listing.email || 'N/A'}</p>
        <p class="detail"><strong>Contact:</strong> ${listing.contact || 'N/A'}</p>
        <p class="detail"><strong>Submitted at:</strong> ${new Date().toLocaleString()}</p>
      </div>
      
      <p style="margin-top: 24px; color: #666;">Please review this listing and approve or reject it in the admin panel.</p>
      
      <a href="${typeof window !== 'undefined' ? window.location.origin : 'https://linkmeu.com'}/listings-admin" class="btn">Review in Admin Panel →</a>
    </div>
    <div class="footer">
      <p>This is an automated message from ${PLATFORM_NAME}</p>
      <p>© ${new Date().getFullYear()} LinkMeU. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

/**
 * Generate user notification email HTML
 */
const generateUserEmailHTML = (listing, status, statusInfo) => {
  const statusColors = {
    active: { bg: '#10B981', text: 'Approved' },
    rejected: { bg: '#EF4444', text: 'Not Approved' },
    pending: { bg: '#F59E0B', text: 'Under Review' },
  };
  
  const statusStyle = statusColors[status] || statusColors.pending;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, ${statusStyle.bg}, ${statusStyle.bg}dd); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .status-badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 6px 16px; border-radius: 20px; margin-top: 12px; font-size: 14px; }
    .content { background: #f9fafb; padding: 30px; }
    .message-box { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .btn { display: inline-block; background: #DC2626; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin-top: 24px; font-weight: 600; }
    .btn.green { background: #10B981; }
    .support { background: #FEF3C7; padding: 20px; border-radius: 8px; margin-top: 24px; }
    .support p { margin: 4px 0; color: #92400E; }
    .footer { text-align: center; padding: 24px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Listing Status Update</h1>
      <p>${listing.title || 'Your Listing'}</p>
      <span class="status-badge">${statusStyle.text}</span>
    </div>
    <div class="content">
      <div class="message-box">
        <p>Hi ${listing.email?.split('@')[0] || 'there'},</p>
        <p style="margin-top: 16px;">${statusInfo.message}</p>
      </div>
      
      ${status === 'active' ? `
        <a href="${typeof window !== 'undefined' ? window.location.origin : 'https://linkmeu.com'}/listing/${listing.id}" class="btn green">View Your Live Listing →</a>
      ` : ''}
      
      <div class="support">
        <p><strong>Need help?</strong></p>
        <p>📧 Email: ${ADMIN_EMAIL}</p>
        <p>📞 Phone: +65 9019 1311</p>
      </div>
    </div>
    <div class="footer">
      <p>This is an automated message from ${PLATFORM_NAME}</p>
      <p>© ${new Date().getFullYear()} LinkMeU. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;
};

/**
 * Send email notification to admin when new listing is submitted
 */
export const notifyAdminNewListing = async (listing) => {
  const subject = `🆕 New Listing Pending Approval: ${listing.title}`;
  const html = generateAdminEmailHTML(listing);

  try {
    const result = await sendResendEmail({
      to: ADMIN_EMAIL,
      subject,
      html,
    });
    console.log('✅ Admin notification email sent');
    return true;
  } catch (error) {
    console.error('❌ Failed to send admin notification:', error);
    // Store notification for manual follow-up
    storeNotification('admin', {
      to_email: ADMIN_EMAIL,
      subject,
      listing_title: listing.title,
      listing_email: listing.email,
    });
    return false;
  }
};

/**
 * Send email notification to user when listing status changes
 */
export const notifyUserListingStatus = async (listing, newStatus) => {
  const statusMessages = {
    active: {
      subject: `🎉 Your Listing is Now Live: ${listing.title}`,
      message: `Great news! Your listing "${listing.title}" has been approved and is now live on ${PLATFORM_NAME}. Users can now view your listing and contact you directly.`,
    },
    rejected: {
      subject: `❌ Listing Not Approved: ${listing.title}`,
      message: `Unfortunately, your listing "${listing.title}" was not approved. This could be due to incomplete information or policy violations. Please contact our support team for more details.`,
    },
    pending: {
      subject: `⏳ Listing Under Review: ${listing.title}`,
      message: `Your listing "${listing.title}" is currently under review. We'll notify you once it's approved.`,
    },
  };

  const statusInfo = statusMessages[newStatus] || statusMessages.pending;
  const html = generateUserEmailHTML(listing, newStatus, statusInfo);

  try {
    const result = await sendResendEmail({
      to: listing.email,
      subject: statusInfo.subject,
      html,
    });
    console.log('✅ User notification email sent to:', listing.email);
    return true;
  } catch (error) {
    console.error('❌ Failed to send user notification:', error);
    // Store notification for manual follow-up
    storeNotification('user', {
      to_email: listing.email,
      subject: statusInfo.subject,
      listing_title: listing.title,
      status: newStatus,
    });
    return false;
  }
};

/**
 * Store notifications locally when email service is not available
 * Admin can view these in the admin panel
 */
const NOTIFICATIONS_KEY = 'linkmeu_pending_notifications';

const storeNotification = (type, data) => {
  try {
    const stored = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]');
    stored.push({
      id: Date.now(),
      type,
      data,
      createdAt: new Date().toISOString(),
      sent: false,
    });
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(stored));
  } catch (error) {
    console.error('Failed to store notification:', error);
  }
};

export const getPendingNotifications = () => {
  try {
    return JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]');
  } catch {
    return [];
  }
};

export const clearNotification = (id) => {
  try {
    const stored = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]');
    const filtered = stored.filter(n => n.id !== id);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to clear notification:', error);
  }
};

export const markNotificationSent = (id) => {
  try {
    const stored = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]');
    const updated = stored.map(n => n.id === id ? { ...n, sent: true } : n);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to mark notification:', error);
  }
};

/**
 * Get count of pending listings for admin badge
 */
export const getPendingListingsCount = async () => {
  try {
    const { getAllListingsAdmin } = await import('../db/databaseAdapter');
    const listings = await getAllListingsAdmin();
    return listings.filter(l => l.status === 'pending').length;
  } catch {
    return 0;
  }
};

export default {
  notifyAdminNewListing,
  notifyUserListingStatus,
  getPendingNotifications,
  clearNotification,
  getPendingListingsCount,
};
