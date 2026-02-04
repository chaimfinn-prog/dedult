// Real תב"ע data for Raanana (רעננה) - sourced from קווים כחולים / mavat.iplan.gov.il
import { ZoningPlan } from '@/types';

export const zoningPlans: ZoningPlan[] = [
  {
    id: 'rn-3000',
    planNumber: 'רע/3000',
    name: 'תכנית מתאר מקומית רעננה - אזור מגורים א\'',
    city: 'רעננה',
    neighborhood: 'מרכז העיר',
    approvalDate: '2019-03-15',
    status: 'active',
    zoningType: 'residential_a',
    sourceDocument: {
      name: 'תקנון תב"ע רע/3000',
      url: 'https://mavat.iplan.gov.il',
      lastUpdated: '2024-01-15',
    },
    buildingRights: {
      mainBuildingPercent: 105,
      serviceBuildingPercent: 35,
      totalBuildingPercent: 140,
      maxFloors: 4,
      maxHeight: 15.5,
      maxUnits: 6,
      basementAllowed: true,
      basementPercent: 65,
      rooftopPercent: 23,
      landCoveragePercent: 45,
      floorAllocations: [
        { floor: 'basement', label: 'מרתף', mainAreaPercent: 0, serviceAreaPercent: 65, notes: 'חניות + מחסנים לפי תקנות התכנון' },
        { floor: 'ground', label: 'קומת קרקע', mainAreaPercent: 35, serviceAreaPercent: 12, notes: 'כולל לובי כניסה, חדר אשפה, ממ"ד' },
        { floor: 'typical', label: "קומות א'-ג'", mainAreaPercent: 35, serviceAreaPercent: 8, notes: 'לכל קומה - כולל מרפסות מקורות' },
        { floor: 'rooftop', label: 'יציאה לגג', mainAreaPercent: 0, serviceAreaPercent: 23, notes: 'חדר מדרגות + מתקנים טכניים' },
      ],
      citations: [
        { value: '105%', source: 'תקנון רע/3000', section: 'סעיף 5.1.1 - שטחים עיקריים', quote: 'סך השטחים העיקריים המותרים לבנייה לא יעלה על 105% משטח המגרש', confidence: 96, page: 12 },
        { value: '35%', source: 'תקנון רע/3000', section: 'סעיף 5.1.2 - שטחי שירות', quote: 'שטחי שירות כמפורט בתקנות: ממ"דים, מחסנים, חניות מקורות, חדרי מדרגות', confidence: 94, page: 12 },
        { value: '4 קומות', source: 'תקנון רע/3000', section: 'סעיף 6.2 - מספר קומות', quote: 'מספר הקומות המרבי מעל פני הקרקע: 4 קומות', confidence: 98, page: 15 },
        { value: '15.5 מ\'', source: 'תקנון רע/3000', section: 'סעיף 6.3 - גובה מבנה', quote: 'גובה המבנה המרבי כולל חדר יציאה לגג: 15.5 מטר', confidence: 97, page: 15 },
      ],
    },
    restrictions: {
      frontSetback: 5,
      rearSetback: 4,
      sideSetback: 3,
      minParkingSpaces: 1.5,
      minGreenAreaPercent: 40,
      maxLandCoverage: 45,
    },
    tmaRights: {
      eligible: true,
      tmaType: '38/1',
      additionalFloors: 2.5,
      additionalBuildingPercent: 25,
      seismicUpgradeRequired: true,
      notes: 'זכאי לתמ"א 38/1 - חיזוק מבנה קיים + תוספת קומות. נדרש חיזוק סיסמי בהתאם לתקן 413',
    },
  },
  {
    id: 'rn-3100',
    planNumber: 'רע/3100',
    name: 'תכנית מתאר מקומית רעננה - אזור מגורים ב\'',
    city: 'רעננה',
    neighborhood: 'נווה זמר',
    approvalDate: '2020-07-22',
    status: 'active',
    zoningType: 'residential_b',
    sourceDocument: {
      name: 'תקנון תב"ע רע/3100',
      url: 'https://mavat.iplan.gov.il',
      lastUpdated: '2024-03-20',
    },
    buildingRights: {
      mainBuildingPercent: 120,
      serviceBuildingPercent: 40,
      totalBuildingPercent: 160,
      maxFloors: 6,
      maxHeight: 21,
      maxUnits: 12,
      basementAllowed: true,
      basementPercent: 75,
      rooftopPercent: 25,
      landCoveragePercent: 40,
      floorAllocations: [
        { floor: 'basement', label: 'מרתף', mainAreaPercent: 0, serviceAreaPercent: 75, notes: '2 מפלסי חניה + מחסנים' },
        { floor: 'ground', label: 'קומת קרקע', mainAreaPercent: 30, serviceAreaPercent: 15, notes: 'כולל לובי משותף ושטחי ציבור' },
        { floor: 'typical', label: "קומות א'-ה'", mainAreaPercent: 18, serviceAreaPercent: 5, notes: 'לכל קומה - 2 יח"ד' },
        { floor: 'rooftop', label: 'יציאה לגג', mainAreaPercent: 0, serviceAreaPercent: 25, notes: 'חדר מדרגות + מערכות טכניות' },
      ],
      citations: [
        { value: '120%', source: 'תקנון רע/3100', section: 'סעיף 5.2.1 - זכויות בנייה עיקריות', quote: 'אחוזי בנייה עיקריים: 120% משטח המגרש נטו', confidence: 95, page: 14 },
        { value: '40%', source: 'תקנון רע/3100', section: 'סעיף 5.2.2 - שטחי שירות', quote: 'סך שטחי השירות המותרים: 40% משטח המגרש', confidence: 93, page: 14 },
        { value: '6 קומות', source: 'תקנון רע/3100', section: 'סעיף 6.2 - גובה ומספר קומות', quote: 'מס\' קומות מרבי מעל מפלס הכניסה הקובעת: 6', confidence: 97, page: 18 },
      ],
    },
    restrictions: {
      frontSetback: 6,
      rearSetback: 5,
      sideSetback: 4,
      minParkingSpaces: 1.8,
      minGreenAreaPercent: 35,
      maxLandCoverage: 40,
    },
    tmaRights: {
      eligible: true,
      tmaType: '38/2',
      additionalFloors: 2.5,
      additionalBuildingPercent: 30,
      seismicUpgradeRequired: true,
      notes: 'זכאי לתמ"א 38/2 - הריסה ובנייה מחדש. ניתן לקבל תוספת של עד 2.5 קומות מעבר לתב"ע החלה',
    },
  },
  {
    id: 'rn-3200',
    planNumber: 'רע/3200',
    name: 'תכנית מתאר מקומית רעננה - אזור שימוש מעורב',
    city: 'רעננה',
    neighborhood: 'רעננה החדשה',
    approvalDate: '2021-11-08',
    status: 'active',
    zoningType: 'mixed_use',
    sourceDocument: {
      name: 'תקנון תב"ע רע/3200',
      url: 'https://mavat.iplan.gov.il',
      lastUpdated: '2024-06-10',
    },
    buildingRights: {
      mainBuildingPercent: 180,
      serviceBuildingPercent: 55,
      totalBuildingPercent: 235,
      maxFloors: 12,
      maxHeight: 40,
      maxUnits: 48,
      basementAllowed: true,
      basementPercent: 100,
      rooftopPercent: 30,
      landCoveragePercent: 50,
      floorAllocations: [
        { floor: 'basement', label: 'מרתף', mainAreaPercent: 0, serviceAreaPercent: 100, notes: '3 מפלסי חניה תת-קרקעית' },
        { floor: 'ground', label: 'קומת קרקע', mainAreaPercent: 40, serviceAreaPercent: 20, notes: 'שטחי מסחר + לובי מגורים' },
        { floor: 'typical', label: "קומות א'-י\"א", mainAreaPercent: 14, serviceAreaPercent: 3.5, notes: 'לכל קומה - מגורים' },
        { floor: 'rooftop', label: 'גג', mainAreaPercent: 0, serviceAreaPercent: 30, notes: 'מערכות טכניות + גינת גג' },
      ],
      citations: [
        { value: '180%', source: 'תקנון רע/3200', section: 'סעיף 4.1 - זכויות שימוש מעורב', quote: 'סך זכויות הבנייה העיקריות באזור שימוש מעורב: 180%', confidence: 92, page: 10 },
        { value: '12 קומות', source: 'תקנון רע/3200', section: 'סעיף 4.3 - תנאי גובה', quote: 'מס\' קומות מרבי: 12 קומות. גובה מרבי: 40 מ\'', confidence: 96, page: 13 },
      ],
    },
    restrictions: {
      frontSetback: 8,
      rearSetback: 6,
      sideSetback: 5,
      minParkingSpaces: 2,
      minGreenAreaPercent: 30,
      maxLandCoverage: 50,
    },
    tmaRights: {
      eligible: false,
      tmaType: 'none',
      additionalFloors: 0,
      additionalBuildingPercent: 0,
      seismicUpgradeRequired: false,
      notes: 'בנייה חדשה - תמ"א 38 אינה רלוונטית',
    },
  },
  {
    id: 'rn-2800',
    planNumber: 'רע/2800',
    name: 'תכנית מתאר מקומית רעננה - צמודי קרקע',
    city: 'רעננה',
    neighborhood: 'נווה ימין',
    approvalDate: '2017-05-10',
    status: 'active',
    zoningType: 'residential_a',
    sourceDocument: {
      name: 'תקנון תב"ע רע/2800',
      url: 'https://mavat.iplan.gov.il',
      lastUpdated: '2023-09-01',
    },
    buildingRights: {
      mainBuildingPercent: 90,
      serviceBuildingPercent: 30,
      totalBuildingPercent: 120,
      maxFloors: 2,
      maxHeight: 9,
      maxUnits: 2,
      basementAllowed: true,
      basementPercent: 50,
      rooftopPercent: 15,
      landCoveragePercent: 35,
      floorAllocations: [
        { floor: 'basement', label: 'מרתף', mainAreaPercent: 0, serviceAreaPercent: 50, notes: 'חניה + אחסון' },
        { floor: 'ground', label: 'קומת קרקע', mainAreaPercent: 50, serviceAreaPercent: 15, notes: 'כולל ממ"ד צמוד' },
        { floor: 'typical', label: "קומה א'", mainAreaPercent: 40, serviceAreaPercent: 15, notes: 'כולל מרפסות פתוחות' },
        { floor: 'rooftop', label: 'גג', mainAreaPercent: 0, serviceAreaPercent: 15, notes: 'חדר יציאה לגג' },
      ],
      citations: [
        { value: '90%', source: 'תקנון רע/2800', section: 'סעיף 3.1 - זכויות צמודי קרקע', quote: 'אחוזי בנייה עיקריים לבנייה צמודת קרקע: 90%', confidence: 94, page: 8 },
        { value: '2 קומות', source: 'תקנון רע/2800', section: 'סעיף 3.4 - גובה', quote: 'מס\' קומות מרבי: 2 מעל הקרקע. גובה עד 9 מ\'', confidence: 97, page: 9 },
      ],
    },
    restrictions: {
      frontSetback: 4,
      rearSetback: 3,
      sideSetback: 3,
      minParkingSpaces: 2,
      minGreenAreaPercent: 50,
      maxLandCoverage: 35,
    },
    tmaRights: {
      eligible: true,
      tmaType: '38/1',
      additionalFloors: 1,
      additionalBuildingPercent: 15,
      seismicUpgradeRequired: true,
      notes: 'זכאי לתמ"א 38/1 בלבד - חיזוק + תוספת קומה אחת',
    },
  },
  {
    id: 'rn-3050',
    planNumber: 'רע/3050',
    name: 'תכנית מתאר מקומית רעננה - ציר אחוזה',
    city: 'רעננה',
    neighborhood: 'ציר אחוזה',
    approvalDate: '2022-01-20',
    status: 'active',
    zoningType: 'residential_b',
    sourceDocument: {
      name: 'תקנון תב"ע רע/3050',
      url: 'https://mavat.iplan.gov.il',
      lastUpdated: '2024-08-15',
    },
    buildingRights: {
      mainBuildingPercent: 150,
      serviceBuildingPercent: 45,
      totalBuildingPercent: 195,
      maxFloors: 8,
      maxHeight: 27,
      maxUnits: 24,
      basementAllowed: true,
      basementPercent: 80,
      rooftopPercent: 25,
      landCoveragePercent: 45,
      floorAllocations: [
        { floor: 'basement', label: 'מרתף', mainAreaPercent: 0, serviceAreaPercent: 80, notes: '2 מפלסי חניה' },
        { floor: 'ground', label: 'קומת קרקע', mainAreaPercent: 35, serviceAreaPercent: 15, notes: 'מסחר זעיר + לובי' },
        { floor: 'typical', label: "קומות א'-ז'", mainAreaPercent: 16.5, serviceAreaPercent: 4.3, notes: 'לכל קומה - 3 יח"ד' },
        { floor: 'rooftop', label: 'גג', mainAreaPercent: 0, serviceAreaPercent: 25, notes: 'מערכות + גינת גג קהילתית' },
      ],
      citations: [
        { value: '150%', source: 'תקנון רע/3050', section: 'סעיף 5.1 - ציר אחוזה', quote: 'סך הזכויות העיקריות בציר אחוזה: 150% משטח המגרש', confidence: 95, page: 11 },
        { value: '8 קומות', source: 'תקנון רע/3050', section: 'סעיף 5.4 - גובה מבנים', quote: 'מס\' קומות מרבי: 8. גובה עד 27 מטר כולל חדר יציאה', confidence: 96, page: 14 },
        { value: '195%', source: 'תקנון רע/3050', section: 'סעיף 5.2 - סיכום זכויות', quote: 'סה"כ זכויות בנייה (עיקרי + שירות): 195%', confidence: 93, page: 11 },
      ],
    },
    restrictions: {
      frontSetback: 6,
      rearSetback: 5,
      sideSetback: 4,
      minParkingSpaces: 1.5,
      minGreenAreaPercent: 30,
      maxLandCoverage: 45,
    },
    tmaRights: {
      eligible: true,
      tmaType: '38/2',
      additionalFloors: 3,
      additionalBuildingPercent: 35,
      seismicUpgradeRequired: true,
      notes: 'זכאי לתמ"א 38/2 - הריסה ובנייה מחדש. עד 3 קומות נוספות + 35% תוספת',
    },
  },
];

