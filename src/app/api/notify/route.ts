import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getDb } from '@/lib/firebase';

const resend = new Resend(process.env.RESEND_API_KEY);
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || 'contact@therealitycheck.co.il';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, formData, reportData, contactInfo, investmentInfo } = body;

    if (!type || !formData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const timestamp = new Date().toISOString();
    const notification = { type, timestamp, formData, reportData, contactInfo, investmentInfo };

    // ── 1. Store in Firestore (if configured) ──
    const db = getDb();
    if (db) {
      try {
        await db.collection('leads').add({
          type,
          name: contactInfo?.name || formData?.name || '',
          phone: contactInfo?.phone || formData?.phone || '',
          email: contactInfo?.email || formData?.email || '',
          message: investmentInfo?.freeText || formData?.project || '',
          status: 'new',
          timestamp,
          source: type === 'booking' ? 'booking-page' : 'report-cta',
          formData,
          reportData: reportData || null,
          investmentInfo: investmentInfo || null,
        });
      } catch (fbErr) {
        console.error('Firestore write failed:', fbErr);
        // Don't block the response — email may still work
      }
    }

    // ── 2. Send email via Resend ──
    const name = contactInfo?.name || formData?.name || 'Unknown';
    const phone = contactInfo?.phone || formData?.phone || '';
    const email = contactInfo?.email || formData?.email || '';

    const subject = type === 'booking'
      ? `📅 פגישה חדשה — ${name} | ${formData?.date || ''} ${formData?.time || ''}`
      : `🔔 ליד חדש (${type}) — ${name}`;

    const lines: string[] = [
      `<h2>THE REALITY CHECK — ${type === 'booking' ? 'בקשת פגישה' : 'ליד חדש'}</h2>`,
      `<p><strong>סוג:</strong> ${type}</p>`,
      `<p><strong>שם:</strong> ${name}</p>`,
      `<p><strong>טלפון:</strong> ${phone}</p>`,
      `<p><strong>אימייל:</strong> ${email}</p>`,
    ];

    if (type === 'booking') {
      lines.push(`<p><strong>תאריך:</strong> ${formData?.date || '-'}</p>`);
      lines.push(`<p><strong>שעה:</strong> ${formData?.time || '-'}</p>`);
      if (formData?.project) lines.push(`<p><strong>פרויקט:</strong> ${formData.project}</p>`);
    }

    if (reportData) {
      lines.push(`<hr/><h3>נתוני דוח</h3>`);
      if (reportData.certainty != null) lines.push(`<p><strong>ציון וודאות:</strong> ${reportData.certainty}%</p>`);
      if (reportData.years != null) lines.push(`<p><strong>שנים לאכלוס:</strong> ${reportData.years}</p>`);
      if (reportData.gap != null) lines.push(`<p><strong>פער:</strong> ${reportData.gap} שנים</p>`);
    }

    if (investmentInfo) {
      lines.push(`<hr/><h3>פרטי השקעה</h3>`);
      if (investmentInfo.budget) lines.push(`<p><strong>תקציב:</strong> ${investmentInfo.budget} ₪</p>`);
      if (investmentInfo.city) lines.push(`<p><strong>עיר:</strong> ${investmentInfo.city}</p>`);
      if (investmentInfo.years) lines.push(`<p><strong>תקופה:</strong> ${investmentInfo.years} שנים</p>`);
      if (investmentInfo.freeText) lines.push(`<p><strong>הערות:</strong> ${investmentInfo.freeText}</p>`);
    }

    if (formData && type !== 'booking') {
      lines.push(`<hr/><h3>נתוני טופס</h3>`);
      lines.push(`<pre>${JSON.stringify(formData, null, 2)}</pre>`);
    }

    lines.push(`<hr/><p style="color:#999;font-size:12px;">Timestamp: ${timestamp}</p>`);

    if (process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: 'THE REALITY CHECK <noreply@therealitycheck.co.il>',
          to: [NOTIFY_EMAIL],
          subject,
          html: lines.join('\n'),
        });
      } catch (emailErr) {
        console.error('Resend email failed:', emailErr);
        // Don't block the response
      }
    }

    // ── 3. Always log to console as fallback ──
    console.log('=== REALITY CHECK — NEW LEAD ===');
    console.log(JSON.stringify(notification, null, 2));
    console.log('================================');

    return NextResponse.json({
      success: true,
      message: 'הפרטים נשלחו בהצלחה',
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to process notification', detail: String(err) }, { status: 500 });
  }
}
