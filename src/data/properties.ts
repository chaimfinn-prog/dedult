import type {
  Property,
  ZoningPlan,
  BuildingRights,
  Enhancement,
  DuchEfes,
  SourceReference,
  PropertyAnalysis,
} from '@/types';

// ===== Source References =====
const sources: SourceReference[] = [
  {
    id: 'src-1',
    documentName: 'תב"ע רע/1/1/א - תכנית מתאר רעננה',
    planNumber: 'רע/1/1/א',
    pageNumber: 12,
    sectionTitle: 'סעיף 10 - אחוזי בנייה למגורים א\'',
    quote: 'שטח הבנייה המותר למגרש בייעוד מגורים א\' יהיה 140% משטח המגרש, כולל שטחי שירות בשיעור של 25% מהשטח העיקרי.',
    confidence: 97,
  },
  {
    id: 'src-2',
    documentName: 'תב"ע רע/1/1/א - תכנית מתאר רעננה',
    planNumber: 'רע/1/1/א',
    pageNumber: 14,
    sectionTitle: 'סעיף 12 - גובה מבנים',
    quote: 'גובה המבנה המרבי באזור מגורים א\' לא יעלה על 12 מטר, ולא יכלול יותר מ-3 קומות מעל מפלס הכניסה הקובעת.',
    confidence: 95,
  },
  {
    id: 'src-3',
    documentName: 'תב"ע רע/1/1/א - תכנית מתאר רעננה',
    planNumber: 'רע/1/1/א',
    pageNumber: 18,
    sectionTitle: 'סעיף 15 - קווי בניין',
    quote: 'קו בניין קדמי: 5 מטר. קו בניין צדדי: 3 מטר מכל צד. קו בניין אחורי: 6 מטר.',
    confidence: 98,
  },
  {
    id: 'src-4',
    documentName: 'תב"ע רע/1/1/א - תכנית מתאר רעננה',
    planNumber: 'רע/1/1/א',
    pageNumber: 22,
    sectionTitle: 'סעיף 18 - מרתפים',
    quote: 'מותרת בניית מרתף בשטח שלא יעלה על 50% משטח קומת הקרקע, ובלבד שישמש לצרכי המגורים בלבד.',
    confidence: 94,
  },
  {
    id: 'src-5',
    documentName: 'תב"ע רע/1/1/א - תכנית מתאר רעננה',
    planNumber: 'רע/1/1/א',
    pageNumber: 25,
    sectionTitle: 'סעיף 20 - בריכות שחייה',
    quote: 'בריכת שחייה מותרת במגרש ששטחו עולה על 400 מ"ר, בתנאי שמרחק הבריכה מגבול המגרש לא יפחת מ-3 מטר.',
    confidence: 96,
  },
  {
    id: 'src-6',
    documentName: 'תב"ע רע/2/3 - תכנית התחדשות עירונית',
    planNumber: 'רע/2/3',
    pageNumber: 8,
    sectionTitle: 'סעיף 5 - זכויות בנייה לפינוי-בינוי',
    quote: 'במסלול פינוי-בינוי (תמ"א 38/2), יותרו זכויות בנייה של עד 280% משטח המגרש, בכפוף לאישור הוועדה המקומית.',
    confidence: 93,
  },
  {
    id: 'src-7',
    documentName: 'תב"ע רע/2/3 - תכנית התחדשות עירונית',
    planNumber: 'רע/2/3',
    pageNumber: 15,
    sectionTitle: 'סעיף 11 - היטל השבחה',
    quote: 'שיעור היטל ההשבחה לפרויקטי פינוי-בינוי יעמוד על 50% מעליית שווי המקרקעין כתוצאה מאישור התכנית.',
    confidence: 91,
  },
  {
    id: 'src-8',
    documentName: 'תב"ע רע/2/3 - תכנית התחדשות עירונית',
    planNumber: 'רע/2/3',
    pageNumber: 20,
    sectionTitle: 'סעיף 14 - תמהיל דירות',
    quote: 'הפרויקט יכלול לפחות 20% דירות בנות 3 חדרים, 40% דירות בנות 4 חדרים, ויתרת הדירות לפי שיקול הוועדה.',
    confidence: 89,
  },
];

