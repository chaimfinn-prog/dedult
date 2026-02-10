import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, formData, reportData, contactInfo, investmentInfo } = body;

    if (!type || !formData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const notification = {
      type,
      timestamp: new Date().toISOString(),
      formData,
      reportData,
      contactInfo,
      investmentInfo,
    };

    // In production: connect to SendGrid/Resend/Nodemailer
    // Data is captured server-side automatically — no user action needed
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
