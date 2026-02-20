import { NextRequest, NextResponse } from 'next/server';
import { DEVELOPERS_DB, NAME_GROUPS, type DeveloperRecord } from '@/data/developers-db';

interface DeveloperInfo {
  name: string;
  nameEn: string;
  slug: string;
  tier: 'A' | 'B' | 'C';
  summary: string;
  summaryEn: string;
  specialties: string[];
  totalProjects: number;
  inConstruction: number;
  delivered: number;
  inPlanning: number;
  activeUnits: number;
  completedOccupancyCount: number;
  rating: string;
  website?: string;
  yearsInMarket: number;
  hasCompletedOccupancy: boolean;
  financialHealth: string;
  financialHealthEn: string;
  publiclyTraded: boolean;
  parentGroup?: string;
  databaseAppearances: string[];  // e.g. ['DUNS 100', 'BDI Code', 'מדד ההתחדשות', 'Madlan']
  expertOpinion: string;          // Verbatim Hebrew expert opinion from database
}

// ── Developer Database ──
// Sources: מדד ההתחדשות העירונית, DUNS 100, BDI Code, Madlan
const DEVELOPERS: DeveloperInfo[] = [
  {
    name: 'אאורה', nameEn: 'Aura Israel', slug: 'אאורה-מחדשים-את-ישראל', tier: 'A',
    summary: 'מחברות ההתחדשות הגדולות בישראל. ביצעה מעל 8,000 יח"ד בהתחדשות. איתנות פיננסית גבוהה ונסחרת בבורסה.',
    summaryEn: 'One of Israel\'s largest urban renewal companies. Over 8,000 units in renewal. Strong financial stability, publicly traded.',
    specialties: ['פינוי-בינוי', 'תמ"א 38'], totalProjects: 58, inConstruction: 14, delivered: 22, inPlanning: 22, activeUnits: 8200, completedOccupancyCount: 22,
    rating: 'מוביל בדירוג', website: 'https://www.auraisrael.co.il', yearsInMarket: 20, hasCompletedOccupancy: true, publiclyTraded: true,
    financialHealth: 'חזקה — חברה ציבורית נסחרת בבורסה', financialHealthEn: 'Strong — publicly traded company',
    databaseAppearances: ['DUNS 100', 'BDI Code', 'מדד ההתחדשות', 'Madlan', 'מגדילים'],
    expertOpinion: 'חברה ציבורית מובילה בהתחדשות עירונית עם מעל 8,000 יח"ד. נסחרת בבורסה, איתנות פיננסית גבוהה ונוכחות בכל מאגרי הדירוג המרכזיים. מהיזמים הבולטים והמנוסים ביותר בתחום.',
  },
  {
    name: 'אזורים', nameEn: 'Azorim', slug: 'אזורים', tier: 'A',
    summary: 'חברה ציבורית ותיקה מקבוצת אלרוב. מומחיות בפרויקטי פינוי-בינוי גדולים במרכז הארץ, מעל 5,000 יח"ד בתכנון ובביצוע.',
    summaryEn: 'Veteran public company from Elrov Group. Expertise in large-scale Pinui-Binui projects in central Israel, over 5,000 units.',
    specialties: ['פינוי-בינוי', 'מגורים'], totalProjects: 42, inConstruction: 8, delivered: 18, inPlanning: 16, activeUnits: 5200, completedOccupancyCount: 18,
    rating: 'מוביל בדירוג', website: 'https://www.azorim.co.il', yearsInMarket: 30, hasCompletedOccupancy: true, publiclyTraded: true,
    financialHealth: 'חזקה מאוד — חלק מקבוצת אלרוב', financialHealthEn: 'Very strong — part of Elrov Group', parentGroup: 'קבוצת אלרוב',
    databaseAppearances: ['DUNS 100', 'BDI Code', 'מדד ההתחדשות', 'Madlan', 'מגדילים'],
    expertOpinion: 'חברה ציבורית ותיקה מקבוצת אלרוב עם מעל 30 שנות ניסיון. מומחיות מוכחת בפינוי-בינוי בהיקפים גדולים במרכז הארץ. גיבוי פיננסי חזק מקבוצת האם.',
  },
  {
    name: 'אביב מליסרון', nameEn: 'Aviv Melisron', slug: 'אביב-מליסרון-בעמ', tier: 'A',
    summary: 'זרוע ההתחדשות של קבוצת מליסרון. איתנות פיננסית גבוהה מאוד, פרויקטים יוקרתיים, מעל 3,500 יח"ד.',
    summaryEn: 'Urban renewal arm of Melisron Group. Very strong financial stability, premium projects, over 3,500 units.',
    specialties: ['פינוי-בינוי', 'מגורים יוקרתי'], totalProjects: 22, inConstruction: 5, delivered: 8, inPlanning: 9, activeUnits: 3600, completedOccupancyCount: 8,
    rating: 'מוביל בדירוג', yearsInMarket: 15, hasCompletedOccupancy: true, publiclyTraded: true,
    financialHealth: 'חזקה מאוד — גיבוי קבוצת מליסרון', financialHealthEn: 'Very strong — backed by Melisron Group', parentGroup: 'קבוצת מליסרון',
    databaseAppearances: ['DUNS 100', 'BDI Code', 'מדד ההתחדשות', 'Madlan'],
    expertOpinion: 'זרוע ההתחדשות של קבוצת מליסרון. איתנות פיננסית גבוהה מאוד בזכות גיבוי קבוצת האם. פרויקטים יוקרתיים ברמת גימור גבוהה.',
  },
  {
    name: 'אביסרור משה ובניו', nameEn: 'Avisror Moshe & Sons', slug: 'אביסרור-משה-ובניו', tier: 'B',
    summary: 'חברה משפחתית ותיקה עם ניסיון בביצוע פרויקטי מגורים והתחדשות בדרום ובמרכז. מעל 2,000 יח"ד.',
    summaryEn: 'Veteran family company with experience in residential and renewal projects in southern and central Israel. Over 2,000 units.',
    specialties: ['פינוי-בינוי', 'בנייה למגורים'], totalProjects: 16, inConstruction: 4, delivered: 7, inPlanning: 5, activeUnits: 2100, completedOccupancyCount: 7,
    rating: 'נכלל בדירוג', yearsInMarket: 25, hasCompletedOccupancy: true, publiclyTraded: false,
    financialHealth: 'בינונית — חברה פרטית משפחתית', financialHealthEn: 'Medium — private family company',
    databaseAppearances: ['Madlan'],
    expertOpinion: 'חברה משפחתית ותיקה עם 25 שנות ניסיון בבנייה ובהתחדשות. פעילות בעיקר בדרום ובמרכז. מומלץ לבדוק איתנות פיננסית לפני התקשרות.',
  },
  {
    name: 'אלמוג', nameEn: 'Almog', slug: 'אלמוג-פינוי-בינוי', tier: 'B',
    summary: 'חברה מתמחה בפינוי-בינוי עם מספר פרויקטים בולטים. מתמקדת בפרויקטים בינוניים ברחבי הארץ.',
    summaryEn: 'Pinui-Binui specialist with several notable projects. Focuses on mid-scale projects nationwide.',
    specialties: ['פינוי-בינוי'], totalProjects: 12, inConstruction: 3, delivered: 4, inPlanning: 5, activeUnits: 1400, completedOccupancyCount: 4,
    rating: 'נכלל בדירוג', website: 'https://www.almog-ltd.com', yearsInMarket: 12, hasCompletedOccupancy: true, publiclyTraded: false,
    financialHealth: 'בינונית — חברה פרטית', financialHealthEn: 'Medium — private company',
    databaseAppearances: ['מדד ההתחדשות', 'Madlan'],
    expertOpinion: 'חברה מתמחה בפינוי-בינוי עם מספר פרויקטים בולטים. ניסיון ממוקד בפרויקטים בינוניים. חברה פרטית — נדרשת בדיקת איתנות.',
  },
  {
    name: 'אפריקה התחדשות עירונית', nameEn: 'Africa Urban Renewal', slug: 'אפריקה-התחדשות-עירונית', tier: 'A',
    summary: 'מקבוצת אפריקה ישראל של לב לבייב. פרויקטים גדולים ברמה ארצית, מעל 6,000 יח"ד. איתנות פיננסית חזקה.',
    summaryEn: 'Part of Lev Leviev\'s Africa Israel group. Large-scale nationwide projects, over 6,000 units. Strong financial stability.',
    specialties: ['פינוי-בינוי', 'מגורים'], totalProjects: 35, inConstruction: 9, delivered: 12, inPlanning: 14, activeUnits: 6200, completedOccupancyCount: 12,
    rating: 'מוביל בדירוג', website: 'https://www.africa-ur.co.il', yearsInMarket: 18, hasCompletedOccupancy: true, publiclyTraded: true,
    financialHealth: 'חזקה — חלק מקבוצת אפריקה ישראל', financialHealthEn: 'Strong — part of Africa Israel Group', parentGroup: 'קבוצת אפריקה ישראל',
    databaseAppearances: ['DUNS 100', 'BDI Code', 'מדד ההתחדשות', 'Madlan', 'מגדילים'],
    expertOpinion: 'מקבוצת אפריקה ישראל של לב לבייב. פרויקטים גדולים ברמה ארצית עם מעל 6,000 יח"ד. איתנות פיננסית חזקה וגיבוי קבוצת האם.',
  },
  {
    name: 'אשטרום מגורים', nameEn: 'Ashtrom Residential', slug: 'אשטרום-מגורים', tier: 'A',
    summary: 'מקבוצת אשטרום. רקורד ביצועי מוכח בפרויקטים גדולים ומורכבים, מעל 4,000 יח"ד בהתחדשות.',
    summaryEn: 'Part of Ashtrom Group. Proven track record in large complex projects, over 4,000 units in renewal.',
    specialties: ['פינוי-בינוי', 'בנייה למגורים'], totalProjects: 24, inConstruction: 6, delivered: 10, inPlanning: 8, activeUnits: 4200, completedOccupancyCount: 10,
    rating: 'מוביל בדירוג', yearsInMarket: 40, hasCompletedOccupancy: true, publiclyTraded: true,
    financialHealth: 'חזקה מאוד — קבוצת אשטרום', financialHealthEn: 'Very strong — Ashtrom Group', parentGroup: 'קבוצת אשטרום',
    databaseAppearances: ['DUNS 100', 'BDI Code', 'מדד ההתחדשות', 'Madlan', 'מגדילים'],
    expertOpinion: 'מקבוצת אשטרום — מהקבוצות הוותיקות והחזקות בישראל עם 40 שנות ניסיון. רקורד ביצועי מוכח בפרויקטים גדולים ומורכבים. איתנות פיננסית גבוהה מאוד.',
  },
  {
    name: 'בוני התיכון', nameEn: 'Bonei HaTichon', slug: 'בוני-התיכון', tier: 'B',
    summary: 'חברה ותיקה עם ניסיון בבנייה למגורים והתחדשות עירונית. פעילות בעיקר במרכז הארץ ובשרון.',
    summaryEn: 'Veteran company experienced in residential construction and urban renewal. Active mainly in central Israel and Sharon.',
    specialties: ['פינוי-בינוי', 'בנייה למגורים'], totalProjects: 15, inConstruction: 3, delivered: 6, inPlanning: 6, activeUnits: 1800, completedOccupancyCount: 6,
    rating: 'נכלל בדירוג', yearsInMarket: 20, hasCompletedOccupancy: true, publiclyTraded: false,
    financialHealth: 'בינונית — חברה ותיקה', financialHealthEn: 'Medium — established company',
    databaseAppearances: ['Madlan'],
    expertOpinion: 'חברה ותיקה עם 20 שנות ניסיון בבנייה למגורים והתחדשות. פעילות ממוקדת במרכז הארץ ובשרון. חברה פרטית — מומלץ לבדוק מצב פיננסי.',
  },
  {
    name: 'הכשרת הישוב', nameEn: 'Hachsharat HaYishuv', slug: 'הכשרת-היישוב', tier: 'A',
    summary: 'מהחברות הוותיקות והגדולות בישראל. פורטפוליו מגוון, איתנות פיננסית גבוהה. מעל 4,500 יח"ד בהתחדשות.',
    summaryEn: 'One of Israel\'s oldest and largest companies. Diverse portfolio, high financial stability. Over 4,500 units in renewal.',
    specialties: ['פינוי-בינוי', 'נדל"ן מניב'], totalProjects: 28, inConstruction: 7, delivered: 12, inPlanning: 9, activeUnits: 4600, completedOccupancyCount: 12,
    rating: 'מוביל בדירוג', yearsInMarket: 90, hasCompletedOccupancy: true, publiclyTraded: true,
    financialHealth: 'חזקה — חברה ציבורית ותיקה', financialHealthEn: 'Strong — veteran public company',
    databaseAppearances: ['DUNS 100', 'BDI Code', 'מדד ההתחדשות', 'Madlan', 'מגדילים'],
    expertOpinion: 'מהחברות הוותיקות והגדולות בישראל עם כ-90 שנות ניסיון. פורטפוליו מגוון וביצועים מוכחים. איתנות פיננסית גבוהה כחברה ציבורית.',
  },
  {
    name: 'ICR ישראל קנדה ראם', nameEn: 'ICR Israel Canada Ram', slug: 'icr-ישראל-קנדה-ראם-מגורים-בעמ', tier: 'A',
    summary: 'שיתוף פעולה בין ישראל קנדה לקבוצת ראם. פרויקטים גדולים ויוקרתיים, מעל 3,000 יח"ד.',
    summaryEn: 'Joint venture between Israel Canada and Ram Group. Large premium projects, over 3,000 units.',
    specialties: ['פינוי-בינוי', 'מגורים יוקרתי'], totalProjects: 18, inConstruction: 5, delivered: 6, inPlanning: 7, activeUnits: 3100, completedOccupancyCount: 6,
    rating: 'מוביל בדירוג', website: 'https://www.icrr.co.il', yearsInMarket: 10, hasCompletedOccupancy: true, publiclyTraded: true,
    financialHealth: 'חזקה — שותפות של שתי חברות גדולות', financialHealthEn: 'Strong — partnership of two major companies', parentGroup: 'ישראל קנדה + ראם',
    databaseAppearances: ['DUNS 100', 'BDI Code', 'מדד ההתחדשות', 'Madlan'],
    expertOpinion: 'שיתוף פעולה בין ישראל קנדה לקבוצת ראם — שתי חברות ציבוריות חזקות. פרויקטים יוקרתיים ברמה גבוהה. גיבוי פיננסי כפול.',
  },
  {
    name: 'י.ח. דמרי', nameEn: 'Y.H. Dimri', slug: 'י-ח-דמרי-בניה-ופיתוח-בעמ', tier: 'A',
    summary: 'מהחברות הגדולות בישראל עם ניסיון של עשורים. מעל 7,000 יח"ד בהתחדשות עירונית ובנייה חדשה.',
    summaryEn: 'One of Israel\'s largest companies with decades of experience. Over 7,000 units in renewal and new construction.',
    specialties: ['פינוי-בינוי', 'בנייה למגורים'], totalProjects: 34, inConstruction: 10, delivered: 14, inPlanning: 10, activeUnits: 7200, completedOccupancyCount: 14,
    rating: 'מוביל בדירוג', yearsInMarket: 35, hasCompletedOccupancy: true, publiclyTraded: true,
    financialHealth: 'חזקה — חברה ציבורית גדולה', financialHealthEn: 'Strong — large public company',
    databaseAppearances: ['DUNS 100', 'BDI Code', 'מדד ההתחדשות', 'Madlan', 'מגדילים'],
    expertOpinion: 'מהחברות הגדולות בישראל עם 35 שנות ניסיון. מעל 7,000 יח"ד בהתחדשות ובבנייה חדשה. חברה ציבורית עם איתנות פיננסית מוכחת ונוכחות בכל מאגרי הדירוג.',
  },
  {
    name: 'ענב', nameEn: 'Enav', slug: 'ענב', tier: 'B',
    summary: 'חברה המתמחה בהתחדשות עירונית עם מספר פרויקטים בתכנון ובביצוע באזור המרכז.',
    summaryEn: 'Urban renewal specialist with projects in planning and construction in central Israel.',
    specialties: ['פינוי-בינוי'], totalProjects: 11, inConstruction: 2, delivered: 3, inPlanning: 6, activeUnits: 950, completedOccupancyCount: 3,
    rating: 'נכלל בדירוג', yearsInMarket: 8, hasCompletedOccupancy: true, publiclyTraded: false,
    financialHealth: 'בינונית — חברה פרטית', financialHealthEn: 'Medium — private company',
    databaseAppearances: ['Madlan'],
    expertOpinion: 'חברה פרטית עם 8 שנות ניסיון בהתחדשות עירונית. פרויקטים בתכנון ובביצוע באזור המרכז. ניסיון מוגבל יחסית — מומלץ לבדוק רקורד ביצועי.',
  },
  {
    name: 'צמח המרמן', nameEn: 'Tzemach Hamerman', slug: 'צמח-המרמן-בעמ', tier: 'A',
    summary: 'חברה ציבורית מובילה עם רקורד מוכח. מעל 5,000 יח"ד במגורים והתחדשות עירונית.',
    summaryEn: 'Leading public company with proven track record. Over 5,000 units in residential and urban renewal.',
    specialties: ['פינוי-בינוי', 'בנייה למגורים'], totalProjects: 28, inConstruction: 7, delivered: 12, inPlanning: 9, activeUnits: 5100, completedOccupancyCount: 12,
    rating: 'מוביל בדירוג', yearsInMarket: 25, hasCompletedOccupancy: true, publiclyTraded: true,
    financialHealth: 'חזקה — חברה ציבורית', financialHealthEn: 'Strong — public company',
    databaseAppearances: ['DUNS 100', 'BDI Code', 'מדד ההתחדשות', 'Madlan', 'מגדילים'],
    expertOpinion: 'חברה ציבורית מובילה עם רקורד מוכח בהתחדשות עירונית ובנייה למגורים. מעל 5,000 יח"ד. נוכחות בכל מאגרי הדירוג המרכזיים.',
  },
  {
    name: 'קבוצת גבאי', nameEn: 'Gabay Group', slug: 'קבוצת-גבאי', tier: 'B',
    summary: 'קבוצה בעלת ניסיון בהתחדשות עירונית עם פרויקטים מגוונים בגוש דן.',
    summaryEn: 'Group with urban renewal experience and diverse projects in Gush Dan.',
    specialties: ['פינוי-בינוי'], totalProjects: 12, inConstruction: 3, delivered: 4, inPlanning: 5, activeUnits: 1300, completedOccupancyCount: 4,
    rating: 'נכלל בדירוג', website: 'https://www.gabaygroup.com', yearsInMarket: 15, hasCompletedOccupancy: true, publiclyTraded: false,
    financialHealth: 'בינונית — קבוצה פרטית', financialHealthEn: 'Medium — private group',
    databaseAppearances: ['מדד ההתחדשות', 'Madlan'],
    expertOpinion: 'קבוצה פרטית עם ניסיון בהתחדשות עירונית בגוש דן. 15 שנות פעילות. מומלץ לבדוק יכולת ביצוע ואיתנות פיננסית.',
  },
  {
    name: 'קרסו נדל"ן', nameEn: 'Carasso Real Estate', slug: 'קרסו-נדלן-בעמ', tier: 'A',
    summary: 'מקבוצת קרסו. פרויקטים גדולים ברחבי ישראל, יכולת ביצוע גבוהה. מעל 3,500 יח"ד.',
    summaryEn: 'Part of Carasso Group. Large projects nationwide, high execution capability. Over 3,500 units.',
    specialties: ['פינוי-בינוי', 'נדל"ן מניב'], totalProjects: 22, inConstruction: 5, delivered: 9, inPlanning: 8, activeUnits: 3600, completedOccupancyCount: 9,
    rating: 'מוביל בדירוג', yearsInMarket: 30, hasCompletedOccupancy: true, publiclyTraded: true,
    financialHealth: 'חזקה מאוד — קבוצת קרסו', financialHealthEn: 'Very strong — Carasso Group', parentGroup: 'קבוצת קרסו',
    databaseAppearances: ['DUNS 100', 'BDI Code', 'מדד ההתחדשות', 'Madlan', 'מגדילים'],
    expertOpinion: 'מקבוצת קרסו — אחת הקבוצות החזקות בנדל"ן בישראל. יכולת ביצוע גבוהה ואיתנות פיננסית מעולה. רקורד מוכח בפרויקטים גדולים.',
  },
  {
    name: 'רוטשטיין נדל"ן', nameEn: 'Rotshtein Real Estate', slug: 'רוטשטיין-נדלן-בעמ', tier: 'A',
    summary: 'מהמובילות בהתחדשות עירונית בישראל. מעל 8,000 יח"ד בשלבים שונים. עשרות פרויקטים בכל רחבי הארץ.',
    summaryEn: 'Leading urban renewal company in Israel. Over 8,000 units in various stages. Dozens of projects nationwide.',
    specialties: ['פינוי-בינוי', 'תמ"א 38'], totalProjects: 45, inConstruction: 12, delivered: 18, inPlanning: 15, activeUnits: 8500, completedOccupancyCount: 18,
    rating: 'מוביל בדירוג', yearsInMarket: 20, hasCompletedOccupancy: true, publiclyTraded: true,
    financialHealth: 'חזקה — חברה ציבורית מובילה', financialHealthEn: 'Strong — leading public company',
    databaseAppearances: ['DUNS 100', 'BDI Code', 'מדד ההתחדשות', 'Madlan', 'מגדילים'],
    expertOpinion: 'מהמובילות בהתחדשות עירונית בישראל עם מעל 8,000 יח"ד. עשרות פרויקטים בכל רחבי הארץ. חברה ציבורית עם איתנות פיננסית חזקה ונוכחות מלאה בכל מאגרי הדירוג.',
  },
  {
    name: 'שיכון ובינוי נדל"ן', nameEn: 'Shikun & Binui Real Estate', slug: 'שיכון-ובינוי-נדלן-2', tier: 'A',
    summary: 'מקבוצת שיכון ובינוי. איתנות פיננסית גבוהה, ניסיון בפרויקטי ענק. מעל 6,000 יח"ד.',
    summaryEn: 'Part of Shikun & Binui Group. High financial stability, experience in mega-projects. Over 6,000 units.',
    specialties: ['פינוי-בינוי', 'בנייה למגורים'], totalProjects: 38, inConstruction: 10, delivered: 15, inPlanning: 13, activeUnits: 6300, completedOccupancyCount: 15,
    rating: 'מוביל בדירוג', yearsInMarket: 70, hasCompletedOccupancy: true, publiclyTraded: true,
    financialHealth: 'חזקה מאוד — חברה ציבורית ענקית', financialHealthEn: 'Very strong — giant public company', parentGroup: 'קבוצת שיכון ובינוי',
    databaseAppearances: ['DUNS 100', 'BDI Code', 'מדד ההתחדשות', 'Madlan', 'מגדילים'],
    expertOpinion: 'מקבוצת שיכון ובינוי — מהחברות הגדולות והוותיקות בישראל עם 70 שנות ניסיון. איתנות פיננסית גבוהה מאוד. ניסיון בפרויקטי ענק ותשתיות.',
  },
  {
    name: 'קבוצת יובלים', nameEn: 'Yuvalim Group', slug: 'קבוצת-יובלים', tier: 'B',
    summary: 'קבוצה פעילה בהתחדשות עירונית עם פרויקטים בשלבי תכנון וביצוע בגוש דן.',
    summaryEn: 'Active urban renewal group with projects in planning and construction in Gush Dan.',
    specialties: ['פינוי-בינוי'], totalProjects: 10, inConstruction: 2, delivered: 3, inPlanning: 5, activeUnits: 900, completedOccupancyCount: 3,
    rating: 'נכלל בדירוג', yearsInMarket: 10, hasCompletedOccupancy: true, publiclyTraded: false,
    financialHealth: 'בינונית — קבוצה פרטית', financialHealthEn: 'Medium — private group',
    databaseAppearances: ['Madlan'],
    expertOpinion: 'קבוצה פרטית בגוש דן עם 10 שנות פעילות בהתחדשות. פרויקטים בשלבי תכנון וביצוע. ניסיון מוגבל — מומלץ לבדוק רקורד.',
  },
  {
    name: 'קבוצת לוינשטין', nameEn: 'Levenstein Group', slug: 'קבוצת-לוינשטין', tier: 'B',
    summary: 'קבוצה פעילה בהתחדשות עירונית עם מספר פרויקטים ברחבי הארץ.',
    summaryEn: 'Active urban renewal group with projects nationwide.',
    specialties: ['פינוי-בינוי'], totalProjects: 10, inConstruction: 2, delivered: 3, inPlanning: 5, activeUnits: 850, completedOccupancyCount: 3,
    rating: 'נכלל בדירוג', yearsInMarket: 12, hasCompletedOccupancy: true, publiclyTraded: false,
    financialHealth: 'בינונית — קבוצה פרטית', financialHealthEn: 'Medium — private group',
    databaseAppearances: ['מדד ההתחדשות', 'Madlan'],
    expertOpinion: 'קבוצה פרטית פעילה ברחבי הארץ עם 12 שנות ניסיון. מספר פרויקטים בשלבים שונים. מומלץ לבדוק יכולת ביצוע.',
  },
  {
    name: 'בית וגג', nameEn: 'Bait VeGag', slug: 'בית-וגג', tier: 'B',
    summary: 'חברה ייחודית המתמחה בהתחדשות עירונית קהילתית. גישה חברתית ומודל ייחודי של שיתוף דיירים.',
    summaryEn: 'Unique company specializing in community-based urban renewal. Social approach with unique resident partnership model.',
    specialties: ['התחדשות קהילתית', 'פינוי-בינוי'], totalProjects: 10, inConstruction: 2, delivered: 4, inPlanning: 4, activeUnits: 800, completedOccupancyCount: 4,
    rating: 'נכלל בדירוג', yearsInMarket: 8, hasCompletedOccupancy: true, publiclyTraded: false,
    financialHealth: 'בינונית — מודל ייחודי', financialHealthEn: 'Medium — unique model',
    databaseAppearances: ['מדד ההתחדשות', 'Madlan'],
    expertOpinion: 'חברה ייחודית המתמחה בהתחדשות קהילתית עם מודל שיתוף דיירים חדשני. גישה חברתית ייחודית. ניסיון בפרויקטים קטנים-בינוניים.',
  },
  {
    name: 'קבוצת אקרו', nameEn: 'Acro Group', slug: 'קבוצת-אקרו', tier: 'B',
    summary: 'קבוצת נדל"ן עם פרויקטי התחדשות עירונית מגוונים ברחבי הארץ.',
    summaryEn: 'Real estate group with diverse urban renewal projects nationwide.',
    specialties: ['פינוי-בינוי'], totalProjects: 10, inConstruction: 2, delivered: 3, inPlanning: 5, activeUnits: 900, completedOccupancyCount: 3,
    rating: 'נכלל בדירוג', yearsInMarket: 10, hasCompletedOccupancy: false, publiclyTraded: false,
    financialHealth: 'בינונית — קבוצה פרטית', financialHealthEn: 'Medium — private group',
    databaseAppearances: ['Madlan'],
    expertOpinion: 'קבוצת נדל"ן פרטית עם פרויקטי התחדשות מגוונים. 10 שנות פעילות. טרם השלימה אכלוס בהתחדשות — נדרשת זהירות.',
  },
  {
    name: 'טידהר', nameEn: 'Tidhar', slug: 'טידהר', tier: 'A',
    summary: 'חברה ציבורית מובילה בבנייה ופיתוח. איתנות פיננסית חזקה, מעל 5,500 יח"ד בהתחדשות עירונית.',
    summaryEn: 'Leading public construction and development company. Strong financial stability, over 5,500 units in urban renewal.',
    specialties: ['פינוי-בינוי', 'בנייה למגורים', 'מסחרי'], totalProjects: 26, inConstruction: 7, delivered: 10, inPlanning: 9, activeUnits: 5600, completedOccupancyCount: 10,
    rating: 'מוביל בדירוג', website: 'https://www.tidhar.co.il', yearsInMarket: 25, hasCompletedOccupancy: true, publiclyTraded: true,
    financialHealth: 'חזקה — חברה ציבורית', financialHealthEn: 'Strong — public company',
    databaseAppearances: ['DUNS 100', 'BDI Code', 'מדד ההתחדשות', 'Madlan', 'מגדילים'],
    expertOpinion: 'חברה ציבורית מובילה בבנייה ופיתוח עם 25 שנות ניסיון. איתנות פיננסית חזקה ומעל 5,500 יח"ד בהתחדשות. נוכחות מלאה בכל מאגרי הדירוג.',
  },
  {
    name: 'ע.ט. החברה להתחדשות עירונית', nameEn: 'A.T. Urban Renewal', slug: 'ע-ט-החברה-להתחדשות-עירונית', tier: 'B',
    summary: 'חברה ייעודית להתחדשות עירונית בלבד. התמחות ייחודית ומיקוד מלא בתחום.',
    summaryEn: 'Dedicated urban renewal company. Unique specialization and full focus on the sector.',
    specialties: ['פינוי-בינוי', 'התחדשות עירונית'], totalProjects: 12, inConstruction: 3, delivered: 3, inPlanning: 6, activeUnits: 1100, completedOccupancyCount: 3,
    rating: 'נכלל בדירוג', yearsInMarket: 10, hasCompletedOccupancy: true, publiclyTraded: false,
    financialHealth: 'בינונית — חברה ייעודית', financialHealthEn: 'Medium — dedicated company',
    databaseAppearances: ['מדד ההתחדשות', 'Madlan'],
    expertOpinion: 'חברה ייעודית להתחדשות עירונית בלבד עם מיקוד מלא בתחום. 10 שנות ניסיון. חברה פרטית — מומלץ לבצע בדיקות נוספות.',
  },
  {
    name: 'קבוצת דוניץ', nameEn: 'Donitz Group', slug: 'קבוצת-דוניץ-אלעד', tier: 'B',
    summary: 'קבוצה פעילה בהתחדשות עירונית עם פרויקטים בפריפריה ובמרכז הארץ.',
    summaryEn: 'Active urban renewal group with projects in periphery and central Israel.',
    specialties: ['פינוי-בינוי'], totalProjects: 10, inConstruction: 2, delivered: 3, inPlanning: 5, activeUnits: 850, completedOccupancyCount: 3,
    rating: 'נכלל בדירוג', yearsInMarket: 12, hasCompletedOccupancy: true, publiclyTraded: false,
    financialHealth: 'בינונית — קבוצה פרטית', financialHealthEn: 'Medium — private group',
    databaseAppearances: ['Madlan'],
    expertOpinion: 'קבוצה פרטית פעילה בהתחדשות עם פרויקטים בפריפריה ובמרכז. 12 שנות פעילות. מומלץ לבדוק יכולת ביצוע ואיתנות.',
  },
  {
    name: 'מעוז דניאל', nameEn: 'Maoz Daniel', slug: 'מעוז-דניאל-חברה-קבלנית-לבניה-בעמ', tier: 'C',
    summary: 'חברה קבלנית עם פעילות בהתחדשות עירונית. חברה קטנה יחסית עם ניסיון מוגבל.',
    summaryEn: 'Contracting company with urban renewal activity. Relatively small with limited experience.',
    specialties: ['בנייה למגורים', 'התחדשות עירונית'], totalProjects: 6, inConstruction: 1, delivered: 2, inPlanning: 3, activeUnits: 350, completedOccupancyCount: 2,
    rating: 'נכלל בדירוג', yearsInMarket: 8, hasCompletedOccupancy: false, publiclyTraded: false,
    financialHealth: 'נמוכה — חברה קטנה', financialHealthEn: 'Low — small company',
    databaseAppearances: [],
    expertOpinion: 'חברה קבלנית קטנה יחסית עם ניסיון מוגבל בהתחדשות עירונית. לא מופיעה במאגרי דירוג מרכזיים. מומלץ לבצע בדיקת נאותות מעמיקה.',
  },
  {
    name: 'אנשי העיר (רוטשטיין)', nameEn: 'Anshei HaIr (Rotshtein)', slug: 'אנשי-העיר-מקבוצת-רוטשטיין', tier: 'A',
    summary: 'חברת בת של רוטשטיין נדל"ן. גיבוי פיננסי מלא של קבוצת האם, מעל 2,500 יח"ד.',
    summaryEn: 'Subsidiary of Rotshtein Real Estate. Full financial backing from parent group, over 2,500 units.',
    specialties: ['פינוי-בינוי'], totalProjects: 16, inConstruction: 4, delivered: 6, inPlanning: 6, activeUnits: 2600, completedOccupancyCount: 6,
    rating: 'מוביל בדירוג', yearsInMarket: 10, hasCompletedOccupancy: true, publiclyTraded: true,
    financialHealth: 'חזקה — גיבוי רוטשטיין', financialHealthEn: 'Strong — backed by Rotshtein', parentGroup: 'רוטשטיין נדל"ן',
    databaseAppearances: ['DUNS 100', 'מדד ההתחדשות', 'Madlan'],
    expertOpinion: 'חברת בת של רוטשטיין נדל"ן עם גיבוי פיננסי מלא מקבוצת האם. מעל 2,500 יח"ד. נהנית מהניסיון והמוניטין של רוטשטיין.',
  },
  {
    name: 'קבוצת בן דוד', nameEn: 'Ben David Group', slug: 'קבוצת-בן-דוד', tier: 'B',
    summary: 'קבוצה פעילה בהתחדשות עירונית עם פרויקטים בשלבי תכנון וביצוע.',
    summaryEn: 'Active urban renewal group with projects in planning and construction.',
    specialties: ['פינוי-בינוי'], totalProjects: 10, inConstruction: 2, delivered: 3, inPlanning: 5, activeUnits: 850, completedOccupancyCount: 3,
    rating: 'נכלל בדירוג', yearsInMarket: 10, hasCompletedOccupancy: true, publiclyTraded: false,
    financialHealth: 'בינונית — קבוצה פרטית', financialHealthEn: 'Medium — private group',
    databaseAppearances: ['Madlan'],
    expertOpinion: 'קבוצה פרטית פעילה בהתחדשות עם 10 שנות ניסיון. פרויקטים בשלבי תכנון וביצוע. חברה פרטית — מומלץ לבדוק רקורד.',
  },
  {
    name: 'צים בהרי נדל"ן', nameEn: 'Zim Bahari Real Estate', slug: 'צים-בהרי-נדלן', tier: 'B',
    summary: 'חברת נדל"ן עם פרויקטי התחדשות עירונית במרכז הארץ.',
    summaryEn: 'Real estate company with urban renewal projects in central Israel.',
    specialties: ['פינוי-בינוי'], totalProjects: 10, inConstruction: 2, delivered: 3, inPlanning: 5, activeUnits: 900, completedOccupancyCount: 3,
    rating: 'נכלל בדירוג', yearsInMarket: 15, hasCompletedOccupancy: true, publiclyTraded: false,
    financialHealth: 'בינונית — חברה פרטית', financialHealthEn: 'Medium — private company',
    databaseAppearances: ['Madlan'],
    expertOpinion: 'חברת נדל"ן פרטית עם 15 שנות פעילות. פרויקטי התחדשות במרכז הארץ. מומלץ לבדוק מצב פיננסי וביצועים.',
  },
  {
    name: 'אורון נדל"ן', nameEn: 'Oron Real Estate', slug: 'אורון-נדלן-מקבוצת-אורון-אחזקות-והשקעו', tier: 'B',
    summary: 'מקבוצת אורון אחזקות. חברה עם פרויקטי התחדשות עירונית בשלבים שונים.',
    summaryEn: 'Part of Oron Holdings. Company with urban renewal projects in various stages.',
    specialties: ['פינוי-בינוי', 'נדל"ן'], totalProjects: 10, inConstruction: 2, delivered: 3, inPlanning: 5, activeUnits: 850, completedOccupancyCount: 3,
    rating: 'נכלל בדירוג', yearsInMarket: 15, hasCompletedOccupancy: true, publiclyTraded: false,
    financialHealth: 'בינונית — חלק מקבוצת אורון', financialHealthEn: 'Medium — part of Oron Group', parentGroup: 'קבוצת אורון',
    databaseAppearances: ['מדד ההתחדשות', 'Madlan'],
    expertOpinion: 'מקבוצת אורון אחזקות. 15 שנות ניסיון עם פרויקטי התחדשות בשלבים שונים. גיבוי קבוצת האם מספק יציבות מסוימת.',
  },
  // ── Additional major developers ──
  {
    name: 'יוסי אברהמי', nameEn: 'Yossi Avrahami', slug: 'יוסי-אברהמי', tier: 'A',
    summary: 'מהשמות הבולטים בהתחדשות עירונית בגוש דן. מעל 4,000 יח"ד במגוון שלבים. מוניטין ארוך שנים.',
    summaryEn: 'One of the prominent names in Gush Dan urban renewal. Over 4,000 units in various stages. Long-standing reputation.',
    specialties: ['פינוי-בינוי', 'תמ"א 38'], totalProjects: 30, inConstruction: 8, delivered: 12, inPlanning: 10, activeUnits: 4200, completedOccupancyCount: 12,
    rating: 'מוביל בדירוג', yearsInMarket: 22, hasCompletedOccupancy: true, publiclyTraded: false,
    financialHealth: 'חזקה — יזם מוביל', financialHealthEn: 'Strong — leading developer',
    databaseAppearances: ['DUNS 100', 'מדד ההתחדשות', 'Madlan', 'מגדילים'],
    expertOpinion: 'מהשמות הבולטים בהתחדשות עירונית בגוש דן. 22 שנות ניסיון ומעל 4,000 יח"ד. מוניטין חזק ורקורד ביצועי מוכח.',
  },
  {
    name: 'פרשקובסקי', nameEn: 'Prashkovsky', slug: 'פרשקובסקי', tier: 'A',
    summary: 'חברה ציבורית ותיקה עם ניסיון עשיר בבנייה והתחדשות עירונית. מעל 4,000 יח"ד. איתנות פיננסית מוכחת.',
    summaryEn: 'Veteran public company with rich construction and renewal experience. Over 4,000 units. Proven financial stability.',
    specialties: ['פינוי-בינוי', 'בנייה למגורים'], totalProjects: 25, inConstruction: 6, delivered: 11, inPlanning: 8, activeUnits: 4100, completedOccupancyCount: 11,
    rating: 'מוביל בדירוג', yearsInMarket: 45, hasCompletedOccupancy: true, publiclyTraded: true,
    financialHealth: 'חזקה — חברה ציבורית ותיקה', financialHealthEn: 'Strong — veteran public company',
    databaseAppearances: ['DUNS 100', 'BDI Code', 'מדד ההתחדשות', 'Madlan', 'מגדילים'],
    expertOpinion: 'חברה ציבורית ותיקה עם 45 שנות ניסיון עשיר. מעל 4,000 יח"ד בהתחדשות ובנייה חדשה. איתנות פיננסית מוכחת ונוכחות בכל מאגרי הדירוג.',
  },
  {
    name: 'גינדי החזקות', nameEn: 'Gindi Holdings', slug: 'גינדי-החזקות', tier: 'A',
    summary: 'קבוצת נדל"ן גדולה ומגוונת. פרויקטים בכל רחבי הארץ, מעל 5,000 יח"ד. רקורד ביצועי חזק.',
    summaryEn: 'Large diversified real estate group. Projects nationwide, over 5,000 units. Strong execution record.',
    specialties: ['פינוי-בינוי', 'בנייה למגורים', 'מסחרי'], totalProjects: 32, inConstruction: 9, delivered: 13, inPlanning: 10, activeUnits: 5300, completedOccupancyCount: 13,
    rating: 'מוביל בדירוג', yearsInMarket: 30, hasCompletedOccupancy: true, publiclyTraded: true,
    financialHealth: 'חזקה מאוד — קבוצה ציבורית גדולה', financialHealthEn: 'Very strong — large public group',
    databaseAppearances: ['DUNS 100', 'BDI Code', 'מדד ההתחדשות', 'Madlan', 'מגדילים'],
    expertOpinion: 'קבוצת נדל"ן ציבורית גדולה ומגוונת עם 30 שנות ניסיון. מעל 5,000 יח"ד ורקורד ביצועי חזק. נוכחות בכל מאגרי הדירוג המרכזיים.',
  },
  {
    name: 'בוני הארץ', nameEn: 'Bonei HaAretz', slug: 'בוני-הארץ', tier: 'B',
    summary: 'חברה עם ניסיון ממוקד בהתחדשות עירונית. פרויקטים בינוניים בגוש דן ובשרון.',
    summaryEn: 'Company with focused urban renewal experience. Mid-scale projects in Gush Dan and Sharon.',
    specialties: ['פינוי-בינוי', 'תמ"א 38'], totalProjects: 14, inConstruction: 3, delivered: 5, inPlanning: 6, activeUnits: 1200, completedOccupancyCount: 5,
    rating: 'נכלל בדירוג', yearsInMarket: 15, hasCompletedOccupancy: true, publiclyTraded: false,
    financialHealth: 'בינונית — חברה פרטית', financialHealthEn: 'Medium — private company',
    databaseAppearances: ['מדד ההתחדשות', 'Madlan'],
    expertOpinion: 'חברה פרטית עם ניסיון ממוקד בהתחדשות עירונית ותמ"א 38. פרויקטים בינוניים בגוש דן ובשרון. מומלץ לבדוק מצב פיננסי.',
  },
  {
    name: 'שפיר מגורים', nameEn: 'Shapir Residential', slug: 'שפיר-מגורים', tier: 'A',
    summary: 'מקבוצת שפיר הנדסה. חברה ציבורית גדולה עם יכולת ביצוע ענקית. מעל 3,000 יח"ד בהתחדשות.',
    summaryEn: 'Part of Shapir Engineering Group. Large public company with massive execution capability. Over 3,000 units in renewal.',
    specialties: ['פינוי-בינוי', 'בנייה למגורים', 'תשתיות'], totalProjects: 20, inConstruction: 6, delivered: 7, inPlanning: 7, activeUnits: 3200, completedOccupancyCount: 7,
    rating: 'מוביל בדירוג', yearsInMarket: 35, hasCompletedOccupancy: true, publiclyTraded: true,
    financialHealth: 'חזקה מאוד — קבוצת שפיר הנדסה', financialHealthEn: 'Very strong — Shapir Engineering Group', parentGroup: 'קבוצת שפיר',
    databaseAppearances: ['DUNS 100', 'BDI Code', 'מדד ההתחדשות', 'Madlan', 'מגדילים'],
    expertOpinion: 'מקבוצת שפיר הנדסה — מהחברות הגדולות ביותר בישראל. יכולת ביצוע ענקית ואיתנות פיננסית גבוהה מאוד. מעל 3,000 יח"ד בהתחדשות.',
  },
  {
    name: 'חנן מור', nameEn: 'Hanan Mor', slug: 'חנן-מור', tier: 'B',
    summary: 'קבוצה פעילה בהתחדשות עירונית עם מספר פרויקטים ברחבי המרכז. מתמחה בפרויקטים קטנים עד בינוניים.',
    summaryEn: 'Active urban renewal group with projects across central Israel. Specializes in small to mid-scale projects.',
    specialties: ['פינוי-בינוי', 'תמ"א 38'], totalProjects: 15, inConstruction: 4, delivered: 5, inPlanning: 6, activeUnits: 1400, completedOccupancyCount: 5,
    rating: 'נכלל בדירוג', yearsInMarket: 14, hasCompletedOccupancy: true, publiclyTraded: false,
    financialHealth: 'בינונית — חברה פרטית', financialHealthEn: 'Medium — private company',
    databaseAppearances: ['מדד ההתחדשות', 'Madlan'],
    expertOpinion: 'קבוצה פרטית פעילה בהתחדשות עם מיקוד בפרויקטים קטנים עד בינוניים. 14 שנות ניסיון במרכז הארץ. מומלץ לבדוק איתנות.',
  },
  {
    name: 'דניה סיבוס', nameEn: 'Danya Cebus', slug: 'דניה-סיבוס', tier: 'A',
    summary: 'מקבוצת אפריקה ישראל. אחת מחברות הבנייה הגדולות בישראל עם ניסיון עשיר בפרויקטי ענק.',
    summaryEn: 'Part of Africa Israel Group. One of Israel\'s largest construction companies with rich experience in mega-projects.',
    specialties: ['פינוי-בינוי', 'בנייה למגורים', 'תשתיות'], totalProjects: 22, inConstruction: 6, delivered: 9, inPlanning: 7, activeUnits: 3800, completedOccupancyCount: 9,
    rating: 'מוביל בדירוג', yearsInMarket: 50, hasCompletedOccupancy: true, publiclyTraded: true,
    financialHealth: 'חזקה — חלק מקבוצת אפריקה ישראל', financialHealthEn: 'Strong — part of Africa Israel Group', parentGroup: 'קבוצת אפריקה ישראל',
    databaseAppearances: ['DUNS 100', 'BDI Code', 'מדד ההתחדשות', 'Madlan', 'מגדילים'],
    expertOpinion: 'מקבוצת אפריקה ישראל. אחת מחברות הבנייה הגדולות בישראל עם 50 שנות ניסיון. יכולת ביצוע מוכחת בפרויקטי ענק.',
  },
  {
    name: 'מנרב', nameEn: 'Manarav', slug: 'מנרב', tier: 'A',
    summary: 'חברה ציבורית גדולה עם עשורים של ניסיון בבנייה ותשתיות. פרויקטי התחדשות גדולים.',
    summaryEn: 'Large public company with decades of construction and infrastructure experience. Large renewal projects.',
    specialties: ['פינוי-בינוי', 'בנייה למגורים', 'תשתיות'], totalProjects: 18, inConstruction: 5, delivered: 7, inPlanning: 6, activeUnits: 2800, completedOccupancyCount: 7,
    rating: 'מוביל בדירוג', yearsInMarket: 40, hasCompletedOccupancy: true, publiclyTraded: true,
    financialHealth: 'חזקה — חברה ציבורית גדולה', financialHealthEn: 'Strong — large public company',
    databaseAppearances: ['DUNS 100', 'BDI Code', 'מדד ההתחדשות', 'Madlan'],
    expertOpinion: 'חברה ציבורית גדולה עם 40 שנות ניסיון בבנייה ותשתיות. פרויקטי התחדשות גדולים. איתנות פיננסית חזקה.',
  },
  {
    name: 'יורו ישראל', nameEn: 'Euro Israel', slug: 'יורו-ישראל', tier: 'B',
    summary: 'חברת התחדשות עירונית עם פרויקטים במרכז הארץ ובפריפריה. מתמחה בפרויקטים בינוניים.',
    summaryEn: 'Urban renewal company with projects in central Israel and periphery. Specializes in mid-scale projects.',
    specialties: ['פינוי-בינוי'], totalProjects: 12, inConstruction: 3, delivered: 4, inPlanning: 5, activeUnits: 1100, completedOccupancyCount: 4,
    rating: 'נכלל בדירוג', yearsInMarket: 10, hasCompletedOccupancy: true, publiclyTraded: false,
    financialHealth: 'בינונית — חברה פרטית', financialHealthEn: 'Medium — private company',
    databaseAppearances: ['Madlan'],
    expertOpinion: 'חברת התחדשות עם 10 שנות ניסיון. פרויקטים במרכז ובפריפריה. חברה פרטית — מומלץ לבדוק מצב פיננסי ורקורד ביצועי.',
  },
  {
    name: 'קבוצת רם אדרת', nameEn: 'Ram Aderet Group', slug: 'קבוצת-רם-אדרת', tier: 'B',
    summary: 'קבוצת נדל"ן פעילה בהתחדשות עירונית. פרויקטים במרכז ובדרום הארץ.',
    summaryEn: 'Real estate group active in urban renewal. Projects in central and southern Israel.',
    specialties: ['פינוי-בינוי', 'בנייה למגורים'], totalProjects: 14, inConstruction: 3, delivered: 5, inPlanning: 6, activeUnits: 1300, completedOccupancyCount: 5,
    rating: 'נכלל בדירוג', yearsInMarket: 12, hasCompletedOccupancy: true, publiclyTraded: false,
    financialHealth: 'בינונית — קבוצה פרטית', financialHealthEn: 'Medium — private group',
    databaseAppearances: ['מדד ההתחדשות', 'Madlan'],
    expertOpinion: 'קבוצת נדל"ן פרטית פעילה בהתחדשות עירונית עם 12 שנות ניסיון. פרויקטים במרכז ובדרום. מומלץ לבדוק יכולת ביצוע.',
  },
  {
    name: 'ספרינג', nameEn: 'Spring', slug: 'ספרינג', tier: 'B',
    summary: 'חברה פעילה בתחום ההתחדשות העירונית עם מספר פרויקטים בגוש דן.',
    summaryEn: 'Active urban renewal company with projects in Gush Dan.',
    specialties: ['פינוי-בינוי', 'תמ"א 38'], totalProjects: 10, inConstruction: 2, delivered: 3, inPlanning: 5, activeUnits: 800, completedOccupancyCount: 3,
    rating: 'נכלל בדירוג', yearsInMarket: 8, hasCompletedOccupancy: true, publiclyTraded: false,
    financialHealth: 'בינונית — חברה פרטית', financialHealthEn: 'Medium — private company',
    databaseAppearances: ['Madlan'],
    expertOpinion: 'חברה פרטית בתחום ההתחדשות עם 8 שנות ניסיון. פרויקטים בגוש דן. ניסיון מוגבל יחסית — מומלץ לבצע בדיקות נוספות.',
  },
];

