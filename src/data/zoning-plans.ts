// Mock תב"ע data for Raanana (רעננה)
import { ZoningPlan } from '@/types';

export const zoningPlans: ZoningPlan[] = [
  {
    id: 'rn-3000',
    planNumber: 'רע/3000',
    name: 'תכנית מתאר רעננה - מגורים א\'',
    city: 'רעננה',
    neighborhood: 'מרכז העיר',
    approvalDate: '2019-03-15',
    status: 'active',
    zoningType: 'residential_a',
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
      floorAllocations: [
        {
          floor: 'basement',
          label: 'מרתף',
          mainAreaPercent: 0,
          serviceAreaPercent: 65,
          notes: 'חניה + מחסנים',
        },
        {
          floor: 'ground',
          label: 'קומת קרקע',
          mainAreaPercent: 35,
          serviceAreaPercent: 12,
          notes: 'כולל לובי וחדר אשפה',
        },
        {
          floor: 'typical',
          label: "קומות א'-ג'",
          mainAreaPercent: 35,
          serviceAreaPercent: 8,
          notes: 'לכל קומה',
        },
        {
          floor: 'rooftop',
          label: 'יציאה לגג',
          mainAreaPercent: 0,
          serviceAreaPercent: 23,
          notes: 'חדר מדרגות + מתקנים',
        },
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
      additionalFloors: 2.5,
      additionalBuildingPercent: 25,
      seismicUpgradeRequired: true,
      notes: 'זכאי לתמ"א 38/1 - חיזוק + תוספת',
    },
  },
  {
    id: 'rn-3100',
    planNumber: 'רע/3100',
    name: 'תכנית מתאר רעננה - מגורים ב\'',
    city: 'רעננה',
    neighborhood: 'נווה זמר',
    approvalDate: '2020-07-22',
    status: 'active',
    zoningType: 'residential_b',
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
      floorAllocations: [
        {
          floor: 'basement',
          label: 'מרתף',
          mainAreaPercent: 0,
          serviceAreaPercent: 75,
          notes: '2 קומות חניה + מחסנים',
        },
        {
          floor: 'ground',
          label: 'קומת קרקע',
          mainAreaPercent: 30,
          serviceAreaPercent: 15,
          notes: 'כולל לובי ושטחי ציבור',
        },
        {
          floor: 'typical',
          label: "קומות א'-ה'",
          mainAreaPercent: 18,
          serviceAreaPercent: 5,
          notes: 'לכל קומה',
        },
        {
          floor: 'rooftop',
          label: 'יציאה לגג',
          mainAreaPercent: 0,
          serviceAreaPercent: 25,
          notes: 'חדר מדרגות + מערכות',
        },
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
      additionalFloors: 2.5,
      additionalBuildingPercent: 30,
      seismicUpgradeRequired: true,
      notes: 'זכאי לתמ"א 38/2 - הריסה ובנייה',
    },
  },
  {
    id: 'rn-3200',
    planNumber: 'רע/3200',
    name: 'תכנית מתאר רעננה - שימוש מעורב',
    city: 'רעננה',
    neighborhood: 'רעננה החדשה',
    approvalDate: '2021-11-08',
    status: 'active',
    zoningType: 'mixed_use',
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
      floorAllocations: [
        {
          floor: 'basement',
          label: 'מרתף',
          mainAreaPercent: 0,
          serviceAreaPercent: 100,
          notes: '3 קומות חניה',
        },
        {
          floor: 'ground',
          label: 'קומת קרקע',
          mainAreaPercent: 40,
          serviceAreaPercent: 20,
          notes: 'מסחר + לובי',
        },
        {
          floor: 'typical',
          label: "קומות א'-י\"א",
          mainAreaPercent: 14,
          serviceAreaPercent: 3.5,
          notes: 'לכל קומה - מגורים',
        },
        {
          floor: 'rooftop',
          label: 'גג',
          mainAreaPercent: 0,
          serviceAreaPercent: 30,
          notes: 'מערכות טכניות',
        },
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
      additionalFloors: 0,
      additionalBuildingPercent: 0,
      seismicUpgradeRequired: false,
      notes: 'בנייה חדשה - לא רלוונטי',
    },
  },
  {
    id: 'rn-2800',
    planNumber: 'רע/2800',
    name: 'תכנית מתאר רעננה - מגורים צמודי קרקע',
    city: 'רעננה',
    neighborhood: 'כפר סבא הירוקה',
    approvalDate: '2017-05-10',
    status: 'active',
    zoningType: 'residential_a',
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
      floorAllocations: [
        {
          floor: 'basement',
          label: 'מרתף',
          mainAreaPercent: 0,
          serviceAreaPercent: 50,
          notes: 'חניה + אחסון',
        },
        {
          floor: 'ground',
          label: 'קומת קרקע',
          mainAreaPercent: 50,
          serviceAreaPercent: 15,
          notes: 'כולל ממ"ד',
        },
        {
          floor: 'typical',
          label: "קומה א'",
          mainAreaPercent: 40,
          serviceAreaPercent: 15,
          notes: 'כולל מרפסות',
        },
        {
          floor: 'rooftop',
          label: 'גג',
          mainAreaPercent: 0,
          serviceAreaPercent: 15,
          notes: 'חדר יציאה לגג',
        },
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
      additionalFloors: 1,
      additionalBuildingPercent: 15,
      seismicUpgradeRequired: true,
      notes: 'זכאי לתמ"א 38/1 בלבד',
    },
  },
  {
    id: 'rn-3050',
    planNumber: 'רע/3050',
    name: 'תכנית מתאר רעננה - מגורים ציר אחוזה',
    city: 'רעננה',
    neighborhood: 'ציר אחוזה',
    approvalDate: '2022-01-20',
    status: 'active',
    zoningType: 'residential_b',
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
      floorAllocations: [
        {
          floor: 'basement',
          label: 'מרתף',
          mainAreaPercent: 0,
          serviceAreaPercent: 80,
          notes: '2 קומות חניה',
        },
        {
          floor: 'ground',
          label: 'קומת קרקע',
          mainAreaPercent: 35,
          serviceAreaPercent: 15,
          notes: 'מסחר קטן + לובי',
        },
        {
          floor: 'typical',
          label: "קומות א'-ז'",
          mainAreaPercent: 16.5,
          serviceAreaPercent: 4.3,
          notes: 'לכל קומה',
        },
        {
          floor: 'rooftop',
          label: 'גג',
          mainAreaPercent: 0,
          serviceAreaPercent: 25,
          notes: 'מערכות + גינת גג',
        },
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
      additionalFloors: 3,
      additionalBuildingPercent: 35,
      seismicUpgradeRequired: true,
      notes: 'זכאי לתמ"א 38/2 - הריסה ובנייה מחדש',
    },
  },
];

