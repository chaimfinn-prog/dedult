import { NextRequest, NextResponse } from 'next/server';

// Curated developer database from madadithadshut.co.il urban renewal index
// Data sourced from מדד ההתחדשות העירונית - public rating of urban renewal developers
interface DeveloperInfo {
  name: string;
  slug: string;
  tier: 'A' | 'B' | 'C';
  summary: string;
  specialties: string[];
  projectCount: string;
  rating: string;
  website?: string;
}

const DEVELOPERS: DeveloperInfo[] = [
  { name: 'אאורה', slug: 'אאורה-מחדשים-את-ישראל', tier: 'A', summary: 'מחברות ההתחדשות העירונית הגדולות בישראל עם עשרות פרויקטים בביצוע ובתכנון ברחבי הארץ.', specialties: ['פינוי-בינוי', 'תמ"א 38'], projectCount: '50+', rating: 'מוביל בדירוג', website: 'https://www.auraisrael.co.il' },
  { name: 'אזורים', slug: 'אזורים', tier: 'A', summary: 'חברה ציבורית ותיקה עם מומחיות בפרויקטי פינוי-בינוי גדולים. פעילות נרחבת במרכז הארץ.', specialties: ['פינוי-בינוי', 'מגורים'], projectCount: '40+', rating: 'מוביל בדירוג', website: 'https://www.azorim.co.il' },
  { name: 'אביב מליסרון', slug: 'אביב-מליסרון-בעמ', tier: 'A', summary: 'מקבוצת מליסרון. חברת נדל"ן מובילה עם פרויקטי התחדשות עירונית גדולים ואיתנות פיננסית גבוהה.', specialties: ['פינוי-בינוי', 'מגורים יוקרתי'], projectCount: '20+', rating: 'מוביל בדירוג' },
  { name: 'אביסרור', slug: 'אביסרור-משה-ובניו', tier: 'B', summary: 'חברה משפחתית ותיקה עם ניסיון בביצוע פרויקטי מגורים והתחדשות עירונית בדרום ובמרכז.', specialties: ['פינוי-בינוי', 'בנייה למגורים'], projectCount: '15+', rating: 'נכלל בדירוג' },
  { name: 'אלמוג', slug: 'אלמוג-פינוי-בינוי', tier: 'B', summary: 'חברה המתמחה בפינוי-בינוי עם מספר פרויקטים בולטים ברחבי הארץ.', specialties: ['פינוי-בינוי'], projectCount: '10+', rating: 'נכלל בדירוג', website: 'https://www.almog-ltd.com' },
  { name: 'אפריקה התחדשות עירונית', slug: 'אפריקה-התחדשות-עירונית', tier: 'A', summary: 'מקבוצת אפריקה ישראל. חברה מובילה עם פרויקטים גדולים ברמה הארצית ואיתנות פיננסית חזקה.', specialties: ['פינוי-בינוי', 'מגורים'], projectCount: '30+', rating: 'מוביל בדירוג', website: 'https://www.africa-ur.co.il' },
  { name: 'אשטרום מגורים', slug: 'אשטרום-מגורים', tier: 'A', summary: 'מקבוצת אשטרום. חברה עם רקורד ביצועי מוכח בפרויקטים גדולים ומורכבים.', specialties: ['פינוי-בינוי', 'בנייה למגורים'], projectCount: '20+', rating: 'מוביל בדירוג' },
  { name: 'בוני התיכון', slug: 'בוני-התיכון', tier: 'B', summary: 'חברה ותיקה עם ניסיון בבנייה למגורים והתחדשות עירונית. פעילות בעיקר במרכז הארץ.', specialties: ['פינוי-בינוי', 'בנייה למגורים'], projectCount: '15+', rating: 'נכלל בדירוג' },
  { name: 'הכשרת הישוב', slug: 'הכשרת-היישוב', tier: 'A', summary: 'מהחברות הוותיקות בישראל. פעילה בהתחדשות עירונית עם פורטפוליו מגוון ואיתנות פיננסית.', specialties: ['פינוי-בינוי', 'נדל"ן מניב'], projectCount: '25+', rating: 'מוביל בדירוג' },
  { name: 'ICR ישראל קנדה ראם', slug: 'icr-ישראל-קנדה-ראם-מגורים-בעמ', tier: 'A', summary: 'שיתוף פעולה בין ישראל קנדה לקבוצת ראם. חברה מובילה עם פרויקטים גדולים ברמה גבוהה.', specialties: ['פינוי-בינוי', 'מגורים יוקרתי'], projectCount: '15+', rating: 'מוביל בדירוג', website: 'https://www.icrr.co.il' },
  { name: 'י.ח. דמרי', slug: 'י-ח-דמרי-בניה-ופיתוח-בעמ', tier: 'A', summary: 'מחברות הבנייה הגדולות בישראל עם ניסיון עשיר בפרויקטי מגורים והתחדשות עירונית ברחבי הארץ.', specialties: ['פינוי-בינוי', 'בנייה למגורים'], projectCount: '30+', rating: 'מוביל בדירוג' },
  { name: 'ענב', slug: 'ענב', tier: 'B', summary: 'חברה המתמחה בהתחדשות עירונית עם מספר פרויקטים בתכנון ובביצוע.', specialties: ['פינוי-בינוי'], projectCount: '10+', rating: 'נכלל בדירוג' },
  { name: 'צמח המרמן', slug: 'צמח-המרמן-בעמ', tier: 'A', summary: 'חברה ציבורית מובילה בתחום המגורים וההתחדשות העירונית עם רקורד ביצוע מוכח.', specialties: ['פינוי-בינוי', 'בנייה למגורים'], projectCount: '25+', rating: 'מוביל בדירוג' },
  { name: 'קבוצת גבאי', slug: 'קבוצת-גבאי', tier: 'B', summary: 'קבוצה בעלת ניסיון בתחום ההתחדשות העירונית עם פרויקטים מגוונים.', specialties: ['פינוי-בינוי'], projectCount: '10+', rating: 'נכלל בדירוג', website: 'https://www.gabaygroup.com' },
  { name: 'קרסו נדל"ן', slug: 'קרסו-נדלן-בעמ', tier: 'A', summary: 'חברה מובילה מקבוצת קרסו עם פרויקטים גדולים ברחבי ישראל ויכולת ביצוע גבוהה.', specialties: ['פינוי-בינוי', 'נדל"ן מניב'], projectCount: '20+', rating: 'מוביל בדירוג' },
  { name: 'רוטשטיין נדל"ן', slug: 'רוטשטיין-נדלן-בעמ', tier: 'A', summary: 'מהחברות המובילות בהתחדשות עירונית בישראל עם עשרות פרויקטים בשלבים שונים.', specialties: ['פינוי-בינוי', 'תמ"א 38'], projectCount: '40+', rating: 'מוביל בדירוג' },
  { name: 'שיכון ובינוי נדל"ן', slug: 'שיכון-ובינוי-נדלן-2', tier: 'A', summary: 'מקבוצת שיכון ובינוי. חברה בעלת איתנות פיננסית גבוהה וניסיון עשיר בפרויקטי ענק.', specialties: ['פינוי-בינוי', 'בנייה למגורים'], projectCount: '35+', rating: 'מוביל בדירוג' },
  { name: 'קבוצת יובלים', slug: 'קבוצת-יובלים', tier: 'B', summary: 'קבוצה פעילה בתחום ההתחדשות העירונית עם פרויקטים בשלבי תכנון וביצוע.', specialties: ['פינוי-בינוי'], projectCount: '10+', rating: 'נכלל בדירוג' },
  { name: 'קבוצת לוינשטין', slug: 'קבוצת-לוינשטין', tier: 'B', summary: 'קבוצה פעילה בתחום ההתחדשות העירונית עם מספר פרויקטים ברחבי הארץ.', specialties: ['פינוי-בינוי'], projectCount: '10+', rating: 'נכלל בדירוג' },
  { name: 'בית וגג', slug: 'בית-וגג', tier: 'B', summary: 'חברה המתמחה בפרויקטי התחדשות עירונית קהילתית בגישה ייחודית.', specialties: ['התחדשות קהילתית', 'פינוי-בינוי'], projectCount: '10+', rating: 'נכלל בדירוג' },
  { name: 'קבוצת אקרו', slug: 'קבוצת-אקרו', tier: 'B', summary: 'קבוצת נדל"ן עם פרויקטי התחדשות עירונית מגוונים ברחבי הארץ.', specialties: ['פינוי-בינוי'], projectCount: '10+', rating: 'נכלל בדירוג' },
  { name: 'טידהר', slug: 'טידהר', tier: 'A', summary: 'חברה מובילה בבנייה ופיתוח עם פרויקטים גדולים. חברה ציבורית בעלת איתנות פיננסית חזקה.', specialties: ['פינוי-בינוי', 'בנייה למגורים', 'מסחרי'], projectCount: '20+', rating: 'מוביל בדירוג', website: 'https://www.tidhar.co.il' },
  { name: 'ע.ט. החברה להתחדשות עירונית', slug: 'ע-ט-החברה-להתחדשות-עירונית', tier: 'B', summary: 'חברה המתמחה באופן בלעדי בהתחדשות עירונית עם ניסיון ייעודי בתחום.', specialties: ['פינוי-בינוי', 'התחדשות עירונית'], projectCount: '10+', rating: 'נכלל בדירוג' },
  { name: 'קבוצת דוניץ', slug: 'קבוצת-דוניץ-אלעד', tier: 'B', summary: 'קבוצה פעילה בתחום ההתחדשות העירונית עם פרויקטים בפריפריה ובמרכז.', specialties: ['פינוי-בינוי'], projectCount: '10+', rating: 'נכלל בדירוג' },
  { name: 'מעוז דניאל', slug: 'מעוז-דניאל-חברה-קבלנית-לבניה-בעמ', tier: 'C', summary: 'חברה קבלנית המתמחה בבנייה עם פעילות בהתחדשות עירונית.', specialties: ['בנייה למגורים', 'התחדשות עירונית'], projectCount: '5+', rating: 'נכלל בדירוג' },
  { name: 'אנשי העיר (רוטשטיין)', slug: 'אנשי-העיר-מקבוצת-רוטשטיין', tier: 'A', summary: 'חברת בת של רוטשטיין נדל"ן. מתמחה בהתחדשות עירונית עם גיבוי פיננסי של קבוצת האם.', specialties: ['פינוי-בינוי'], projectCount: '15+', rating: 'מוביל בדירוג' },
  { name: 'קבוצת בן דוד', slug: 'קבוצת-בן-דוד', tier: 'B', summary: 'קבוצה פעילה בתחום ההתחדשות העירונית עם פרויקטים בשלבי תכנון וביצוע.', specialties: ['פינוי-בינוי'], projectCount: '10+', rating: 'נכלל בדירוג' },
  { name: 'צים בהרי נדל"ן', slug: 'צים-בהרי-נדלן', tier: 'B', summary: 'חברת נדל"ן עם פרויקטי התחדשות עירונית. פעילות במרכז הארץ.', specialties: ['פינוי-בינוי'], projectCount: '10+', rating: 'נכלל בדירוג' },
  { name: 'אורון נדל"ן', slug: 'אורון-נדלן-מקבוצת-אורון-אחזקות-והשקעו', tier: 'B', summary: 'מקבוצת אורון אחזקות. חברה עם פרויקטי התחדשות עירונית בשלבים שונים.', specialties: ['פינוי-בינוי', 'נדל"ן'], projectCount: '10+', rating: 'נכלל בדירוג' },
];