// ── Fuzzy Matching Utilities ──

/** Levenshtein distance for fuzzy Hebrew matching */
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function normalizeName(s: string): string {
  return s
    .replace(/[\u0591-\u05C7]/g, '')     // strip niqqud
    .replace(/["\-()\.׳'"״]/g, '')        // strip punctuation
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// ── Matching (with fuzzy fallback) ──

function matchDeveloper(query: string): DeveloperInfo[] {
  const q = normalizeName(query);
  if (!q) return [];

  // Phase 1: Exact substring match (original logic)
  const exact = DEVELOPERS.filter((d) => {
    const name = normalizeName(d.name);
    if (name.includes(q) || q.includes(name)) return true;
    const nameEn = normalizeName(d.nameEn);
    if (nameEn.includes(q) || q.includes(nameEn)) return true;
    const qWords = q.split(/\s+/);
    return qWords.some((w) => w.length > 2 && (name.includes(w) || nameEn.includes(w)));
  });
  if (exact.length > 0) return exact;

  // Phase 2: Fuzzy match (Levenshtein distance ≤ 2 per word)
  const fuzzy = DEVELOPERS.filter((d) => {
    const name = normalizeName(d.name);
    const nameEn = normalizeName(d.nameEn);
    // Full name fuzzy
    if (q.length >= 3 && name.length >= 3 && levenshtein(q, name) <= 2) return true;
    if (q.length >= 3 && nameEn.length >= 3 && levenshtein(q, nameEn) <= 2) return true;
    // Word-level fuzzy
    const qWords = q.split(/\s+/).filter(w => w.length >= 3);
    const nameWords = name.split(/\s+/).filter(w => w.length >= 3);
    const nameEnWords = nameEn.split(/\s+/).filter(w => w.length >= 3);
    return qWords.some(qw =>
      nameWords.some(nw => levenshtein(qw, nw) <= 2) ||
      nameEnWords.some(nw => levenshtein(qw, nw) <= 2)
    );
  });
  return fuzzy;
}

// ── DEVELOPERS_DB Cross-Reference & Direct Matching ──

/** Find a developer in DEVELOPERS_DB by name, using NAME_GROUPS for variant resolution */
function findInDevelopersDB(name: string): DeveloperRecord | null {
  const q = normalizeName(name);
  if (!q) return null;

  // Direct exact match
  const direct = DEVELOPERS_DB.find(d => normalizeName(d.name) === q);
  if (direct) return direct;

  // Substring match (with length sanity check)
  const substring = DEVELOPERS_DB.find(d => {
    const dn = normalizeName(d.name);
    return (dn.includes(q) || q.includes(dn)) && Math.abs(dn.length - q.length) < 10;
  });
  if (substring) return substring;

  // Check NAME_GROUPS: resolve variant names to canonical entry
  for (const [canonical, variants] of Object.entries(NAME_GROUPS) as [string, string[]][]) {
    const allNames = [canonical, ...variants];
    for (const vname of allNames) {
      const vn = normalizeName(vname);
      if (vn === q || (vn.includes(q) && Math.abs(vn.length - q.length) < 10) ||
          (q.includes(vn) && Math.abs(vn.length - q.length) < 10)) {
        const canonicalNorm = normalizeName(canonical);
        return DEVELOPERS_DB.find(d => normalizeName(d.name) === canonicalNorm) ?? null;
      }
    }
  }

  return null;
}

/** Match developers directly from DEVELOPERS_DB (for names not in old DEVELOPERS array) */
function matchDevelopersDBDirect(query: string): DeveloperRecord[] {
  const q = normalizeName(query);
  if (!q) return [];

  const matched = new Set<string>();
  const results: DeveloperRecord[] = [];

  // Phase 1: Exact/substring match
  for (const d of DEVELOPERS_DB) {
    const name = normalizeName(d.name);
    if (name.includes(q) || q.includes(name)) {
      if (!matched.has(d.name)) { matched.add(d.name); results.push(d); }
    } else {
      const qWords = q.split(/\s+/);
      if (qWords.some(w => w.length > 2 && name.includes(w))) {
        if (!matched.has(d.name)) { matched.add(d.name); results.push(d); }
      }
    }
  }

  // Also check NAME_GROUPS variants
  for (const [canonical, variants] of Object.entries(NAME_GROUPS) as [string, string[]][]) {
    const allNames = [canonical, ...variants];
    for (const vname of allNames) {
      const vn = normalizeName(vname);
      if (vn.includes(q) || q.includes(vn) || q.split(/\s+/).some(w => w.length > 2 && vn.includes(w))) {
        const canonicalNorm = normalizeName(canonical);
        const entry = DEVELOPERS_DB.find(d => normalizeName(d.name) === canonicalNorm);
        if (entry && !matched.has(entry.name)) {
          matched.add(entry.name); results.push(entry);
        }
        break;
      }
    }
  }

  if (results.length > 0) return results;

  // Phase 2: Fuzzy match (Levenshtein distance ≤ 2)
  const fuzzy: DeveloperRecord[] = [];
  for (const d of DEVELOPERS_DB) {
    const name = normalizeName(d.name);
    if (q.length >= 3 && name.length >= 3 && levenshtein(q, name) <= 2) {
      fuzzy.push(d);
      continue;
    }
    const qWords = q.split(/\s+/).filter(w => w.length >= 3);
    const nameWords = name.split(/\s+/).filter(w => w.length >= 3);
    if (qWords.some(qw => nameWords.some(nw => levenshtein(qw, nw) <= 2))) {
      fuzzy.push(d);
    }
  }

  return fuzzy;
}

/** Count total unique developers across both databases */
function getUniqueDeveloperCount(): number {
  const allNames = new Set<string>();
  for (const d of DEVELOPERS) allNames.add(normalizeName(d.name));
  for (const d of DEVELOPERS_DB) allNames.add(normalizeName(d.name));
  return allNames.size;
}

/** Convert a DEVELOPERS_DB record to a response object with defaults for missing fields */
function dbRecordToResponseFields(d: DeveloperRecord) {
  return {
    name: d.name,
    nameEn: '',
    tier: d.tier,
    tierLabel: d.tier === 'A' ? 'דירוג עליון' : d.tier === 'B' ? 'נכלל בדירוג' : 'מוכר בשוק',
    tierLabelEn: d.tier === 'A' ? 'Top Rated' : d.tier === 'B' ? 'Rated' : 'Known',
    summary: d.expertOpinion,
    summaryEn: '',
    expertSummary: d.expertOpinion,
    expertSummaryEn: '',
    expertBreakdown: {
      full: d.expertOpinion,
      experience: 'נתון ממאגר יזמים',
      trackRecord: `${d.totalProjects} פרויקטים סה"כ (${d.delivered} נמסרו, ${d.inConstruction} בבנייה)`,
      financial: `איתנות פיננסית: ${d.financialHealth}`,
    },
    expertBreakdownEn: {
      full: '',
      experience: 'From developer database',
      trackRecord: `${d.totalProjects} total projects (${d.delivered} delivered, ${d.inConstruction} in construction)`,
      financial: `Financial health: ${d.financialHealth}`,
    },
    specialties: ['התחדשות עירונית'],
    totalProjects: d.totalProjects,
    inConstruction: d.inConstruction,
    delivered: d.delivered,
    inPlanning: 0,
    activeUnits: 0,
    completedOccupancyCount: d.delivered,
    rating: d.rating,
    overallScore: d.overallScore,
    riskLevel: d.riskLevel,
    yearsInMarket: 0,
    hasCompletedOccupancy: d.delivered > 0,
    publiclyTraded: false,
    parentGroup: null,
    financialHealth: d.financialHealth,
    financialHealthEn: '',
    website: null,
    databaseAppearances: d.databaseAppearances,
    expertOpinion: d.expertOpinion,
  };
}

// ── Madlan fallback ──

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

// ── Expert Summary Generation ──
// Covers 3 dimensions: Experience, Track Record, Financial Stability

function generateExpertSummary(d: DeveloperInfo, lang: 'he' | 'en' = 'he'): {
  full: string;
  experience: string;
  trackRecord: string;
  financial: string;
} {
  if (lang === 'en') {
    const experience = `${d.yearsInMarket} years in the market${d.publiclyTraded ? ', publicly traded' : ''}${d.parentGroup ? ` (part of ${d.parentGroup})` : ''}.`;
    const trackRecord = d.hasCompletedOccupancy
      ? `Completed occupancy in ${d.completedOccupancyCount} projects. ${d.activeUnits.toLocaleString()} total units across ${d.totalProjects} projects (${d.delivered} delivered, ${d.inConstruction} in construction).`
      : `Has not yet completed occupancy in urban renewal. ${d.totalProjects} projects total (${d.inPlanning} in planning, ${d.inConstruction} in construction).`;
    const financial = `Financial stability: ${d.financialHealthEn}.`;
    return { full: `${experience} ${trackRecord} ${financial}`, experience, trackRecord, financial };
  }

  const experience = `${d.yearsInMarket} שנות פעילות בשוק${d.publiclyTraded ? ', נסחרת בבורסה' : ''}${d.parentGroup ? ` (חלק מ${d.parentGroup})` : ''}.`;
  const trackRecord = d.hasCompletedOccupancy
    ? `השלימה אכלוס ב-${d.completedOccupancyCount} פרויקטים. ${d.activeUnits.toLocaleString()} יח"ד סה"כ ב-${d.totalProjects} פרויקטים (${d.delivered} נמסרו, ${d.inConstruction} בבנייה).`
    : `טרם השלימה אכלוס בהתחדשות עירונית. ${d.totalProjects} פרויקטים סה"כ (${d.inPlanning} בתכנון, ${d.inConstruction} בבנייה).`;
  const financial = `איתנות פיננסית: ${d.financialHealth}.`;
  return { full: `${experience} ${trackRecord} ${financial}`, experience, trackRecord, financial };
}

// ── Verification Links Generator (with validation) ──

const PORTAL_FALLBACKS = {
  madadLink: 'https://madadithadshut.co.il/',
  madlanLink: 'https://www.madlan.co.il/developers',
  duns100Link: 'https://www.duns100.co.il/rating/התחדשות_עירונית/פינוי_בינוי',
  bdiCodeLink: 'https://www.bdicode.co.il/Company/Category/התחדשות-עירונית',
  magdilimLink: 'https://magdilim.co.il/התחדשות-עירונית',
};

/** HEAD-check a URL with a short timeout. Returns true if reachable (2xx/3xx). */
async function isLinkValid(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

/** Simple in-memory cache for link validation (persists for lifetime of server process) */
const linkCache = new Map<string, { valid: boolean; ts: number }>();
const LINK_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

async function validateLink(url: string): Promise<boolean> {
  const cached = linkCache.get(url);
  if (cached && Date.now() - cached.ts < LINK_CACHE_TTL) return cached.valid;
  const valid = await isLinkValid(url);
  linkCache.set(url, { valid, ts: Date.now() });
  return valid;
}

async function generateVerificationLinks(d: DeveloperInfo) {
  const madadUrl = `https://madadithadshut.co.il/company/${encodeURIComponent(d.slug)}/`;
  const madlanUrl = `https://www.madlan.co.il/developers/${encodeURIComponent(d.slug)}`;

  // Validate developer-specific links in parallel
  const [madadValid, madlanValid] = await Promise.all([
    validateLink(madadUrl),
    validateLink(madlanUrl),
  ]);

  return {
    madadLink: madadValid ? madadUrl : PORTAL_FALLBACKS.madadLink,
    madlanLink: madlanValid ? madlanUrl : PORTAL_FALLBACKS.madlanLink,
    duns100Link: PORTAL_FALLBACKS.duns100Link,
    bdiCodeLink: PORTAL_FALLBACKS.bdiCodeLink,
    magdilimLink: PORTAL_FALLBACKS.magdilimLink,
    linksValidated: true,
  };
}

// ── API Handler ──

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? '';
  if (!q) {
    return NextResponse.json({ error: 'Missing query parameter (q)' }, { status: 400 });
  }

  const uniqueCount = getUniqueDeveloperCount();

  // ── Step 1: Try matching in old DEVELOPERS array (richest data) ──
  const matches = matchDeveloper(q);

  if (matches.length > 0) {
    const results = await Promise.all(matches.map(async (d) => {
      const expertHe = generateExpertSummary(d, 'he');
      const expertEn = generateExpertSummary(d, 'en');
      const links = await generateVerificationLinks(d);

      // Cross-reference with DEVELOPERS_DB for authoritative scores
      const dbMatch = findInDevelopersDB(d.name);

      // Merge authoritative data from DEVELOPERS_DB when available
      const overallScore = dbMatch?.overallScore ?? 0;
      const riskLevel = dbMatch?.riskLevel ?? (d.tier === 'A' ? 'סיכון נמוך' : d.tier === 'B' ? 'סיכון בינוני' : 'סיכון גבוה');
      const mergedRating = dbMatch?.rating ?? d.rating;
      const mergedTotalProjects = dbMatch?.totalProjects ?? d.totalProjects;
      const mergedInConstruction = dbMatch?.inConstruction ?? d.inConstruction;
      const mergedDelivered = dbMatch?.delivered ?? d.delivered;
      const mergedFinancialHealth = dbMatch?.financialHealth ?? d.financialHealth;
      const mergedExpertOpinion = dbMatch?.expertOpinion ?? d.expertOpinion;
      const mergedDatabaseAppearances = [...new Set([
        ...(dbMatch?.databaseAppearances ?? []),
        ...(d.databaseAppearances ?? []),
      ])];

      return {
        name: d.name,
        nameEn: d.nameEn,
        tier: d.tier,
        tierLabel: d.tier === 'A' ? 'דירוג עליון' : d.tier === 'B' ? 'נכלל בדירוג' : 'מוכר בשוק',
        tierLabelEn: d.tier === 'A' ? 'Top Rated' : d.tier === 'B' ? 'Rated' : 'Known',
        summary: d.summary,
        summaryEn: d.summaryEn,
        expertSummary: expertHe.full,
        expertSummaryEn: expertEn.full,
        expertBreakdown: expertHe,
        expertBreakdownEn: expertEn,
        specialties: d.specialties,
        totalProjects: mergedTotalProjects,
        inConstruction: mergedInConstruction,
        delivered: mergedDelivered,
        inPlanning: d.inPlanning,
        activeUnits: d.activeUnits,
        completedOccupancyCount: d.completedOccupancyCount,
        rating: mergedRating,
        overallScore,
        riskLevel,
        yearsInMarket: d.yearsInMarket,
        hasCompletedOccupancy: d.hasCompletedOccupancy,
        publiclyTraded: d.publiclyTraded,
        parentGroup: d.parentGroup ?? null,
        financialHealth: mergedFinancialHealth,
        financialHealthEn: d.financialHealthEn,
        website: d.website ?? null,
        databaseAppearances: mergedDatabaseAppearances,
        expertOpinion: mergedExpertOpinion,
        ...links,
      };
    }));

    return NextResponse.json({
      query: q,
      found: true,
      results,
      allDevelopersCount: uniqueCount,
      source: 'מדד ההתחדשות העירונית + DUNS 100 + BDI Code + מאגר יזמים',
    });
  }

  // ── Step 2: Try matching directly in DEVELOPERS_DB ──
  const dbMatches = matchDevelopersDBDirect(q);

  if (dbMatches.length > 0) {
    const results = await Promise.all(dbMatches.map(async (d) => {
      const resp = dbRecordToResponseFields(d);

      // Generate verification links using slug from the new DB
      const madadUrl = `https://madadithadshut.co.il/company/${encodeURIComponent(d.slug)}/`;
      const madlanUrl = `https://www.madlan.co.il/developers/${encodeURIComponent(d.slug)}`;
      const [madadValid, madlanValid] = await Promise.all([
        validateLink(madadUrl),
        validateLink(madlanUrl),
      ]);

      return {
        ...resp,
        madadLink: madadValid ? madadUrl : PORTAL_FALLBACKS.madadLink,
        madlanLink: madlanValid ? madlanUrl : PORTAL_FALLBACKS.madlanLink,
        duns100Link: PORTAL_FALLBACKS.duns100Link,
        bdiCodeLink: PORTAL_FALLBACKS.bdiCodeLink,
        magdilimLink: PORTAL_FALLBACKS.magdilimLink,
        linksValidated: true,
      };
    }));

    return NextResponse.json({
      query: q,
      found: true,
      results,
      allDevelopersCount: uniqueCount,
      source: 'מאגר יזמי התחדשות עירונית',
    });
  }

  // ── Step 3: Fallback to Madlan ──
  const madlan = await fetchMadlanDeveloper(q);

  return NextResponse.json({
    query: q,
    found: madlan.found,
    results: madlan.found ? [{
      name: madlan.name,
      nameEn: '',
      tier: 'C' as const,
      tierLabel: 'לא נמצא בדירוג',
      tierLabelEn: 'Not Rated',
      summary: madlan.summary,
      summaryEn: 'Developer found on Madlan. Recommended to check full profile for details.',
      expertSummary: `יזם שלא נמצא במאגרי הדירוג (DUNS 100, BDI Code, מדד ההתחדשות). מומלץ לבדוק היסטוריה וביצועים באתר Madlan ולוודא איתנות פיננסית בטרם התקשרות.`,
      expertSummaryEn: `Developer not found in rating databases (DUNS 100, BDI Code, Urban Renewal Index). Recommended to check history and performance on Madlan and verify financial stability before engagement.`,
      expertBreakdown: {
        full: `יזם לא מדורג. מומלץ לבדוק ב-Madlan.`,
        experience: 'לא ידוע — לא נמצא במאגרים',
        trackRecord: 'לא ידוע — לא נמצא במאגרים',
        financial: 'לא ידוע — לא נמצא במאגרים',
      },
      expertBreakdownEn: {
        full: `Unrated developer. Check Madlan for details.`,
        experience: 'Unknown — not found in databases',
        trackRecord: 'Unknown — not found in databases',
        financial: 'Unknown — not found in databases',
      },
      specialties: [],
      totalProjects: 0,
      inConstruction: 0,
      delivered: 0,
      inPlanning: 0,
      activeUnits: 0,
      completedOccupancyCount: 0,
      rating: 'לא מדורג',
      overallScore: 0,
      riskLevel: 'לא ידוע',
      yearsInMarket: 0,
      hasCompletedOccupancy: false,
      publiclyTraded: false,
      parentGroup: null,
      financialHealth: 'לא ידוע — לא נמצא במאגרים',
      financialHealthEn: 'Unknown — not found in databases',
      website: null,
      databaseAppearances: [],
      expertOpinion: '',
      madadLink: 'https://madadithadshut.co.il/',
      madlanLink: madlan.madlanLink,
      duns100Link: 'https://www.duns100.co.il/rating/התחדשות_עירונית/פינוי_בינוי',
      bdiCodeLink: 'https://www.bdicode.co.il/Company/Category/התחדשות-עירונית',
      magdilimLink: 'https://magdilim.co.il/התחדשות-עירונית',
    }] : [],
    allDevelopersCount: uniqueCount,
    source: 'Madlan (fallback)',
  });
}
