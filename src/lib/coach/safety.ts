/** SAFETY ROUTER — runs before intent routing. Deterministic, never calls the AI for red flags. */
export type SafetyLevel = "wellness" | "caution" | "urgent";
export type SafetyCategory = "urgent" | "pain" | "medication" | "diagnosis" | "symptom" | null;

export interface SafetyResult {
  level: SafetyLevel;
  category: SafetyCategory;
}

const has = (t: string, re: RegExp) => re.test(t);

const URGENT = [
  /chest (pain|pressure|tightness)/,
  /(severe|really bad|extreme)\s+(trouble|difficulty|shortness)?\s*(breath|breathing)/,
  /(can'?t|cannot|unable to|struggling to|trouble|difficulty)\s+breath/,
  /faint(ed|ing)?|passed out|blacked out|unconscious|collapsed/,
  /stroke|face (is )?droop|slurred speech|numb(ness)? on one side|one side of my (body|face)/,
  /(severe|heavy|uncontrolled|won'?t stop) bleeding|bleeding (a lot|heavily|won'?t stop)/,
  /seizure|overdose|suicid|kill myself|end my life|hurt myself|self[- ]harm/,
];

const MEDICATION = /(medication|medicine|meds|pill|pills|insulin|prescription|dose|dosage|tablet)/;
const MED_CHANGE =
  /(stop|start|quit|increase|decrease|reduce|raise|lower|replace|switch|skip|change|double|come off)/;
const DIAGNOSIS =
  /(do i have|have i got|am i (diabetic|sick|ill)|is something wrong with my|diagnos|what('?s| is) wrong with me|could (it|this) be)\b|\b(diabetes|sleep apnea|apnoea|insomnia|depression|anxiety disorder|cancer|heart disease|thyroid|anemi|anaemi)/;
const PAIN =
  /\b(hurts?|hurting|pain|painful|ache|aching|injur(y|ed)|sprain|pulled a muscle|swollen|swelling)\b/;
const SYMPTOM =
  /\b(dizzy|dizziness|palpitation|exhausted all the time|always exhausted|nausea|numb|tingling|fever|shortness of breath|losing weight without)\b/;

export function classifySafety(input: string): SafetyResult {
  const t = input.toLowerCase();
  if (URGENT.some((re) => has(t, re))) return { level: "urgent", category: "urgent" };
  if (has(t, MEDICATION) && has(t, MED_CHANGE)) return { level: "caution", category: "medication" };
  if (has(t, DIAGNOSIS)) return { level: "caution", category: "diagnosis" };
  if (has(t, PAIN)) return { level: "caution", category: "pain" };
  if (has(t, SYMPTOM)) return { level: "caution", category: "symptom" };
  return { level: "wellness", category: null };
}

export interface SafetyNotice {
  tone: "urgent" | "caution";
  title: string;
  body: string;
  bullets: string[];
}

/** Fixed, non-gamified responses for categories that must not go to open-ended coaching. */
export function safetyNotice(category: SafetyCategory, input: string): SafetyNotice | null {
  const t = input.toLowerCase();
  switch (category) {
    case "urgent":
      return {
        tone: "urgent",
        title: "Get urgent help",
        body: "This may need urgent medical attention. Please contact local emergency services or seek emergency medical care now.",
        bullets: [
          "In the UAE, call 998 for an ambulance (999 for police).",
          "If you are with someone, tell them what is happening.",
          "Do not wait to see if it passes.",
        ],
      };
    case "pain": {
      const exercise = /(squat|curl|lunge|exercise|workout|pose|training|lifting)/.test(t);
      return {
        tone: "caution",
        title: "Pain is a signal to pause",
        body: `${exercise ? "Stop the exercise if you're experiencing pain. " : ""}VIEW POINT FIT can't determine the cause of pain${exercise ? " from pose landmarks" : ""}. Consider getting guidance from a qualified healthcare or physiotherapy professional, especially if pain persists, is severe, or came from an injury.`,
        bullets: [
          "Don't push through pain.",
          "Rest the movement until you've had it checked if it keeps happening.",
        ],
      };
    }
    case "medication":
      return {
        tone: "caution",
        title: "Talk to your clinician first",
        body: "VIEW POINT FIT can't advise on starting, stopping or changing medication. Please discuss any medication change with your doctor or pharmacist before making it.",
        bullets: [
          "Bring your questions and any side effects you've noticed to that conversation.",
          "Keep taking medication as prescribed unless a clinician tells you otherwise.",
        ],
      };
    case "diagnosis":
      return {
        tone: "caution",
        title: "I can't answer that one",
        body: "VIEW POINT FIT can't determine whether you have a medical condition. If you're worried about symptoms or a condition, the right next step is a check-up with a qualified healthcare professional.",
        bullets: [
          "Note what you've noticed and when it happens — it helps that conversation.",
          "I can still help with general sleep, movement, food and recovery habits.",
        ],
      };
    default:
      return null;
  }
}