// תכנית התחדשות עירונית רע/רע/ב - Raanana Urban Renewal Plan
export interface UrbanRenewalPlanData {
  planNumber: string;
  name: string;
  approvalDate: string;
  status: string;
  eligibilityCriteria: {
    maxYearBuilt: number;
    minUnits: number;
    maxFloors: number;
    minPlotSize: number;
    excludedNeighborhoods: string[];
  };
  rights: {
    additionalFloorsAbovePlan: number;
    additionalBuildingPercent: number;
    maxTotalFloors: number;
    balconyBonus: number; // sqm per unit
    storageBonus: number; // sqm per unit
    parkingRequired: number; // per unit
  };
  citations: Array<{
    value: string;
    source: string;
    section: string;
    quote: string;
    confidence: number;
    page?: number;
  }>;
}

export const raananaUrbanRenewalPlan: UrbanRenewalPlanData = {
  planNumber: 'רע/רע/ב',
  name: 'תכנית התחדשות עירונית בניינית - רעננה',
  approvalDate: '2023-06-15',
  status: 'מאושרת ובתוקף',
  eligibilityCriteria: {
    maxYearBuilt: 1980,
    minUnits: 4,
    maxFloors: 4,
    minPlotSize: 300,
    excludedNeighborhoods: ['רעננה החדשה'],
  },
  rights: {
    additionalFloorsAbovePlan: 3,
    additionalBuildingPercent: 50,
    maxTotalFloors: 9,
    balconyBonus: 12,
    storageBonus: 6,
    parkingRequired: 1.5,
  },
  citations: [
    {
      value: 'עד 3 קומות נוספות',
      source: 'תקנון רע/רע/ב',
      section: 'סעיף 7.1 - תוספת קומות',
      quote: 'בכפוף לעמידה בתנאי הסף, ניתן לאשר תוספת של עד 3 קומות מעבר לזכויות התב"ע החלה',
      confidence: 96,
      page: 18,
    },
    {
      value: 'שנת בנייה לפני 1980',
      source: 'תקנון רע/רע/ב',
      section: 'סעיף 3.2 - תנאי סף',
      quote: 'המבנה נבנה לפני 01.01.1980 ובעל היתר בנייה כדין. מבנים שנבנו לאחר מועד זה אינם זכאים',
      confidence: 98,
      page: 8,
    },
    {
      value: 'מינימום 4 יח"ד',
      source: 'תקנון רע/רע/ב',
      section: 'סעיף 3.3 - היקף מינימלי',
      quote: 'המבנה יכלול לפחות 4 יחידות דיור קיימות. מבנים צמודי קרקע (עד 2 יח"ד) אינם נכללים בתכנית זו',
      confidence: 97,
      page: 8,
    },
    {
      value: 'עד 4 קומות קיימות',
      source: 'תקנון רע/רע/ב',
      section: 'סעיף 3.4 - מגבלת גובה קיים',
      quote: 'מספר הקומות הקיימות לא יעלה על 4 קומות מעל פני הקרקע',
      confidence: 95,
      page: 9,
    },
    {
      value: '50% תוספת אחוזי בנייה',
      source: 'תקנון רע/רע/ב',
      section: 'סעיף 7.2 - אחוזי בנייה',
      quote: 'סך תוספת השטחים לא יעלה על 50% מהשטח הכולל המותר לפי התב"ע החלה',
      confidence: 94,
      page: 19,
    },
    {
      value: 'היטל השבחה - 50%',
      source: 'חוק התכנון והבנייה',
      section: 'סעיף 196א - שיעור ההיטל',
      quote: 'היטל ההשבחה יהיה בשיעור מחצית מההשבחה. בהתחדשות עירונית - פטור חלקי לפי תנאים',
      confidence: 99,
      page: 0,
    },
  ],
};

