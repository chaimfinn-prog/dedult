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
      </Section>

      <Section title="🎯 בונוס אלוף + סגנית">
        <p>
          מי שיצדק <b>גם באלוף וגם בסגנית</b> מקבל בונוס ענק של{" "}
          <b className="text-accent-600">+{CHAMPION_DOUBLE_BONUS}</b> נקודות —
          הניחוש המתגמל ביותר במשחק.
        </p>
      </Section>

      <Section title="🗺️ ניקוד הלוח־עץ">
        <p>הלוח־עץ מנוקד בשני חלקים:</p>
        <ul className="mt-2 space-y-1.5">
          <li>
            🏟️ <b>מיקומים בבתים</b> — לכל בית: <b>10</b> נק' על מקום 1 נכון,{" "}
            <b>5</b> על מקום 2, <b>5</b> על מקום 3 (מקסימום <b>20</b> לבית). מחושב
            אוטומטית כשהבית מסתיים.
          </li>
          <li>
            🏆 <b>התקדמות בנוקאאוט</b> — <b>10</b> נק' לכל שלב שקבוצה הגיעה אליו
            (1/8, רבע, חצי, גמר) שניחשת — גם אם הגיעה פחות רחוק ממה שציפית, מקבלים
            על מה שכן עברה.
          </li>
        </ul>
        <p className="mt-2 text-grass-500">
          סך הכל הלוח־עץ שווה כ-<b>240</b> נק' מהבתים ועוד <b>~300</b> מהנוקאאוט —
          ובנוסף בונוס האלוף והסגנית למעלה.
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
          <b>אדם לא זוכה בכמה קטגוריות:</b> אם מישהו ניצח ביותר מאחת, נשארת לו
          הגדולה, והאחוז של הקטנות מתחלק מחדש בין שאר הקטגוריות.
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