// Fuzzy search - match developer name with flexibility
function matchDeveloper(query: string): DeveloperInfo[] {
  const q = query.trim().toLowerCase().replace(/["\-()]/g, '');
  if (!q) return [];

  return DEVELOPERS.filter((d) => {
    const name = d.name.toLowerCase().replace(/["\-()]/g, '');
    // Exact or contains match
    if (name.includes(q) || q.includes(name)) return true;
    // Match any word
    const qWords = q.split(/\s+/);
    return qWords.some((w) => w.length > 2 && name.includes(w));
  });
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? '';

  if (!q) {
    return NextResponse.json({ error: 'Missing query parameter (q)' }, { status: 400 });
  }

  const matches = matchDeveloper(q);

  const results = matches.map((d) => ({
    name: d.name,
    tier: d.tier,
    tierLabel: d.tier === 'A' ? 'דירוג עליון' : d.tier === 'B' ? 'נכלל בדירוג' : 'מוכר בשוק',
    summary: d.summary,
    specialties: d.specialties,
    projectCount: d.projectCount,
    rating: d.rating,
    madadLink: `https://madadithadshut.co.il/company/${encodeURIComponent(d.slug)}/`,
    website: d.website ?? null,
  }));

  return NextResponse.json({
    query: q,
    found: results.length > 0,
    results,
    allDevelopersCount: DEVELOPERS.length,
    source: 'מדד ההתחדשות העירונית - madadithadshut.co.il',
    duns100Link: 'https://www.duns100.co.il/rating/התחדשות_עירונית/פינוי_בינוי',
  });
}
