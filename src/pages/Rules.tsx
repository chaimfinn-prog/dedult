import {
  CATEGORY_WEIGHTS,
  CHAMPION_DOUBLE_BONUS,
  ENTRY_FEE_ILS,
  PRIZE_LABELS,
  PRIZE_SHARES,
  type PrizeCategory,
} from "../config";
import { directionPointsFromDecimal, potentialGeneralPoints } from "../lib/scoring";

export default function Rules() {
  return (
    <div className="space-y-4 animate-fade-up pb-4">
      <h1 className="px-1 text-xl font-extrabold text-grass-900">📖 חוקי המשחק</h1>

      <Section title="🎬 בקצרה">
        <p>
          מנחשים תוצאות במונדיאל 2026 וצוברים נקודות. <b>ככל שהניחוש מפתיע
          יותר — שווה יותר נקודות.</b> בסוף הטורניר מחלקים את הקופה לפי הדירוג.
          עלות השתתפות: <b>{ENTRY_FEE_ILS} ₪</b> (נאסף בנפרד מחוץ לאפליקציה).
        </p>
      </Section>

      <Section title="✍️ מה צריך לנחש">
        <ol className="list-inside list-decimal space-y-1.5">
          <li>
            <b>לוח עץ</b> — מדרגים כל בית 1–4, והעולות מטפסות אוטומטית לנוקאאוט.
            בוחרים מנצח בכל שלב עד האלוף. מכאן נגזרים האלוף, הסגנית, ולאיזה שלב
            הגיעה כל נבחרת.
          </li>
          <li>
            <b>ניחושים כלליים</b> — מלך השערים, סגן, מלך בישולים, כדור הזהב,
            כפפת הזהב, הקבוצה הכובשת וההגנה הטובה ביותר.
          </li>
          <li>
            <b>משחקים</b> — לכל משחק מזינים תוצאה מדויקת (הכיוון נגזר מאליו).
          </li>
        </ol>
        <p className="mt-2 text-grass-500">
          ⏱️ הניחושים הכלליים והלוח נסגרים בשריקת הפתיחה של הטורניר. כל ניחוש
          משחק נסגר 15 דקות לפני אותו משחק. אחרי הנעילה אי אפשר לשנות.
        </p>
      </Section>

      <Section title="🧮 איך צוברים נקודות">
        <p>הנוסחה לכל ניחוש נכון:</p>
        <div className="my-3 rounded-2xl bg-grass-50 p-3 text-center font-mono text-grass-800">
          נקודות = משקל × (1 ÷ הסיכוי)
        </div>
        <ul className="space-y-1.5">
          <li className="flex justify-between">
            <span>אלוף עם סיכוי ~15% (פייבוריט)</span>
            <b className="text-accent-600">{potentialGeneralPoints("champion", 0.15)} נק'</b>
          </li>
          <li className="flex justify-between">
            <span>אלוף עם סיכוי 8% (לא צפוי)</span>
            <b className="text-accent-600">{potentialGeneralPoints("champion", 0.08)} נק'</b>
          </li>
          <li className="flex justify-between">
            <span>ניחוש אאוטסיידר (מוגבל בתקרה)</span>
            <b className="text-accent-600">{potentialGeneralPoints("champion", 0.005)} נק'</b>
          </li>
        </ul>
      </Section>

      <Section title="⚽ ניחוש משחק — לפי יחסי אתר ההימורים">
        <p>
          לכל משחק מזינים <b>תוצאה מדויקת</b>, והכיוון (בית/תיקו/חוץ) נגזר ממנה.
          ליד כל משחק מוצגים <b>היחסים האמיתיים מאתר ההימורים</b> (למשל 2.53)
          — ככל שהכיוון מפתיע יותר, היחס גבוה יותר.
        </p>
        <div className="my-3 rounded-2xl bg-grass-50 p-3 text-center font-mono text-grass-800">
          נקודות כיוון = 6 × (היחס)^0.6
        </div>
        <p>
          <b>למה לא היחס המלא?</b> כדי שלא ישתלם "לזרוק" הפתעות: הפתעה עדיין
          שווה יותר, אבל מרוסנת — כך שניחוש חכם עדיף בתוחלת. דוגמאות:
        </p>
        <ul className="mt-2 space-y-1">
          <li className="flex justify-between rounded-xl bg-grass-50 px-3 py-1.5">
            <span>פייבוריט (יחס 1.6)</span>
            <b className="text-grass-700">{directionPointsFromDecimal(1.6)} נק'</b>
          </li>
          <li className="flex justify-between rounded-xl bg-grass-50 px-3 py-1.5">
            <span>משחק שקול (יחס 3.0)</span>
            <b className="text-grass-700">{directionPointsFromDecimal(3.0)} נק'</b>
          </li>
          <li className="flex justify-between rounded-xl bg-grass-50 px-3 py-1.5">
            <span>אנדרדוג (יחס 6.0)</span>
            <b className="text-grass-700">{directionPointsFromDecimal(6.0)} נק'</b>
          </li>
          <li className="flex justify-between rounded-xl bg-grass-50 px-3 py-1.5">
            <span>הפתעה ענקית (יחס 30)</span>
            <b className="text-grass-700">{directionPointsFromDecimal(30)} נק'</b>
          </li>
        </ul>
        <p className="mt-3">
          🎯 <b>בונוס בינגו</b> — אם פגעת ב<b>תוצאה המדויקת</b>, מקבלים בונוס
          נוסף מעל ניקוד הכיוון, לפי נדירות התוצאה: תוצאה שכיחה (1:0) בונוס קטן,
          תוצאה נדירה (כמו 4:0) בונוס גדול יותר.
        </p>
        <p className="mt-2">
          ⚡ <b>מכפיל נוקאאוט ×1.25</b> — משחקי הנוקאאוט (מ-R32 ומעלה) מקבלים
          מכפיל ×1.25 על ניקוד הכיוון + הבינגו. המשחקים חשובים יותר, הניקוד גבוה יותר.
        </p>
      </Section>

      <Section title="🎯 בונוס אלוף + סגנית">
        <p>
          מי שיצדק <b>גם באלוף וגם בסגנית</b> מקבל בונוס ענק של{" "}
          <b className="text-accent-600">+{CHAMPION_DOUBLE_BONUS}</b> נקודות —
          הניחוש המתגמל ביותר במשחק.
        </p>
      </Section>

      <Section title="🗺️ ניקוד הלוח־עץ (שלבים)">
        <p>נקודות הלוח־עץ נספרות בדירוג הכללי (קטגוריית "שלבים"), בנפרד מהשווקים:</p>
        <ul className="mt-2 space-y-1.5">
          <li>
            🏟️ <b>מיקומי בתים</b> — <b>5</b> נק' למיקום מדויק בטופ 2,
            <b>2</b> נק' אם הקבוצה עלתה אבל ניחשת אותה במקום העולה השני.
            <b>2</b> נק' על מקום שלישי מדויק אם הקבוצה עלתה כשלישית הטובה ביותר
            (הודחה = 0). מקסימום <b>12</b> לבית.
          </li>
          <li>
            🏆 <b>התקדמות בנוקאאוט</b> — <b>10</b> נק' לכל שלב מ<b>רבע הגמר ומעלה</b>
            (רבע / חצי / גמר) שקבוצה הגיעה אליו וניחשת — קרדיט חלקי אם הגיעה פחות
            רחוק. הזכייה עצמה דרך בונוס האלוף.
          </li>
        </ul>
        <p className="mt-2 text-grass-500">
          ⭐ <b>אלוף ההימורים הכלליים</b> נמדד רק לפי השווקים (מלך שערים, כדור/כפפת
          הזהב, קבוצות) והאלוף+סגנית — <b>לא</b> לפי נקודות הלוח־עץ.
        </p>
      </Section>

      <Section title="🛡️ ההגנה הטובה ביותר">
        <p>
          נמדדת לפי <b>ממוצע ספיגות למשחק</b> (לא סך הכול), כדי שקבוצה שמעפילה
          לשלבים מתקדמים — ולכן משחקת יותר משחקים — לא תיענש מול קבוצה שעפה מוקדם.
        </p>
      </Section>

      <Section title="💰 חלוקת הקופה">
        <p className="mb-2">
          הקופה = מספר המשתתפים × {ENTRY_FEE_ILS}₪. מתחלקת ל-5 קטגוריות:
        </p>
        <ul className="space-y-1">
          {(Object.keys(PRIZE_SHARES) as PrizeCategory[]).map((c) => (
            <li
              key={c}
              className="flex justify-between rounded-xl bg-grass-50 px-3 py-1.5"
            >
              <span>{PRIZE_LABELS[c]}</span>
              <b className="text-grass-700">{(PRIZE_SHARES[c] * 100).toFixed(0)}%</b>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-grass-500">
          <b>במהלך הטורניר</b> כל קטגוריה מציגה את האחוז הקבוע שלה ואת המוביל
          הנוכחי. <b>בסוף הטורניר</b>, אם אותו אדם ניצח בכמה קטגוריות — נשארת לו
          הגדולה, והאחוז של הקטנות מתחלק מחדש בין שאר הקטגוריות (לא זוכים פעמיים).
        </p>
      </Section>

      <Section title="📊 משקלי הקטגוריות הכלליות">
        <ul className="grid grid-cols-2 gap-1.5">
          {[
            ["אלוף", CATEGORY_WEIGHTS.champion],
            ["סגנית", CATEGORY_WEIGHTS.runnerUp],
            ["כדור הזהב", CATEGORY_WEIGHTS.goldenBall],
            ["מלך שערים", CATEGORY_WEIGHTS.topScorer],
            ["כפפת הזהב", CATEGORY_WEIGHTS.goldenGlove],
            ["קבוצה כובשת", CATEGORY_WEIGHTS.mostGoalsTeam],
            ["הגנה הכי טובה", CATEGORY_WEIGHTS.bestDefenseTeam],
            ["סגן מלך שערים", CATEGORY_WEIGHTS.secondScorer],
            ["מלך בישולים", CATEGORY_WEIGHTS.topAssists],
          ].map(([label, w]) => (
            <li
              key={label as string}
              className="flex justify-between rounded-xl bg-grass-50 px-3 py-1.5"
            >
              <span>{label}</span>
              <b className="text-grass-700">×{w}</b>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="👀 שקיפות">
        <p>
          ליד כל בחירה מוצגים האחוז והנקודות אם תצדיק. ניחושי החברים נחשפים רק
          אחרי שהם ננעלים — אף אחד לא יכול להעתיק.
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-4">
      <h2 className="mb-2 text-base font-extrabold text-grass-900">{title}</h2>
      <div className="text-sm leading-relaxed text-grass-700">{children}</div>
    </section>
  );
}
