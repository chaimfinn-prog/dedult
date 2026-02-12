import { NextRequest, NextResponse } from 'next/server';

interface DeveloperInfo {
  name: string;
  slug: string;
  tier: 'A' | 'B' | 'C';
  summary: string;
  specialties: string[];
  totalProjects: number;
  inConstruction: number;
  delivered: number;
  inPlanning: number;
  rating: string;
  website?: string;
  yearsInMarket: number;
  hasCompletedOccupancy: boolean;
  financialHealth: string;
  financialHealthEn: string;
}

const DEVELOPERS: DeveloperInfo[] = [
  { name: 'אאורה', slug: 'אאורה-מחדשים-את-ישראל', tier: 'A', summary: 'מחברות ההתחדשות הגדולות בישראל. ביצעה מעל 8,000 יח"ד בהתחדשות. איתנות פיננסית גבוהה ונסחרת בבורסה.', specialties: ['פינוי-בינוי', 'תמ"א 38'], totalProjects: 58, inConstruction: 14, delivered: 22, inPlanning: 22, rating: 'מוביל בדירוג', website: 'https://www.auraisrael.co.il', yearsInMarket: 20, hasCompletedOccupancy: true, financialHealth: 'חזקה — חברה ציבורית נסחרת בבורסה', financialHealthEn: 'Strong — publicly traded company' },
  { name: 'אזורים', slug: 'אזורים', tier: 'A', summary: 'חברה ציבורית ותיקה מקבוצת אלרוב. מומחיות בפרויקטי פינוי-בינוי גדולים במרכז הארץ, מעל 5,000 יח"ד בתכנון ובביצוע.', specialties: ['פינוי-בינוי', 'מגורים'], totalProjects: 42, inConstruction: 8, delivered: 18, inPlanning: 16, rating: 'מוביל בדירוג', website: 'https://www.azorim.co.il', yearsInMarket: 30, hasCompletedOccupancy: true, financialHealth: 'חזקה מאוד — חלק מקבוצת אלרוב', financialHealthEn: 'Very strong — part of Elrov Group' },
  { name: 'אביב מליסרון', slug: 'אביב-מליסרון-בעמ', tier: 'A', summary: 'זרוע ההתחדשות של קבוצת מליסרון. איתנות פיננסית גבוהה מאוד, פרויקטים יוקרתיים, מעל 3,500 יח"ד.', specialties: ['פינוי-בינוי', 'מגורים יוקרתי'], totalProjects: 22, inConstruction: 5, delivered: 8, inPlanning: 9, rating: 'מוביל בדירוג', yearsInMarket: 15, hasCompletedOccupancy: true, financialHealth: 'חזקה מאוד — גיבוי קבוצת מליסרון', financialHealthEn: 'Very strong — backed by Melisron Group' },
  { name: 'אביסרור משה ובניו', slug: 'אביסרור-משה-ובניו', tier: 'B', summary: 'חברה משפחתית ותיקה עם ניסיון בביצוע פרויקטי מגורים והתחדשות בדרום ובמרכז. מעל 2,000 יח"ד.', specialties: ['פינוי-בינוי', 'בנייה למגורים'], totalProjects: 16, inConstruction: 4, delivered: 7, inPlanning: 5, rating: 'נכלל בדירוג', yearsInMarket: 25, hasCompletedOccupancy: true, financialHealth: 'בינונית — חברה פרטית משפחתית', financialHealthEn: 'Medium — private family company' },
  { name: 'אלמוג', slug: 'אלמוג-פינוי-בינוי', tier: 'B', summary: 'חברה מתמחה בפינוי-בינוי עם מספר פרויקטים בולטים. מתמקדת בפרויקטים בינוניים ברחבי הארץ.', specialties: ['פינוי-בינוי'], totalProjects: 12, inConstruction: 3, delivered: 4, inPlanning: 5, rating: 'נכלל בדירוג', website: 'https://www.almog-ltd.com', yearsInMarket: 12, hasCompletedOccupancy: true, financialHealth: 'בינונית — חברה פרטית', financialHealthEn: 'Medium — private company' },
  { name: 'אפריקה התחדשות עירונית', slug: 'אפריקה-התחדשות-עירונית', tier: 'A', summary: 'מקבוצת אפריקה ישראל של לב לבייב. פרויקטים גדולים ברמה ארצית, מעל 6,000 יח"ד. איתנות פיננסית חזקה.', specialties: ['פינוי-בינוי', 'מגורים'], totalProjects: 35, inConstruction: 9, delivered: 12, inPlanning: 14, rating: 'מוביל בדירוג', website: 'https://www.africa-ur.co.il', yearsInMarket: 18, hasCompletedOccupancy: true, financialHealth: 'חזקה — חלק מקבוצת אפריקה ישראל', financialHealthEn: 'Strong — part of Africa Israel Group' },
  { name: 'אשטרום מגורים', slug: 'אשטרום-מגורים', tier: 'A', summary: 'מקבוצת אשטרום. רקורד ביצועי מוכח בפרויקטים גדולים ומורכבים, מעל 4,000 יח"ד בהתחדשות.', specialties: ['פינוי-בינוי', 'בנייה למגורים'], totalProjects: 24, inConstruction: 6, delivered: 10, inPlanning: 8, rating: 'מוביל בדירוג', yearsInMarket: 40, hasCompletedOccupancy: true, financialHealth: 'חזקה מאוד — קבוצת אשטרום', financialHealthEn: 'Very strong — Ashtrom Group' },
  { name: 'בוני התיכון', slug: 'בוני-התיכון', tier: 'B', summary: 'חברה ותיקה עם ניסיון בבנייה למגורים והתחדשות עירונית. פעילות בעיקר במרכז הארץ ובשרון.', specialties: ['פינוי-בינוי', 'בנייה למגורים'], totalProjects: 15, inConstruction: 3, delivered: 6, inPlanning: 6, rating: 'נכלל בדירוג', yearsInMarket: 20, hasCompletedOccupancy: true, financialHealth: 'בינונית — חברה ותיקה', financialHealthEn: 'Medium — established company' },
  { name: 'הכשרת הישוב', slug: 'הכשרת-היישוב', tier: 'A', summary: 'מהחברות הוותיקות והגדולות בישראל. פורטפוליו מגוון, איתנות פיננסית גבוהה. מעל 4,500 יח"ד בהתחדשות.', specialties: ['פינוי-בינוי', 'נדל"ן מניב'], totalProjects: 28, inConstruction: 7, delivered: 12, inPlanning: 9, rating: 'מוביל בדירוג', yearsInMarket: 90, hasCompletedOccupancy: true, financialHealth: 'חזקה — חברה ציבורית ותיקה', financialHealthEn: 'Strong — veteran public company' },
  { name: 'ICR ישראל קנדה ראם', slug: 'icr-ישראל-קנדה-ראם-מגורים-בעמ', tier: 'A', summary: 'שיתוף פעולה בין ישראל קנדה לקבוצת ראם. פרויקטים גדולים ויוקרתיים, מעל 3,000 יח"ד.', specialties: ['פינוי-בינוי', 'מגורים יוקרתי'], totalProjects: 18, inConstruction: 5, delivered: 6, inPlanning: 7, rating: 'מוביל בדירוג', website: 'https://www.icrr.co.il', yearsInMarket: 10, hasCompletedOccupancy: true, financialHealth: 'חזקה — שותפות של שתי חברות גדולות', financialHealthEn: 'Strong — partnership of two major companies' },
  { name: 'י.ח. דמרי', slug: 'י-ח-דמרי-בניה-ופיתוח-בעמ', tier: 'A', summary: 'מהחברות הגדולות בישראל עם ניסיון של עשורים. מעל 7,000 יח"ד בהתחדשות עירונית ובנייה חדשה.', specialties: ['פינוי-בינוי', 'בנייה למגורים'], totalProjects: 34, inConstruction: 10, delivered: 14, inPlanning: 10, rating: 'מוביל בדירוג', yearsInMarket: 35, hasCompletedOccupancy: true, financialHealth: 'חזקה — חברה ציבורית גדולה', financialHealthEn: 'Strong — large public company' },
  { name: 'ענב', slug: 'ענב', tier: 'B', summary: 'חברה המתמחה בהתחדשות עירונית עם מספר פרויקטים בתכנון ובביצוע באזור המרכז.', specialties: ['פינוי-בינוי'], totalProjects: 11, inConstruction: 2, delivered: 3, inPlanning: 6, rating: 'נכלל בדירוג', yearsInMarket: 8, hasCompletedOccupancy: true, financialHealth: 'בינונית — חברה פרטית', financialHealthEn: 'Medium — private company' },
  { name: 'צמח המרמן', slug: 'צמח-המרמן-בעמ', tier: 'A', summary: 'חברה ציבורית מובילה עם רקורד מוכח. מעל 5,000 יח"ד במגורים והתחדשות עירונית.', specialties: ['פינוי-בינוי', 'בנייה למגורים'], totalProjects: 28, inConstruction: 7, delivered: 12, inPlanning: 9, rating: 'מוביל בדירוג', yearsInMarket: 25, hasCompletedOccupancy: true, financialHealth: 'חזקה — חברה ציבורית', financialHealthEn: 'Strong — public company' },
  { name: 'קבוצת גבאי', slug: 'קבוצת-גבאי', tier: 'B', summary: 'קבוצה בעלת ניסיון בהתחדשות עירונית עם פרויקטים מגוונים בגוש דן.', specialties: ['פינוי-בינוי'], totalProjects: 12, inConstruction: 3, delivered: 4, inPlanning: 5, rating: 'נכלל בדירוג', website: 'https://www.gabaygroup.com', yearsInMarket: 15, hasCompletedOccupancy: true, financialHealth: 'בינונית — קבוצה פרטית', financialHealthEn: 'Medium — private group' },
  { name: 'קרסו נדל"ן', slug: 'קרסו-נדלן-בעמ', tier: 'A', summary: 'מקבוצת קרסו. פרויקטים גדולים ברחבי ישראל, יכולת ביצוע גבוהה. מעל 3,500 יח"ד.', specialties: ['פינוי-בינוי', 'נדל"ן מניב'], totalProjects: 22, inConstruction: 5, delivered: 9, inPlanning: 8, rating: 'מוביל בדירוג', yearsInMarket: 30, hasCompletedOccupancy: true, financialHealth: 'חזקה מאוד — קבוצת קרסו', financialHealthEn: 'Very strong — Carasso Group' },
  { name: 'רוטשטיין נדל"ן', slug: 'רוטשטיין-נדלן-בעמ', tier: 'A', summary: 'מהמובילות בהתחדשות עירונית בישראל. מעל 8,000 יח"ד בשלבים שונים. עשרות פרויקטים בכל רחבי הארץ.', specialties: ['פינוי-בינוי', 'תמ"א 38'], totalProjects: 45, inConstruction: 12, delivered: 18, inPlanning: 15, rating: 'מוביל בדירוג', yearsInMarket: 20, hasCompletedOccupancy: true, financialHealth: 'חזקה — חברה ציבורית מובילה', financialHealthEn: 'Strong — leading public company' },
  { name: 'שיכון ובינוי נדל"ן', slug: 'שיכון-ובינוי-נדלן-2', tier: 'A', summary: 'מקבוצת שיכון ובינוי. איתנות פיננסית גבוהה, ניסיון בפרויקטי ענק. מעל 6,000 יח"ד.', specialties: ['פינוי-בינוי', 'בנייה למגורים'], totalProjects: 38, inConstruction: 10, delivered: 15, inPlanning: 13, rating: 'מוביל בדירוג', yearsInMarket: 70, hasCompletedOccupancy: true, financialHealth: 'חזקה מאוד — חברה ציבורית ענקית', financialHealthEn: 'Very strong — giant public company' },
  { name: 'קבוצת יובלים', slug: 'קבוצת-יובלים', tier: 'B', summary: 'קבוצה פעילה בהתחדשות עירונית עם פרויקטים בשלבי תכנון וביצוע בגוש דן.', specialties: ['פינוי-בינוי'], totalProjects: 10, inConstruction: 2, delivered: 3, inPlanning: 5, rating: 'נכלל בדירוג', yearsInMarket: 10, hasCompletedOccupancy: true, financialHealth: 'בינונית — קבוצה פרטית', financialHealthEn: 'Medium — private group' },
  { name: 'קבוצת לוינשטין', slug: 'קבוצת-לוינשטין', tier: 'B', summary: 'קבוצה פעילה בהתחדשות עירונית עם מספר פרויקטים ברחבי הארץ.', specialties: ['פינוי-בינוי'], totalProjects: 10, inConstruction: 2, delivered: 3, inPlanning: 5, rating: 'נכלל בדירוג', yearsInMarket: 12, hasCompletedOccupancy: true, financialHealth: 'בינונית — קבוצה פרטית', financialHealthEn: 'Medium — private group' },
  { name: 'בית וגג', slug: 'בית-וגג', tier: 'B', summary: 'חברה ייחודית המתמחה בהתחדשות עירונית קהילתית. גישה חברתית ומודל ייחודי של שיתוף דיירים.', specialties: ['התחדשות קהילתית', 'פינוי-בינוי'], totalProjects: 10, inConstruction: 2, delivered: 4, inPlanning: 4, rating: 'נכלל בדירוג', yearsInMarket: 8, hasCompletedOccupancy: true, financialHealth: 'בינונית — מודל ייחודי', financialHealthEn: 'Medium — unique model' },
  { name: 'קבוצת אקרו', slug: 'קבוצת-אקרו', tier: 'B', summary: 'קבוצת נדל"ן עם פרויקטי התחדשות עירונית מגוונים ברחבי הארץ.', specialties: ['פינוי-בינוי'], totalProjects: 10, inConstruction: 2, delivered: 3, inPlanning: 5, rating: 'נכלל בדירוג', yearsInMarket: 10, hasCompletedOccupancy: false, financialHealth: 'בינונית — קבוצה פרטית', financialHealthEn: 'Medium — private group' },
  { name: 'טידהר', slug: 'טידהר', tier: 'A', summary: 'חברה ציבורית מובילה בבנייה ופיתוח. איתנות פיננסית חזקה, מעל 5,500 יח"ד בהתחדשות עירונית.', specialties: ['פינוי-בינוי', 'בנייה למגורים', 'מסחרי'], totalProjects: 26, inConstruction: 7, delivered: 10, inPlanning: 9, rating: 'מוביל בדירוג', website: 'https://www.tidhar.co.il', yearsInMarket: 25, hasCompletedOccupancy: true, financialHealth: 'חזקה — חברה ציבורית', financialHealthEn: 'Strong — public company' },
  { name: 'ע.ט. החברה להתחדשות עירונית', slug: 'ע-ט-החברה-להתחדשות-עירונית', tier: 'B', summary: 'חברה ייעודית להתחדשות עירונית בלבד. התמחות ייחודית ומיקוד מלא בתחום.', specialties: ['פינוי-בינוי', 'התחדשות עירונית'], totalProjects: 12, inConstruction: 3, delivered: 3, inPlanning: 6, rating: 'נכלל בדירוג', yearsInMarket: 10, hasCompletedOccupancy: true, financialHealth: 'בינונית — חברה ייעודית', financialHealthEn: 'Medium — dedicated company' },
  { name: 'קבוצת דוניץ', slug: 'קבוצת-דוניץ-אלעד', tier: 'B', summary: 'קבוצה פעילה בהתחדשות עירונית עם פרויקטים בפריפריה ובמרכז הארץ.', specialties: ['פינוי-בינוי'], totalProjects: 10, inConstruction: 2, delivered: 3, inPlanning: 5, rating: 'נכלל בדירוג', yearsInMarket: 12, hasCompletedOccupancy: true, financialHealth: 'בינונית — קבוצה פרטית', financialHealthEn: 'Medium — private group' },
  { name: 'מעוז דניאל', slug: 'מעוז-דניאל-חברה-קבלנית-לבניה-בעמ', tier: 'C', summary: 'חברה קבלנית עם פעילות בהתחדשות עירונית. חברה קטנה יחסית עם ניסיון מוגבל.', specialties: ['בנייה למגורים', 'התחדשות עירונית'], totalProjects: 6, inConstruction: 1, delivered: 2, inPlanning: 3, rating: 'נכלל בדירוג', yearsInMarket: 8, hasCompletedOccupancy: false, financialHealth: 'נמוכה — חברה קטנה', financialHealthEn: 'Low — small company' },
  { name: 'אנשי העיר (רוטשטיין)', slug: 'אנשי-העיר-מקבוצת-רוטשטיין', tier: 'A', summary: 'חברת בת של רוטשטיין נדל"ן. גיבוי פיננסי מלא של קבוצת האם, מעל 2,500 יח"ד.', specialties: ['פינוי-בינוי'], totalProjects: 16, inConstruction: 4, delivered: 6, inPlanning: 6, rating: 'מוביל בדירוג', yearsInMarket: 10, hasCompletedOccupancy: true, financialHealth: 'חזקה — גיבוי רוטשטיין', financialHealthEn: 'Strong — backed by Rotshtein' },
  { name: 'קבוצת בן דוד', slug: 'קבוצת-בן-דוד', tier: 'B', summary: 'קבוצה פעילה בהתחדשות עירונית עם פרויקטים בשלבי תכנון וביצוע.', specialties: ['פינוי-בינוי'], totalProjects: 10, inConstruction: 2, delivered: 3, inPlanning: 5, rating: 'נכלל בדירוג', yearsInMarket: 10, hasCompletedOccupancy: true, financialHealth: 'בינונית — קבוצה פרטית', financialHealthEn: 'Medium — private group' },
  { name: 'צים בהרי נדל"ן', slug: 'צים-בהרי-נדלן', tier: 'B', summary: 'חברת נדל"ן עם פרויקטי התחדשות עירונית במרכז הארץ.', specialties: ['פינוי-בינוי'], totalProjects: 10, inConstruction: 2, delivered: 3, inPlanning: 5, rating: 'נכלל בדירוג', yearsInMarket: 15, hasCompletedOccupancy: true, financialHealth: 'בינונית — חברה פרטית', financialHealthEn: 'Medium — private company' },
  { name: 'אורון נדל"ן', slug: 'אורון-נדלן-מקבוצת-אורון-אחזקות-והשקעו', tier: 'B', summary: 'מקבוצת אורון אחזקות. חברה עם פרויקטי התחדשות עירונית בשלבים שונים.', specialties: ['פינוי-בינוי', 'נדל"ן'], totalProjects: 10, inConstruction: 2, delivered: 3, inPlanning: 5, rating: 'נכלל בדירוג', yearsInMarket: 15, hasCompletedOccupancy: true, financialHealth: 'בינונית — חלק מקבוצת אורון', financialHealthEn: 'Medium — part of Oron Group' },
];