// Address to zoning plan mapping (mock)
export interface AddressMapping {
  address: string;
  block: string;
  parcel: string;
  planId: string;
  neighborhood: string;
  avgPricePerSqm: number; // ₪ per sqm in the area
  constructionCostPerSqm: number;
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
  },
  {
    address: 'רחוב הרצל 15, רעננה',
    block: '6573',
    parcel: '45',
    planId: 'rn-3000',
    neighborhood: 'מרכז העיר',
    avgPricePerSqm: 38000,
    constructionCostPerSqm: 8000,
  },
  {
    address: 'רחוב בורוכוב 22, רעננה',
    block: '6590',
    parcel: '78',
    planId: 'rn-3000',
    neighborhood: 'מרכז העיר',
    avgPricePerSqm: 36000,
    constructionCostPerSqm: 8000,
  },
  {
    address: 'רחוב שמואל הנציב 8, רעננה',
    block: '6601',
    parcel: '23',
    planId: 'rn-3100',
    neighborhood: 'נווה זמר',
    avgPricePerSqm: 45000,
    constructionCostPerSqm: 9000,
  },
  {
    address: 'רחוב קרן היסוד 30, רעננה',
    block: '6612',
    parcel: '56',
    planId: 'rn-3100',
    neighborhood: 'נווה זמר',
    avgPricePerSqm: 44000,
    constructionCostPerSqm: 8500,
  },
  {
    address: 'רחוב הרב קוק 12, רעננה',
    block: '6555',
    parcel: '89',
    planId: 'rn-2800',
    neighborhood: 'כפר סבא הירוקה',
    avgPricePerSqm: 48000,
    constructionCostPerSqm: 10000,
  },
  {
    address: 'רחוב רמב"ם 5, רעננה',
    block: '6565',
    parcel: '34',
    planId: 'rn-2800',
    neighborhood: 'כפר סבא הירוקה',
    avgPricePerSqm: 46000,
    constructionCostPerSqm: 9500,
  },
  {
    address: 'שדרות ירושלים 40, רעננה',
    block: '6630',
    parcel: '15',
    planId: 'rn-3200',
    neighborhood: 'רעננה החדשה',
    avgPricePerSqm: 40000,
    constructionCostPerSqm: 9000,
  },
  {
    address: 'רחוב נורדאו 18, רעננה',
    block: '6577',
    parcel: '67',
    planId: 'rn-3000',
    neighborhood: 'מרכז העיר',
    avgPricePerSqm: 37000,
    constructionCostPerSqm: 8000,
  },
  {
    address: 'רחוב ז\'בוטינסקי 55, רעננה',
    block: '6595',
    parcel: '91',
    planId: 'rn-3050',
    neighborhood: 'ציר אחוזה',
    avgPricePerSqm: 41000,
    constructionCostPerSqm: 8500,
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
