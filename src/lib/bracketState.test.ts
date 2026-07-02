import { describe, expect, it } from "vitest";
import {
  ALL_MATCHES,
  autoAssignThirds,
  championFrom,
  emptyBracketPick,
  matchTeams,
  runnerUpFrom,
  sanitizeBracket,
  stagesFromBracket,
  type BracketPick,
} from "./bracketState";
import { FINAL, R32 } from "../data/bracket";

describe("שיבוץ שלישיות אוטומטי", () => {
  it("ממלא את כל משבצות השלישי, בית שונה לכל משבצת, ובית זכאי בלבד", () => {
    const pick = emptyBracketPick();
    const thirdSlotMatches = R32.filter(
      (m) => m.home.type === "third" || m.away.type === "third",
    );
    // יש בדיוק 8 משבצות שלישי, וכולן שובצו
    expect(thirdSlotMatches.length).toBe(8);
    const assigned = Object.keys(pick.thirdSlots).length;
    expect(assigned).toBe(8);

    // כל בית מופיע פעם אחת לכל היותר
    const groups = Object.values(pick.thirdSlots);
    expect(new Set(groups).size).toBe(groups.length);

    // כל שיבוץ הוא מאחד הבתים הזכאים למשבצת
    for (const m of thirdSlotMatches) {
      const slot = m.home.type === "third" ? m.home : (m.away as any);
      expect(slot.groups).toContain(pick.thirdSlots[m.match]);
    }
  });

  it("autoAssignThirds דטרמיניסטי ומחזיר 8 שיבוצים", () => {
    const pick = emptyBracketPick();
    const a = autoAssignThirds(pick);
    expect(Object.keys(a).length).toBe(8);
  });
});

describe("מצב לוח העץ", () => {
  it("משבצות R32 מתמלאות ממנצחי/סגני הבתים", () => {
    const pick = emptyBracketPick();
    // משחק 73: סגנית A מול סגנית B
    const m73 = R32.find((m) => m.match === 73)!;
    const { home, away } = matchTeams(m73, pick);
    expect(home).toBe(pick.groupRankings["A"][1]); // סגנית A
    expect(away).toBe(pick.groupRankings["B"][1]); // סגנית B
  });

  it("כל נבחרת שעלתה ל-R32 מקבלת שלב r32 לפחות", () => {
    const pick = emptyBracketPick();
    // שלישיות עדיין לא נבחרו, אבל מנצחות/סגניות כן
    const stages = stagesFromBracket(pick);
    const winnerA = pick.groupRankings["A"][0];
    expect(stages[winnerA]).toBe("r32");
  });

  it("מנצח הגמר הופך לאלוף, השני לסגנית, וקידום שלבים עובד", () => {
    const pick = emptyBracketPick();
    // נמלא שלישיות נדרשות בצורה כלשהי כדי שהמשבצות יהיו מלאות
    R32.forEach((m) => {
      if (m.home.type === "third") pick.thirdSlots[m.match] = m.home.groups[0];
      if (m.away.type === "third") pick.thirdSlots[m.match] = m.away.groups[0];
    });
    // נריץ סבב-סבב (הסדר מובטח: R32→...→Final) ונבחר את ה-home הזמין כמנצח
    for (const m of ALL_MATCHES) {
      const { home, away } = matchTeams(m, pick);
      pick.winners[m.match] = home ?? away ?? "";
    }

    const champ = championFrom(pick);
    expect(champ).toBe(pick.winners[FINAL.match]);
    expect(champ).toBeTruthy();

    const runner = runnerUpFrom(pick);
    expect(runner).toBeTruthy();
    expect(runner).not.toBe(champ);

    const stages = stagesFromBracket(pick);
    expect(stages[champ!]).toBe("winner");
  });
});

describe("sanitizeBracket — מבטל בחירות מנצח/ת שהתייתמו משינוי סדר בית", () => {
  it("החלפת סדר בית מבטלת בחירת מנצח/ת שכבר לא במשבצת, ומתפשטת לשלב הבא", () => {
    const pick = emptyBracketPick();
    // משחק 73 (R32): home = סגנית A, away = סגנית B
    const groupA = pick.groupRankings["A"];
    const oldRunnerA = groupA[1]; // מי שהיה במקום 2 (סגנית) לפני השינוי

    // בוחרים בסגנית A (הנוכחית) כמנצחת משחק 73, וממשיכים איתה לשמינית (משחק 90: home = מנצח 73)
    pick.winners[73] = oldRunnerA;
    pick.winners[90] = oldRunnerA;

    // כעת מדרגים מחדש את בית A כך שסגנית A כבר לא אותה קבוצה (oldRunnerA יורדת למקום 3)
    const swapped = [...groupA];
    [swapped[1], swapped[2]] = [swapped[2], swapped[1]];
    const changed: BracketPick = { ...pick, groupRankings: { ...pick.groupRankings, A: swapped } };

    const sanitized = sanitizeBracket(changed);
    expect(sanitized.winners[73]).toBeUndefined();
    expect(sanitized.winners[90]).toBeUndefined(); // הביטול מתפשט לשלב הבא

    // אין זיכוי נקודות "רפאים" — oldRunnerA לא אמור לקבל r16 בניחוש הזה
    const stages = stagesFromBracket(changed);
    expect(stages[oldRunnerA]).not.toBe("r16");
  });

  it("בחירה שעדיין תואמת את המשבצת לא מתבטלת", () => {
    const pick = emptyBracketPick();
    const winnerA = pick.groupRankings["A"][0]; // משחק 73 לא כולל את מנצחת A בכלל — נבדוק משחק אחר
    // משחק 79 (R32): home = מנצחת A
    pick.winners[79] = winnerA;
    const sanitized = sanitizeBracket(pick);
    expect(sanitized.winners[79]).toBe(winnerA);
  });
});
