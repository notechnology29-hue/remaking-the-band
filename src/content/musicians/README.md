# Musicians

Per-musician data: genre, instrument, Early Life / Home Life / High School
background, and combat stats (Physical Fortitude, Mental Resilience, Luck,
Heart, Good Vibez, Bad Vibez, Stage Presence). See GDD §3.

Suggested shape:
```json
{
  "id": "musician_id",
  "name": "",
  "genre": "",
  "instrument": "",
  "background": { "earlyLife": "", "homeLife": "", "highSchool": "" },
  "stats": {
    "physicalFortitude": 0, "mentalResilience": 0, "luck": 0,
    "heart": 0, "goodVibez": 0, "badVibez": 0, "stagePresence": 0
  },
  "baggageTags": []
}
```