// ===== Mock Properties =====
const properties: Property[] = [
  {
    id: 'prop-1',
    address: 'אחוזה 45',
    city: 'רעננה',
    gush: 6573,
    chelka: 142,
    plotArea: 520,
    builtArea: 180,
    floors: 2,
    yearBuilt: 1998,
    landUse: 'מגורים א\'',
    zone: 'מג/א',
    neighborhoodName: 'נווה זמר',
  },
  {
    id: 'prop-2',
    address: 'הרצל 12',
    city: 'רעננה',
    gush: 6570,
    chelka: 88,
    plotArea: 1200,
    builtArea: 850,
    floors: 4,
    yearBuilt: 1975,
    landUse: 'מגורים ב\'',
    zone: 'מג/ב',
    neighborhoodName: 'מרכז העיר',
  },
  {
    id: 'prop-3',
    address: 'כצנלסון 78',
    city: 'רעננה',
    gush: 6575,
    chelka: 215,
    plotArea: 680,
    builtArea: 220,
    floors: 2,
    yearBuilt: 2005,
    landUse: 'מגורים א\'',
    zone: 'מג/א',
    neighborhoodName: 'רעננה החדשה',
  },
  {
    id: 'prop-4',
    address: 'בורוכוב 33',
    city: 'רעננה',
    gush: 6571,
    chelka: 56,
    plotArea: 950,
    builtArea: 720,
    floors: 3,
    yearBuilt: 1982,
    landUse: 'מגורים ב\'',
    zone: 'מג/ב',
    neighborhoodName: 'מרכז העיר',
  },
  {
    id: 'prop-5',
    address: 'ז\'בוטינסקי 101',
    city: 'רעננה',
    gush: 6580,
    chelka: 310,
    plotArea: 450,
    builtArea: 160,
    floors: 2,
    yearBuilt: 2010,
    landUse: 'מגורים א\'',
    zone: 'מג/א',
    neighborhoodName: 'נווה זמר',
  },
];

// ===== Zoning Plans =====
const zoningPlans: Record<string, ZoningPlan> = {
  'מג/א': {
    planNumber: 'רע/1/1/א',
    planName: 'תכנית מתאר רעננה - מגורים א\'',
    approvalDate: '2019-03-15',
    city: 'רעננה',
    status: 'approved',
    buildingPercentage: 140,
    maxFloors: 3,
    maxHeight: 12,
    frontSetback: 5,
    sideSetback: 3,
    rearSetback: 6,
    allowedUses: ['מגורים', 'עבודה מהבית', 'גן ילדים (בתנאים)'],
    parkingRatio: 2,
    publicAreaPercentage: 0,
    serviceAreaPercentage: 25,
    basementAllowed: true,
    poolAllowed: true,
    balconyPercentage: 12,
    sources: [sources[0], sources[1], sources[2]],
  },
  'מג/ב': {
    planNumber: 'רע/2/3',
    planName: 'תכנית התחדשות עירונית - מגורים ב\'',
    approvalDate: '2021-07-20',
    city: 'רעננה',
    status: 'approved',
    buildingPercentage: 280,
    maxFloors: 12,
    maxHeight: 40,
    frontSetback: 5,
    sideSetback: 4,
    rearSetback: 6,
    allowedUses: ['מגורים', 'מסחר בקומת קרקע', 'משרדים'],
    parkingRatio: 1.5,
    publicAreaPercentage: 15,
    serviceAreaPercentage: 25,
    basementAllowed: true,
    poolAllowed: false,
    balconyPercentage: 14,
    sources: [sources[5], sources[6], sources[7]],
  },
};

// ===== Building Rights Calculator =====
function calculateBuildingRights(property: Property, plan: ZoningPlan): BuildingRights {
  const mainBuild = (property.plotArea * plan.buildingPercentage) / 100;
  const serviceArea = (mainBuild * plan.serviceAreaPercentage) / 100;
  const balconyArea = (mainBuild * plan.balconyPercentage) / 100;
  const basementArea = plan.basementAllowed ? property.plotArea * 0.5 : 0;
  const total = mainBuild + serviceArea + balconyArea;

  return {
    totalAllowed: Math.round(mainBuild),
    currentBuilt: property.builtArea,
    remaining: Math.round(mainBuild - property.builtArea),
    mainBuildPercentage: plan.buildingPercentage,
    serviceAreaAllowed: Math.round(serviceArea),
    balconyAllowed: Math.round(balconyArea),
    basementAllowed: Math.round(basementArea),
    totalWithServices: Math.round(total),
    breakdown: [
      {
        label: 'שטח עיקרי',
        percentage: plan.buildingPercentage,
        sqm: Math.round(mainBuild),
        source: sources[0],
      },
      {
        label: 'שטחי שירות',
        percentage: plan.serviceAreaPercentage,
        sqm: Math.round(serviceArea),
        source: sources[0],
      },
      {
        label: 'מרפסות',
        percentage: plan.balconyPercentage,
        sqm: Math.round(balconyArea),
        source: sources[0],
      },
      ...(plan.basementAllowed
        ? [
            {
              label: 'מרתף',
              percentage: 50,
              sqm: Math.round(basementArea),
              source: sources[3],
            },
          ]
        : []),
    ],
    sources: [sources[0], sources[1]],
  };
}

