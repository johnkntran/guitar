import os
from typing import Literal
from openai import AzureOpenAI, BadRequestError
from azure.identity import DefaultAzureCredential, get_bearer_token_provider
from pydantic import BaseModel

endpoint = os.environ["AZURE_OPENAI_ENDPOINT"]
model = os.environ["AZURE_OPENAI_DEPLOYMENT_NAME"]

credential = DefaultAzureCredential()

token_provider = get_bearer_token_provider(
    credential,
    "https://cognitiveservices.azure.com/.default"
)

client = AzureOpenAI(
    azure_endpoint=endpoint,
    azure_ad_token_provider=token_provider,
    api_version="2024-12-01-preview",
)

class Message(BaseModel):
    role: Literal['system', 'user', 'assistant']
    content: str

def ask_llm(messages: list[Message]) -> list[Message]:
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[message.model_dump() for message in messages],
            temperature=0.9,
        )
        messages.append(Message(role='assistant', content=response.choices[0].message.content))
    except BadRequestError as e:
        response = e.response.json()
        error = response['error']
        content = f"BadRequestError - {error['message']}"
        if 'innererror' in error:
            inner_error = error['innererror']
            code = inner_error['code']
            content += f' - ReasonCode={code}'
            if code == 'ResponsibleAIPolicyViolation':
                violations = inner_error['content_filter_result']
                for violation, reason in violations.items():
                    if reason['filtered']:
                        content += f" - Violation={violation} ({reason['severity']})"
        messages.append(Message(role='assistant', content=content))
    return messages

sample_payload = {
    "messages": [
        {
            "role": "system",
            "content": "You are a professor of music theory. Frame your responses in the context of answering a guitar student."
        },
        {
            "role": "user",
            "content": "How do I use a half-diminished seventh chord in a pop song?"
        },
        {
            "role": "assistant",
            "content": "Alright — let’s break down how a half‑diminished seventh chord works, and how you can weave it naturally into a pop song.\n\n---\n\n### 1. What it is\nA **half‑diminished seventh** chord is built:  \n**root – minor third – diminished fifth – minor seventh.**  \nIn chord symbols you’ll often see it written as:\n- **m7♭5** (e.g., Bm7♭5)\n- Or with the “ø” sign (Bø7)\n\nOn guitar, for Bm7♭5 you could play:  \n**B – F – A – D**.\n\n---\n\n### 2. Where it shows up\nIn **functional harmony**, the half‑diminished chord most often appears as the **iiø7** in a minor key. For example, in **A minor**:\n\n**iiø7 → V7 → i** = Bm7♭5 → E7 → Am\n\nThis works because the chord’s tones lead very smoothly into the dominant (V7) chord. The tritone inside the V7 pulls you back to the tonic.\n\n---\n\n### 3. How to use it in pop\nPop songs don’t always stick to strict classical progressions, but you can borrow this idea to add a bit of jazz‑flavored tension before resolving.\n\n**Examples of usage in pop context:**\n1. **As a pre‑dominant in a minor section**  \n   If you’re in C major but want a moody moment, shift to the relative minor (A minor):  \n   C – Bm7♭5 – E7 – Am  \n   The Bm7♭5 acts like a dark “bridge” chord that makes the resolution to Am very satisfying.\n\n2. **Chromatic voice‑leading**  \n   Move bass lines step‑wise:  \n   Am – Am(maj7) – Am7 – Bm7♭5 – E7 – Am  \n   Each chord changes just a note or two, and the Bm7♭5 is the penultimate tension before the V7.\n\n3. **Smooth ascending bass into a major key**  \n   In a song in C major:  \n   C – Bm7♭5 – E7 – Am – F – G – C  \n   Here the half‑diminished chord acts as a borrowed chord from A minor, giving you a soulful “borrowed bridge” flavor.\n\n---\n\n### 4. Guitar application tips\n- **Common grip for m7♭5:**  \n  For Bm7♭5 starting on 7th fret (root on low E):  \n  7 (B), 8 (F), 7 (A), 7 (D), mute high strings if you want a compact sound.  \n- Or in open position:  \n  x20201 (B, F, A, D, F, B) — nice for fingerpicking.\n\n---\n\n**In short:**  \nThink of the half‑diminished seventh as a “gateway” chord — it leans toward a dominant (V7) that resolves to a minor tonic. Drop it in right before a V7 for a burst of tension that makes the resolution pop.\n\n---\n\nIf you’d like, I can sketch you a 4‑bar pop progression using a half‑diminished chord and explain exactly how to finger it on guitar. Would you like me to do that?"
        },
        {
            "role": "user",
            "content": "Let’s use the flavor of that half‑diminished seventh chord in a song. Can you write lyrics for a verse, bridge, and chorus about a kid’s wanderlust for Kazakhstan. Make note of which lines the half‑diminished seventh chord occurs and fill in the other chords as needed for the song. Prefer a key with a majority of open chord positions if you can manage it; chords that involve wrapping the thumb around the guitar neck such as 20221X for G♭m7♭5 are fine. Remember to add a preamble of chord grips (e.g. X32010 for C) for the chords you envision using in the song."
        }
    ]
}