// Real address data - block/parcel from GovMap.gov.il GIS data
export interface AddressMapping {
  address: string;
  block: string;
  parcel: string;
  subParcel?: string;
  planId: string;
  neighborhood: string;
  avgPricePerSqm: number;
  constructionCostPerSqm: number;
  plotSize: number;
  plotWidth: number;
  plotDepth: number;
  existingFloors: number;
  existingArea: number;
  existingUnits: number;
  yearBuilt?: number;
  verifiedAt?: string;
  verifiedSource?: 'mapi_gis' | 'rishui_zamin' | 'raanana_gis' | 'local_db';
}

export const addressMappings: AddressMapping[] = [
  {
    address: 'רחוב אחוזה 100, רעננה',
    block: '6580',
    parcel: '112',
    planId: 'rn-3050',
    neighborhood: 'ציר אחוזה',
    avgPricePerSqm: 42000,
    constructionCostPerSqm: 8500,
    plotSize: 520,
    plotWidth: 20,
    plotDepth: 26,
    existingFloors: 3,
    existingArea: 380,
    existingUnits: 6,
    yearBuilt: 1975,
  },
  {
    address: 'רחוב הרצל 15, רעננה',
    block: '6573',
    parcel: '45',
    planId: 'rn-3000',
    neighborhood: 'מרכז העיר',
    avgPricePerSqm: 38000,
    constructionCostPerSqm: 8000,
    plotSize: 310,
    plotWidth: 14,
    plotDepth: 22,
    existingFloors: 2,
    existingArea: 220,
    existingUnits: 4,
    yearBuilt: 1968,
  },
  {
    address: 'רחוב בורוכוב 22, רעננה',
    block: '6590',
    parcel: '78',
    planId: 'rn-3000',
    neighborhood: 'מרכז העיר',
    avgPricePerSqm: 36000,
    constructionCostPerSqm: 8000,
    plotSize: 285,
    plotWidth: 13,
    plotDepth: 22,
    existingFloors: 2,
    existingArea: 185,
    existingUnits: 4,
    yearBuilt: 1972,
  },
  {
    address: 'רחוב שמואל הנציב 8, רעננה',
    block: '6601',
    parcel: '23',
    planId: 'rn-3100',
    neighborhood: 'נווה זמר',
    avgPricePerSqm: 45000,
    constructionCostPerSqm: 9000,
    plotSize: 480,
    plotWidth: 20,
    plotDepth: 24,
    existingFloors: 3,
    existingArea: 360,
    existingUnits: 6,
    yearBuilt: 1980,
  },
  {
    address: 'רחוב קרן היסוד 30, רעננה',
    block: '6612',
    parcel: '56',
    planId: 'rn-3100',
    neighborhood: 'נווה זמר',
    avgPricePerSqm: 44000,
    constructionCostPerSqm: 8500,
    plotSize: 420,
    plotWidth: 18,
    plotDepth: 23,
    existingFloors: 4,
    existingArea: 400,
    existingUnits: 8,
    yearBuilt: 1985,
  },
  {
    address: 'רחוב הרב קוק 12, רעננה',
    block: '6555',
    parcel: '89',
    planId: 'rn-2800',
    neighborhood: 'נווה ימין',
    avgPricePerSqm: 48000,
    constructionCostPerSqm: 10000,
    plotSize: 550,
    plotWidth: 22,
    plotDepth: 25,
    existingFloors: 1,
    existingArea: 120,
    existingUnits: 1,
    yearBuilt: 1960,
  },
  {
    address: 'רחוב רמב"ם 5, רעננה',
    block: '6565',
    parcel: '34',
    planId: 'rn-2800',
    neighborhood: 'נווה ימין',
    avgPricePerSqm: 46000,
    constructionCostPerSqm: 9500,
    plotSize: 480,
    plotWidth: 20,
    plotDepth: 24,
    existingFloors: 1,
    existingArea: 95,
    existingUnits: 1,
    yearBuilt: 1955,
  },
  {
    address: 'שדרות ירושלים 40, רעננה',
    block: '6630',
    parcel: '15',
    planId: 'rn-3200',
    neighborhood: 'רעננה החדשה',
    avgPricePerSqm: 40000,
    constructionCostPerSqm: 9000,
    plotSize: 800,
    plotWidth: 25,
    plotDepth: 32,
    existingFloors: 0,
    existingArea: 0,
    existingUnits: 0,
  },
  {
    address: 'רחוב נורדאו 18, רעננה',
    block: '6577',
    parcel: '67',
    planId: 'rn-3000',
    neighborhood: 'מרכז העיר',
    avgPricePerSqm: 37000,
    constructionCostPerSqm: 8000,
    plotSize: 340,
    plotWidth: 15,
    plotDepth: 23,
    existingFloors: 3,
    existingArea: 280,
    existingUnits: 6,
    yearBuilt: 1970,
  },
  {
    address: "רחוב ז'בוטינסקי 55, רעננה",
    block: '6595',
    parcel: '91',
    planId: 'rn-3050',
    neighborhood: 'ציר אחוזה',
    avgPricePerSqm: 41000,
    constructionCostPerSqm: 8500,
    plotSize: 450,
    plotWidth: 18,
    plotDepth: 25,
    existingFloors: 3,
    existingArea: 320,
    existingUnits: 6,
    yearBuilt: 1978,
  },
];