// ===== Enhancement Opportunities =====
function calculateEnhancements(
  property: Property,
  plan: ZoningPlan,
  rights: BuildingRights
): Enhancement[] {
  const enhancements: Enhancement[] = [];

  // Extension
  if (rights.remaining > 0) {
    enhancements.push({
      type: 'extension',
      title: 'הרחבת מגורים',
      description: `ניתן להוסיף עד ${rights.remaining} מ"ר לבית הקיים`,
      additionalSqm: rights.remaining,
      estimatedCost: rights.remaining * 8500,
      estimatedValueAdd: rights.remaining * 32000,
      isEligible: true,
      eligibilityReason: `נותרו ${rights.remaining} מ"ר זכויות בנייה בלתי מנוצלות`,
      source: sources[0],
    });
  }

  // Pool
  enhancements.push({
    type: 'pool',
    title: 'בריכת שחייה',
    description:
      property.plotArea >= 400
        ? 'המגרש עומד בדרישת הגודל המינימלי לבריכה'
        : 'המגרש קטן מהגודל המינימלי הנדרש (400 מ"ר)',
    additionalSqm: 32,
    estimatedCost: 180000,
    estimatedValueAdd: 450000,
    isEligible: plan.poolAllowed && property.plotArea >= 400,
    eligibilityReason:
      property.plotArea >= 400
        ? 'עומד בדרישות התב"ע לבריכת שחייה'
        : `שטח המגרש (${property.plotArea} מ"ר) קטן מהמינימום הנדרש (400 מ"ר)`,
    source: sources[4],
  });

  // Basement
  if (plan.basementAllowed) {
    enhancements.push({
      type: 'basement',
      title: 'מרתף',
      description: `מותר לבנות מרתף עד ${rights.basementAllowed} מ"ר`,
      additionalSqm: rights.basementAllowed,
      estimatedCost: rights.basementAllowed * 6000,
      estimatedValueAdd: rights.basementAllowed * 18000,
      isEligible: true,
      eligibilityReason: 'מרתף מותר על פי התב"ע',
      source: sources[3],
    });
  }

  // Extra Floor
  if (property.floors < plan.maxFloors) {
    const floorArea = Math.round(property.builtArea / property.floors);
    enhancements.push({
      type: 'floor',
      title: 'קומה נוספת',
      description: `ניתן להוסיף עד ${plan.maxFloors - property.floors} קומות`,
      additionalSqm: floorArea,
      estimatedCost: floorArea * 9000,
      estimatedValueAdd: floorArea * 35000,
      isEligible: rights.remaining >= floorArea,
      eligibilityReason:
        rights.remaining >= floorArea
          ? `יתרת זכויות בנייה מספיקה (${rights.remaining} מ"ר)`
          : `יתרת זכויות הבנייה (${rights.remaining} מ"ר) אינה מספיקה`,
      source: sources[1],
    });
  }

  // MAMAD (Safe Room)
  enhancements.push({
    type: 'mamad',
    title: 'ממ"ד',
    description: 'חדר מוגן לפי תקן הג"א',
    additionalSqm: 12,
    estimatedCost: 120000,
    estimatedValueAdd: 280000,
    isEligible: true,
    eligibilityReason: 'ממ"ד מותר תמיד בכפוף לאישור פיקוד העורף',
    source: sources[0],
  });

  return enhancements;
}