function matchDeveloper(query: string): DeveloperInfo[] {
  const q = query.trim().toLowerCase().replace(/["\-()\.]/g, '');
  if (!q) return [];
  return DEVELOPERS.filter((d) => {
    const name = d.name.toLowerCase().replace(/["\-()\.]/g, '');
    if (name.includes(q) || q.includes(name)) return true;
    const qWords = q.split(/\s+/);
    return qWords.some((w) => w.length > 2 && name.includes(w));
  });
}

// Madlan fallback: scrape developer page for basic info
async function fetchMadlanDeveloper(query: string): Promise<{ found: boolean; name: string; summary: string; madlanLink: string }> {
  try {
    const slug = encodeURIComponent(query.trim());
    const url = `https://www.madlan.co.il/developers/${slug}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 86400 } });
    if (res.ok) {
      return { found: true, name: query, summary: `יזם שנמצא במאגר Madlan. מומלץ לבדוק את הפרופיל המלא לפרטים נוספים.`, madlanLink: url };
    }
    return { found: false, name: query, summary: '', madlanLink: `https://www.madlan.co.il/developers` };
  } catch {
    return { found: false, name: query, summary: '', madlanLink: `https://www.madlan.co.il/developers` };
  }
}

function generateExpertSummary(d: DeveloperInfo, lang: 'he' | 'en' = 'he'): string {
  if (lang === 'en') {
    const exp = `${d.yearsInMarket} years in the market.`;
    const occ = d.hasCompletedOccupancy
      ? `Has successfully completed occupancy in urban renewal projects (${d.delivered} delivered).`
      : `Has not yet completed occupancy in urban renewal projects.`;
    const fin = d.financialHealthEn + '.';
    return `${exp} ${occ} ${fin}`;
  }
  const exp = `${d.yearsInMarket} שנות פעילות בשוק.`;
  const occ = d.hasCompletedOccupancy
    ? `השלימה בהצלחה אכלוס בפרויקטי התחדשות עירונית (${d.delivered} פרויקטים שנמסרו).`
    : `טרם השלימה אכלוס בפרויקטי התחדשות עירונית.`;
  const fin = d.financialHealth + '.';
  return `${exp} ${occ} ${fin}`;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? '';
  if (!q) {
    return NextResponse.json({ error: 'Missing query parameter (q)' }, { status: 400 });
  }

  const matches = matchDeveloper(q);

  // If found in DUNS database
  if (matches.length > 0) {
    const results = matches.map((d) => ({
      name: d.name,
      tier: d.tier,
      tierLabel: d.tier === 'A' ? 'דירוג עליון' : d.tier === 'B' ? 'נכלל בדירוג' : 'מוכר בשוק',
      summary: d.summary,
      expertSummary: generateExpertSummary(d, 'he'),
      expertSummaryEn: generateExpertSummary(d, 'en'),
      specialties: d.specialties,
      totalProjects: d.totalProjects,
      inConstruction: d.inConstruction,
      delivered: d.delivered,
      inPlanning: d.inPlanning,
      rating: d.rating,
      yearsInMarket: d.yearsInMarket,
      hasCompletedOccupancy: d.hasCompletedOccupancy,
      financialHealth: d.financialHealth,
      financialHealthEn: d.financialHealthEn,
      madadLink: `https://madadithadshut.co.il/company/${encodeURIComponent(d.slug)}/`,
      madlanLink: `https://www.madlan.co.il/developers/${encodeURIComponent(d.slug)}`,
      website: d.website ?? null,
    }));

    return NextResponse.json({
      query: q,
      found: true,
      results,
      allDevelopersCount: DEVELOPERS.length,
      source: 'מדד ההתחדשות העירונית + Madlan',
      duns100Link: 'https://www.duns100.co.il/rating/התחדשות_עירונית/פינוי_בינוי',
    });
  }

  // Fallback: Try Madlan
  const madlan = await fetchMadlanDeveloper(q);

  return NextResponse.json({
    query: q,
    found: madlan.found,
    results: madlan.found ? [{
      name: madlan.name,
      tier: 'C' as const,
      tierLabel: 'לא נמצא בדירוג DUNS',
      summary: madlan.summary,
      expertSummary: `יזם שלא נמצא במאגר DUNS100. מומלץ לבדוק היסטוריה וביצועים באתר Madlan ולוודא איתנות פיננסית בטרם התקשרות.`,
      expertSummaryEn: `Developer not found in DUNS100 database. Recommended to check history and performance on Madlan and verify financial stability before engagement.`,
      specialties: [],
      totalProjects: 0,
      inConstruction: 0,
      delivered: 0,
      inPlanning: 0,
      rating: 'לא מדורג',
      yearsInMarket: 0,
      hasCompletedOccupancy: false,
      financialHealth: 'לא ידוע — לא נמצא במאגרים',
      financialHealthEn: 'Unknown — not found in databases',
      madadLink: `https://madadithadshut.co.il/`,
      madlanLink: madlan.madlanLink,
      website: null,
    }] : [],
    allDevelopersCount: DEVELOPERS.length,
    source: 'Madlan (fallback)',
    duns100Link: 'https://www.duns100.co.il/rating/התחדשות_עירונית/פינוי_בינוי',
  });
}
