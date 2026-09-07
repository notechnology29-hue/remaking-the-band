# Baggage

Actionable psychological baggage generated from a musician's background
(GDD §3). Each entry should declare what it changes — trust, stress
reactions, motivation, conflict likelihood, camera behavior, tactical
choices — not just describe the backstory.

Suggested shape:
```json
{
  "id": "baggage_id",
  "sourceTags": ["abandonment"],
  "effects": { "walkoutRiskModifier": 0, "trustModifier": 0 },
  "triggerContexts": ["hostilePodcast", "lowStamina"]
}
```