// ===== Duch Efes Calculator =====
function calculateDuchEfes(property: Property, plan: ZoningPlan): DuchEfes {
  const totalBuildable = (property.plotArea * plan.buildingPercentage) / 100;
  const publicArea = (totalBuildable * plan.publicAreaPercentage) / 100;
  const sellableArea = totalBuildable - publicArea;

  const avgUnitSize = 95;
  const totalUnits = Math.floor(sellableArea / avgUnitSize);

  const units3room = Math.round(totalUnits * 0.2);
  const units4room = Math.round(totalUnits * 0.4);
  const units5room = Math.round(totalUnits * 0.25);
  const penthouses = totalUnits - units3room - units4room - units5room;

  const pricePerSqm = 42000;
  const constructionCostPerSqm = 12000;

  const unitMix = [
    {
      type: '3 חדרים',
      count: units3room,
      avgSize: 75,
      pricePerSqm,
      totalValue: units3room * 75 * pricePerSqm,
    },
    {
      type: '4 חדרים',
      count: units4room,
      avgSize: 95,
      pricePerSqm,
      totalValue: units4room * 95 * pricePerSqm,
    },
    {
      type: '5 חדרים',
      count: units5room,
      avgSize: 120,
      pricePerSqm: pricePerSqm + 3000,
      totalValue: units5room * 120 * (pricePerSqm + 3000),
    },
    {
      type: 'פנטהאוז',
      count: penthouses,
      avgSize: 160,
      pricePerSqm: pricePerSqm + 8000,
      totalValue: penthouses * 160 * (pricePerSqm + 8000),
    },
  ];

  const totalRevenue = unitMix.reduce((sum, u) => sum + u.totalValue, 0);
  const totalConstructionCost = totalBuildable * constructionCostPerSqm;
  const landValue = property.plotArea * 25000;
  const bettermentLevy = Math.round(
    (totalRevenue - property.plotArea * 15000) * 0.5
  );
  const totalCosts = totalConstructionCost + landValue + bettermentLevy;
  const profit = totalRevenue - totalCosts;
  const profitMargin = (profit / totalRevenue) * 100;

  let feasibilityScore: DuchEfes['feasibilityScore'];
  if (profitMargin > 25) feasibilityScore = 'excellent';
  else if (profitMargin > 15) feasibilityScore = 'good';
  else if (profitMargin > 5) feasibilityScore = 'marginal';
  else feasibilityScore = 'unfeasible';

  return {
    totalSellableArea: Math.round(sellableArea),
    totalUnits,
    unitMix,
    constructionCostPerSqm,
    totalConstructionCost: Math.round(totalConstructionCost),
    landValueEstimate: Math.round(landValue),
    bettermentLevy: Math.round(bettermentLevy),
    totalRevenue: Math.round(totalRevenue),
    totalCosts: Math.round(totalCosts),
    profit: Math.round(profit),
    profitMargin: Math.round(profitMargin * 10) / 10,
    feasibilityScore,
    sources: [sources[5], sources[6], sources[7]],
  };
}

// ===== Main Analysis Function =====
export function analyzeProperty(propertyId: string): PropertyAnalysis | null {
  const property = properties.find((p) => p.id === propertyId);
  if (!property) return null;

  const plan = zoningPlans[property.zone];
  if (!plan) return null;

  const buildingRights = calculateBuildingRights(property, plan);
  const enhancements = calculateEnhancements(property, plan, buildingRights);
  const duchEfes = calculateDuchEfes(property, plan);

  return {
    property,
    zoningPlan: plan,
    buildingRights,
    enhancements,
    duchEfes,
    allSources: sources,
    analyzedAt: new Date().toISOString(),
  };
}

// ===== Search Function =====
export function searchProperties(query: string): Property[] {
  const normalized = query.trim();
  if (!normalized) return [];

  // Try Gush/Chelka search (numbers)
  const gushChelkaMatch = normalized.match(/(\d+)\s*[/\-,]\s*(\d+)/);
  if (gushChelkaMatch) {
    const gush = parseInt(gushChelkaMatch[1]);
    const chelka = parseInt(gushChelkaMatch[2]);
    return properties.filter(
      (p) => p.gush === gush && p.chelka === chelka
    );
  }

  // Address search
  return properties.filter(
    (p) =>
      p.address.includes(normalized) ||
      p.city.includes(normalized) ||
      p.neighborhoodName.includes(normalized) ||
      `${p.address}, ${p.city}`.includes(normalized)
  );
}

export { properties, sources };
