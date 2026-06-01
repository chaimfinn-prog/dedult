import {
  CATEGORY_WEIGHTS,
  CHAMPION_DOUBLE_BONUS,
  DIRECTION_WEIGHT,
  EXACT_SCORE_BONUS,
} from "../config";
import { potentialGeneralPoints } from "../lib/scoring";

export default function Rules() {
  return (
    <div className="space-y-4 animate-fade-up pb-4">
      <h1 className="px-1 text-xl font-extrabold text-grass-900">📖 איך זה עובד</h1>

      <Section title="שני שלבים של ניחושים">
        <p>
          <b>שלב 1 — ניחושים כלליים:</b> אלוף, סגנית, מלך שערים, סגן מלך שערים,
          מלך בישולים, ולאיזה שלב תגיע כל נבחרת. נסגרים עם שריקת הפתיחה של הטורניר.
        </p>
        <p className="mt-2">
          <b>שלב 2 — ניחושי משחקים:</b> לכל משחק בוחרים כיוון (בית / תיקו / חוץ)
          ותוצאה מדויקת. כל ניחוש נסגר עם שריקת הפתיחה של אותו משחק.
        </p>
      </Section>

      <Section title="הניקוד — מפתיע = שווה יותר">
        <p>
          הניקוד פרופורציונלי לסיכוי האמיתי. ככל שהניחוש פחות סביר, כך הוא שווה
          יותר נקודות:
        </p>
        <div className="my-3 rounded-2xl bg-grass-50 p-3 text-center font-mono text-grass-800">
          נקודות = משקל × (1 / סיכוי)
        </div>
        <ul className="space-y-1.5">
          <li className="flex justify-between">
            <span>ניחוש אלוף עם סיכוי 17% (ספרד)</span>
            <b className="text-accent-600">{potentialGeneralPoints("champion", 0.17)} נק'</b>
          </li>
          <li className="flex justify-between">
            <span>ניחוש אלוף עם סיכוי 10% (ארגנטינה)</span>
            <b className="text-accent-600">{potentialGeneralPoints("champion", 0.1)} נק'</b>
          </li>
          <li className="flex justify-between">
            <span>ניחוש אלוף אאוטסיידר עם סיכוי 0.5%</span>
            <b className="text-accent-600">{potentialGeneralPoints("champion", 0.005)} נק'</b>
          </li>
        </ul>
      </Section>

      <Section title="ניחוש משחק — מדורג">
        <p>
          <b>כיוון נכון</b> נותן ניקוד בסיסי (משקל {DIRECTION_WEIGHT} × 1/סיכוי).{" "}
          <b>תוצאה מדויקת</b> מוסיפה בונוס קבוע של{" "}
          <b className="text-accent-600">+{EXACT_SCORE_BONUS}</b> מעל ניקוד הכיוון.
          מי שצדק גם בכיוון וגם בתוצאה — מקבל את המקסימום.
        </p>
      </Section>

      <Section title="משקלי הקטגוריות">
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
            <li key={label as string} className="flex justify-between rounded-xl bg-grass-50 px-3 py-1.5">
              <span>{label}</span>
              <b className="text-grass-700">×{w}</b>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="🎯 בונוס אלוף + סגנית">
        <p>
          מי שיצדק <b>גם באלוף וגם בסגנית</b> (שניהם נכון!) יקבל בונוס ענק של{" "}
          <b className="text-accent-600">+{CHAMPION_DOUBLE_BONUS}</b> נקודות,
          בנוסף לנקודות של כל אחד מהם. זה הניחוש הקשה והמתגמל ביותר במשחק.
        </p>
      </Section>

      <Section title="שקיפות מלאה">
        <p>
          ליד כל בחירה מוצגים <b>אחוז הסיכוי</b> ו<b>הנקודות שתקבל אם תצדיק</b> —
          כדי שתראו את יחס הסיכון/תגמול לפני שאתם בוחרים.
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