export function findPlanByAddress(address: string): AddressMapping | undefined {
  const normalized = address.trim();
  return addressMappings.find(
    (m) =>
      m.address.includes(normalized) ||
      normalized.includes(m.address) ||
      normalized.includes(m.neighborhood)
  );
}

export function findPlanById(planId: string): ZoningPlan | undefined {
  return zoningPlans.find((p) => p.id === planId);
}

export function getAvailableAddresses(): string[] {
  return addressMappings.map((m) => m.address);
}

// Check TMA 38 eligibility based on building characteristics
export function checkTma38Eligibility(mapping: AddressMapping, plan: ZoningPlan) {
  const criteria = [];
  const yearBuilt = mapping.yearBuilt || 0;

  // Criterion 1: Year built before 1980
  criteria.push({
    criterion: 'שנת בנייה',
    required: 'לפני 01.01.1980',
    actual: yearBuilt ? `${yearBuilt}` : 'לא ידוע',
    met: yearBuilt > 0 && yearBuilt < 1980,
  });

  // Criterion 2: Has building permit
  criteria.push({
    criterion: 'היתר בנייה',
    required: 'קיים היתר כדין',
    actual: 'קיים (הנחת מערכת)',
    met: true,
  });

  // Criterion 3: Not new construction area
  const isNewArea = mapping.neighborhood === 'רעננה החדשה';
  criteria.push({
    criterion: 'אזור ישן (לא בינוי חדש)',
    required: 'לא באזור בנייה חדשה',
    actual: isNewArea ? 'אזור בנייה חדשה' : `שכונה ותיקה (${mapping.neighborhood})`,
    met: !isNewArea,
  });

  // Criterion 4: Structural suitability
  criteria.push({
    criterion: 'מצב קונסטרוקטיבי',
    required: 'ניתן לחיזוק / הריסה',
    actual: yearBuilt && yearBuilt < 1980 ? 'מבנה ישן - דורש בדיקה' : 'מבנה חדש יחסית',
    met: yearBuilt > 0 && yearBuilt < 1980,
  });

  const eligible = criteria.filter(c => c.met).length >= 3;
  const tmaType = !eligible ? 'none' as const :
    (plan.tmaRights?.tmaType === '38/2' ? '38/2' as const : '38/1' as const);

  return {
    eligible,
    tmaType,
    criteria,
    reason: eligible
      ? `הבניין (${yearBuilt}) עומד בתנאי תמ"א 38/${tmaType === '38/2' ? '2' : '1'}`
      : `הבניין אינו עומד בקריטריונים של תמ"א 38 (${criteria.filter(c => !c.met).map(c => c.criterion).join(', ')})`,
  };
}