sample_markdown_response1 = '''
Got it — let’s design a little harmonic framework where the **half‑diminished seventh** is the “spice” chord, then wrap original lyrics (no copyrighted material) around it to capture a child’s wanderlust for Kyrgyzstan.

We’ll write in **C major** (so A minor is the relative minor). In this key, the **iiø7 in A minor** is **Bm7♭5**, and it will lead nicely into E7 before resolving to Am.

---

## Verse
*(gentle folk/pop feel, fingerpicking suggested)*

**Chords:**
| C | G | Am | F |
| C | Bm7♭5 | E7 | Am |

**Lyrics:**
1. **C** In my room I spread the map across the floor
2. **G** Mountains rise like dreams I’ve never seen before
3. **Am** Snowy peaks call softly through the air
4. **F** Whispering tales for those who dare
5. **C** I trace the roads, my finger finds its plan
6. **Bm7♭5** A winding path into **E7** Kyrgyzstan
7. **Am** Where rivers race and skies are free

---

**Note:** The **Bm7♭5** on line 6 is where the half‑diminished “flavor” appears — it creates a yearning pull into E7 then Am, matching the sense of longing.

---

## Bridge
*(More tension, building anticipation before chorus)*

**Chords:**
| Dm | G | C | Am |
| Dm | Bm7♭5 | E7 | Am |

**Lyrics:**
1. **Dm** I hear the horses pounding over hills
2. **G** Campfires glow where night is still
3. **C** Stories traded under silver stars
4. **Am** Carry me past these city bars
5. **Dm** The world turns wide, my heart runs faster
6. **Bm7♭5** Guiding me home to **E7** what I’m after
7. **Am** The valleys deep in Kyrgyz land

---

Half‑diminished here (Bm7♭5) again underlines the emotional lift into the dominant E7.

---

## Chorus
*(Stronger rhythm, strummed chords, open voicings)*

**Chords:**
| F | G | C | Am |
| F | G | C | Bm7♭5 |
| E7 | Am | F | G |
| C | Am |

**Lyrics:**
1. **F** Take me where the sky meets stone
2. **G** Where the winds will carve my own
3. **C** Every trail a call to run
4. **Am** Under the Kyrgyz sun
5. **F** Freedom hums in every stream
6. **G** Riding on my childhood dream
7. **C** Step by step, the journey’s spun
8. **Bm7♭5** Pull me onward to **E7** Kyrgyzstan
9. **Am** I’ll find my story there
10. **F** In the mountains’ gentle care
11. **G** And the rivers’ silver plan
12. **C** Kyrgyzstan
13. **Am** Kyrgyzstan

---

### Guitarist’s tip:
- For **Bm7♭5** in open position, use **x20201** — it flows smoothly into **E7 (020100)** on acoustic.
- The half‑diminished always falls on a lyric that conveys longing or motion toward the destination.

---

If you want, I can also **notate a simple fingerpicking pattern** for verse lines so the half‑diminished moment really “sparkles” in the arrangement. Would you like me to add that next?
'''

sample_markdown_response2 = '''
Alright — let’s build this from the ground up in a **guitar‑friendly key** with lots of open chords, then sprinkle in a half‑diminished seventh for color, just like we discussed earlier.

---

## **Preamble: chord grips**
We’ll use **Key of C major**, with an excursion into its relative minor (**A minor**) for the half‑diminished flavor.

**Chord grips:**
- **C**: X32010
- **G**: 320003
- **Am**: X02210
- **F**: 133211 (or **XX3211** for easier version)
- **E7**: 020100
- **Dm**: XX0231
- **Bm7♭5**: X20201 *(B, F, A, D, F, B — root on A string)*
- **Am(maj7)**: X02110 *(optional color chord)*

---

## **Harmonic plan:**
- Verse: stays mostly in C major to set a bright, open mood
- Bridge: dips into A minor, uses **Bm7♭5 → E7 → Am** to create tension/release
- Chorus: back to C major for uplift

---

## **Song: “Maps to the Mountains”**

**Verse 1** (Key of C major)
(C) I spread the map out wide, tracing lines with (G) eager hands
(Am) Rivers wind like silk threads through a (F) far‑off land
(C) Names I’ve never spoken, roll like (G) music on my tongue
(Am) Tajikistan is calling, (F) like a story just begun

---

**Bridge** (moves to A minor — half‑diminished appears here)
(Am) Snow‑bright peaks are watching from the (Am(maj7)) edge of every dream
(Dm) Roads that twist through valleys where the (Bm7♭5) shadows lean ← *half‑diminished here*
(E7) Footsteps in the future that will (Am) echo back to me
(F) Pastures sing in colors I have (G) yet to truly see

---

**Chorus** (back to C major)
(C) I’ll go where the morning paints the (G) clouds a brighter hue
(Am) Learn the songs the wind has carried (F) all the way to you
(C) Every mile will weave my heart into a (G) tapestry of plans
(Am) Till I lay my eyes in wonder on (F) green Tajikistan

---

### **Why the Bm7♭5 works here**
That **Bm7♭5 → E7 → Am** chain in the bridge creates a yearning, unresolved tension — exactly the emotional flavor you want when your lyrics are about longing for a distant place. The half‑diminished chord sits right before the dominant (E7), so your ear feels a pull toward home base (Am), much like the “pull” in the kid’s wanderlust.

---

If you’d like, I can **tab out the strumming pattern** and show you how to smoothly shift from the open‑shape Bm7♭5 to the E7 without breaking rhythm. That would make the bridge groove nicely while keeping the harmonic color intact. Would you like me to do that next?
'''
