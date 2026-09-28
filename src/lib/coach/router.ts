import { agents, type AgentId } from "./agents";

/** INTENT ROUTER — deterministic, runs after the safety router. */
const WORDS: Record<Exclude<AgentId, "wellness" | "education">, RegExp[]> = {
  movement: [
    /exercis/,
    /\bsteps?\b/,
    /\bwalk/,
    /squat/,
    /\bcurl/,
    /lunge/,
    /workout/,
    /movement|\bmove\b/,
    /\bactive\b|activity/,
    /\bpose\b/,
    /\bgym\b/,
    /training/,
  ],
  nutrition: [
    /\bfood/,
    /\bmeal/,
    /\beat/,
    /protein/,
    /\bwater\b/,
    /hydrat/,
    /nutrition/,
    /\bfuel\b/,
    /snack/,
    /breakfast|lunch|dinner/,
    /drink/,
  ],
  recovery: [
    /sleep/,
    /tired/,
    /\brest\b/,
    /recover/,
    /bedtime/,
    /fatigue/,
    /stress/,
    /\bnap\b/,
    /wind[- ]down/,
  ],
  case: [
    /\bcase\b/,
    /khalid/,
    /\bsara\b/,
    /\bomar\b/,
    /detective/,
    /\blab\b/,
    /#?00[123]\b/,
    /energy crash|weekend warrior|everything looks healthy/,
  ],
};
const EDUCATION = /\bwhy\b|explain|\blearn|what does|how does|what is|what's the point/;
const BROAD =
  /focus|how am i doing|my progress|\bview score\b|overall|\btoday\b|where should i start|what should i do/;

export interface Route {
  agent: AgentId;
  reason: string;
  /** Domain agent whose context the education agent should lean on. */
  contextAgent: AgentId;
}

function scores(t: string) {
  return (Object.keys(WORDS) as (keyof typeof WORDS)[]).map((k) => ({
    k,
    n: WORDS[k].filter((re) => re.test(t)).length,
  }));
}

export function routeIntent(input: string, previous: AgentId | null): Route {
  const t = input.toLowerCase();
  const ranked = scores(t).sort((a, b) => b.n - a.n);
  const top = ranked[0]!;
  const edu = EDUCATION.test(t);
  const personal = /\bmy\b|\bme\b|\bi\b|\bi'm\b|today/.test(t);

  if (ranked.find((r) => r.k === "case")!.n > 0)
    return {
      agent: "case",
      contextAgent: "case",
      reason: "Your question mentioned a VIEW POINT LAB case, so the Case Master was used.",
    };

  if (/view score/.test(t) || (BROAD.test(t) && top.n === 0))
    return {
      agent: "wellness",
      contextAgent: "wellness",
      reason:
        "This was a big-picture question about your overall routine, so the Wellness Agent combined all your signals.",
    };

  if (top.n > 0) {
    const domain = top.k as AgentId;
    if (edu && !personal)
      return {
        agent: "education",
        contextAgent: domain,
        reason: `You asked why, about ${agents[domain].chip.toLowerCase()} topics, so the Education Agent explained it with ${agents[domain].name} context.`,
      };
    return {
      agent: domain,
      contextAgent: domain,
      reason: `Your question mentioned ${agents[domain].chip.toLowerCase()} topics, so the ${agents[domain].name} was used.`,
    };
  }

  if (previous) {
    if (edu && previous !== "education")
      return {
        agent: "education",
        contextAgent: previous,
        reason: `You asked a follow-up "why", so the Education Agent explained the previous ${agents[previous].chip.toLowerCase()} answer.`,
      };
    return {
      agent: previous,
      contextAgent: previous,
      reason: `This looked like a follow-up, so the ${agents[previous].name} continued.`,
    };
  }
  if (edu)
    return {
      agent: "education",
      contextAgent: "wellness",
      reason: "You asked a why question, so the Education Agent was used.",
    };
  return {
    agent: "wellness",
    contextAgent: "wellness",
    reason: "No specific topic was detected, so the Wellness Agent looked at your overall routine.",
  };
}

/** Which case a message refers to, if any. */
export function mentionedCase(input: string): "001" | "002" | "003" | null {
  const t = input.toLowerCase();
  if (/khalid|001|energy crash/.test(t)) return "001";
  if (/\bsara\b|002|weekend warrior/.test(t)) return "002";
  if (/\bomar\b|003|everything looks healthy/.test(t)) return "003";
  return null;
}
