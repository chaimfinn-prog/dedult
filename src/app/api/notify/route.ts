import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, formData, reportData, contactInfo, investmentInfo } = body;

    if (!type || !formData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Format notification
    const notification = {
      type,
      timestamp: new Date().toISOString(),
      formData,
      reportData,
      contactInfo,
      investmentInfo,
    };

    // In production, connect to SendGrid/Resend/etc.
    // For now, log the notification for server-side collection
    console.log('=== REALITY CHECK — NEW LEAD ===');
    console.log(JSON.stringify(notification, null, 2));
    console.log('================================');

    const subject = type === 'consultation'
      ? 'פנייה חדשה — פגישת ייעוץ'
      : type === 'detailedReport'
        ? 'פנייה חדשה — דוח מפורט (750 ₪)'
        : 'פנייה חדשה — תיווך להשקעה';

    const emailBody = formatEmailBody(notification);

    return NextResponse.json({
      success: true,
      message: 'Notification recorded',
      mailto: `mailto:contact@haim-checkup.co.il?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to process notification', detail: String(err) }, { status: 500 });
  }
}

function formatEmailBody(n: { type: string; formData: Record<string, string>; reportData?: { certainty: number; years: number; gap: number | null }; contactInfo?: { name: string; phone: string; email: string }; investmentInfo?: { budget: string; city: string; years: string } | null }): string {
  const { type, formData, reportData, contactInfo, investmentInfo } = n;
  const typeLabel = type === 'consultation' ? 'פגישת ייעוץ' : type === 'detailedReport' ? 'דוח מפורט (750 ₪)' : 'תיווך להשקעה';

  let body = `סוג פנייה: ${typeLabel}\n\n`;

  body += '=== פרטי הפרויקט ===\n';
  body += `סוג: ${formData.projectType === 'pinui' ? 'פינוי-בינוי' : 'תמ"א 38/2'}\n`;
  body += `שם יזם/מוכר: ${formData.developerName || 'לא הוזן'}\n`;
  body += `שם פרויקט: ${formData.projectName || 'לא הוזן'}\n`;
  body += `כתובת: ${formData.address || 'לא הוזן'}\n`;
  body += `מחיר: ${formData.price || 'לא הוזן'} ₪\n`;
  body += `שכ"ד: ${formData.rent || 'לא הוזן'} ₪\n`;
  body += `גודל דירה: ${formData.apartmentSize || 'לא הוזן'} מ"ר\n`;
  body += `תוספת מ"ר: ${formData.sqmAddition || 'לא הוזן'}\n`;
  body += `סטטוס תכנוני: ${formData.planningStatus}\n`;
  body += `התנגדות/ערר: ${formData.objection || 'אין'}\n`;
  body += `חתימות: ${formData.signatureStatus}\n`;
  body += `מה נאמר — שנים להריסה: ${formData.toldYears || 'לא הוזן'}\n`;

  if (reportData) {
    body += '\n=== תוצאות הדוח ===\n';
    body += `ציון וודאות: ${reportData.certainty}%\n`;
    body += `זמן ריאלי להריסה: ${reportData.years} שנים\n`;
    body += `פער: ${reportData.gap !== null ? `${reportData.gap > 0 ? '+' : ''}${reportData.gap} שנים` : 'לא חושב'}\n`;
  }

  if (contactInfo) {
    body += '\n=== פרטי קשר ===\n';
    body += `שם: ${contactInfo.name}\n`;
    body += `טלפון: ${contactInfo.phone}\n`;
    body += `אימייל: ${contactInfo.email}\n`;
  }

  if (investmentInfo) {
    body += '\n=== פרטי השקעה ===\n';
    body += `תקציב: ${investmentInfo.budget} ₪\n`;
    body += `עיר מבוקשת: ${investmentInfo.city}\n`;
    body += `תקופת השקעה: ${investmentInfo.years} שנים\n`;
  }

  return body;
}
