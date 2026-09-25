#!/usr/bin/env node
// jev smoke test — verifies the OpenRouter "decisions" endpoint answers typed
// questions about a state. The model answers narrow, typed questions; your code
// owns the workflow.
//
//   Requires: OPENROUTER_API_KEY in the environment. Node 20+ (global fetch).
//   Run:      node plugins/foreman-line/templates/jev-smoke-test.mjs
//   Exits:    0 on pass, 1 on a failed assertion, 2 on bad config / HTTP error.

const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) {
    console.error("OPENROUTER_API_KEY is not set in this process.");
    process.exit(2);
}

const response = await fetch("https://openrouter.ai/api/alpha/decisions", {
    method: "POST",
    headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        // Both optional — they drive attribution on openrouter.ai rankings.
        "HTTP-Referer": "https://github.com/kaseya/one-productivity-tools",
        "X-OpenRouter-Title": "foreman-line jev smoke test",
    },
    body: JSON.stringify({
        model: "~typesafe/jev-latest",
        state: "Help! My payouts have been failing for 3 days.",
        questions: {
            is_urgent: {
                type: "noul",
                instructions: "Does this message convey urgency?",
                criteria: {
                    true: "Explicitly time-sensitive",
                    false: "No urgency expressed"
                }
            },
            department: {
                type: "choice",
                instructions: "Which team should handle this?",
                criteria: {
                    billing: "Payments, invoicing, refunds",
                    technical: "Bugs, outages, integrations",
                    sales: "Pricing, upgrades, new accounts"
                }
            },
            frustration: {
                type: "score",
                instructions: "How frustrated is the customer?",
                criteria: ["Calm", "Frustrated", "Very angry"]
            }
        }
    })
});

const raw = await response.text();
if (!response.ok) {
    console.error(`HTTP ${response.status} ${response.statusText}`);
    console.error(raw);
    process.exit(2);
}

const { model, answers, usage } = JSON.parse(raw);

// Answer shapes, as actually returned:
//   noul   -> { type, noul }                              probability 0 (no) .. 1 (yes)
//   choice -> { type, choice, probabilities, confidence }  probabilities keyed by criterion
//   score  -> { type, score, legend, probabilities, confidence }
//             score is a continuous position on the criteria scale; legend maps
//             index -> label ({"0":"Calm", ...}); probabilities are keyed by that
//             same index. Note `confidence` is separate from the distribution:
//             it is how sure the model is, not the spread of the answer.
console.log(`model: ${model}`);
console.log("is_urgent   ", answers.is_urgent.noul);
console.log("department  ", answers.department.choice, answers.department.probabilities,
            `confidence=${answers.department.confidence}`);
console.log("frustration ", answers.frustration.score, answers.frustration.legend,
            answers.frustration.probabilities, `confidence=${answers.frustration.confidence}`);
console.log(`usage: ${usage.input_tokens} in / ${usage.output_tokens} out, $${usage.cost}`);

// Assertions: shape first, then the substantive read of this deliberately
// unambiguous state. A drifting model that still returns a valid envelope
// should fail here loudly rather than pass silently.
const failures = [];
const check = (label, ok) => { if (!ok) failures.push(label); };

check("is_urgent.noul is a probability",
    typeof answers.is_urgent.noul === "number" &&
    answers.is_urgent.noul >= 0 && answers.is_urgent.noul <= 1);
check("department.choice is one of the criteria",
    ["billing", "technical", "sales"].includes(answers.department.choice));
check("department.probabilities covers every criterion",
    ["billing", "technical", "sales"].every(k => typeof answers.department.probabilities[k] === "number"));
check("frustration.score is within the 3-point scale",
    typeof answers.frustration.score === "number" &&
    answers.frustration.score >= 0 && answers.frustration.score <= 2);
check("frustration.legend labels every point",
    ["0", "1", "2"].every(k => typeof answers.frustration.legend[k] === "string"));

check("a 3-day outage reads as urgent (noul > 0.8)", answers.is_urgent.noul > 0.8);
check("failing payouts route to billing", answers.department.choice === "billing");
check("'Help!' is not read as calm (score > 0.5)", answers.frustration.score > 0.5);

if (failures.length > 0) {
    console.error(`\nFAIL (${failures.length}):`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
}

console.log("\nPASS — jev answered all three question types with a valid envelope.");

// The workflow stays in your code. The model only answered the questions:
if (answers.is_urgent.noul > 0.8 && answers.department.choice === "billing") {
    // escalateToBilling(...)
}