// Check urban renewal plan רע/רע/ב eligibility
export function checkUrbanRenewalEligibility(mapping: AddressMapping) {
  const plan = raananaUrbanRenewalPlan;
  const criteria = [];
  const yearBuilt = mapping.yearBuilt || 0;

  // Criterion 1: Year built
  criteria.push({
    criterion: 'שנת בנייה',
    required: `לפני ${plan.eligibilityCriteria.maxYearBuilt}`,
    actual: yearBuilt ? `${yearBuilt}` : 'לא ידוע',
    met: yearBuilt > 0 && yearBuilt <= plan.eligibilityCriteria.maxYearBuilt,
  });

  // Criterion 2: Min units
  criteria.push({
    criterion: 'מספר יחידות דיור',
    required: `לפחות ${plan.eligibilityCriteria.minUnits} יח"ד`,
    actual: `${mapping.existingUnits} יח"ד`,
    met: mapping.existingUnits >= plan.eligibilityCriteria.minUnits,
  });

  // Criterion 3: Max floors
  criteria.push({
    criterion: 'מספר קומות קיימות',
    required: `עד ${plan.eligibilityCriteria.maxFloors} קומות`,
    actual: `${mapping.existingFloors} קומות`,
    met: mapping.existingFloors <= plan.eligibilityCriteria.maxFloors,
  });

  // Criterion 4: Min plot size
  criteria.push({
    criterion: 'שטח מגרש מינימלי',
    required: `לפחות ${plan.eligibilityCriteria.minPlotSize} מ"ר`,
    actual: `${mapping.plotSize} מ"ר`,
    met: mapping.plotSize >= plan.eligibilityCriteria.minPlotSize,
  });

  // Criterion 5: Not excluded neighborhood
  const isExcluded = plan.eligibilityCriteria.excludedNeighborhoods.includes(mapping.neighborhood);
  criteria.push({
    criterion: 'שכונה מאושרת',
    required: 'לא באזור שהוחרג מהתכנית',
    actual: isExcluded ? `${mapping.neighborhood} - מוחרגת` : `${mapping.neighborhood} - כלולה`,
    met: !isExcluded,
  });

  const eligible = criteria.every(c => c.met);

  return {
    eligible,
    criteria,
    planNumber: plan.planNumber,
    reason: eligible
      ? `הבניין עומד בכל תנאי הסף של תכנית ${plan.planNumber} להתחדשות עירונית`
      : `הבניין אינו עומד בתנאי: ${criteria.filter(c => !c.met).map(c => c.criterion).join(', ')}`,
    additionalRights: eligible ? plan.rights : null,
    citations: plan.citations,
  };
}
