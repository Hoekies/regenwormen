# 🪱 Hoekies Regenwormen

Online multiplayer versie van het dobbelspel **Regenwormen** van 999 Games — voor 2 tot 7 spelers op eigen apparaat, via een room-code.

---

## 🎮 Spelen

1. Open de app in je browser
2. Vul je naam in en maak een room aan — je krijgt een 4-letter code
3. Deel de code met andere spelers — zij joinen op hun eigen telefoon of laptop
4. De host drukt op **START!**
5. Speel!

---

## 📱 Spelersuitleg

### Doel
Verzamel zo veel mogelijk **regenwormen** op tegels. Wie aan het einde de meeste wormen heeft, wint.

### Voorbereiding
16 tegels (21–36) liggen open in het midden. Elke tegel heeft 1 tot 4 wormen:

| Tegels | Wormen |
|--------|--------|
| 21–24  | 🪱     |
| 25–28  | 🪱🪱   |
| 29–32  | 🪱🪱🪱 |
| 33–36  | 🪱🪱🪱🪱 |

### Jouw beurt

**1. Gooi alle dobbelstenen**
Druk op de dobbelsteen-knop. Je gooit alle beschikbare stenen (maximaal 8).

**2. Kies een waarde**
Kies één waarde die in je worp zit. Alle stenen met die waarde leg je apart.
- Je mag een waarde die je al eerder hebt gekozen **niet** nogmaals kiezen.
- Een worm (🪱) telt als **5 punten** voor je som.

**3. Gooi opnieuw of stop**
Je mag blijven gooien met de resterende stenen, of stoppen als je een tegel kunt pakken.

### Een tegel pakken
Je mag stoppen als:
- Je **minstens één worm** apart hebt liggen, én
- Je som **gelijk is aan of hoger is dan** de laagste tegel in het midden

Je pakt dan:
- De tegel die **exact** overeenkomt met je som (als die beschikbaar is), óf
- De **hoogste tegel** die lager of gelijk is aan je som

> **Tegel stelen:** Is je som exact gelijk aan de bovenste tegel van een tegenstander? Dan **steel** je die tegel!

### Verflixt! (Bust)
Je hebt een bust als:
- Je geen nieuwe waarde meer kunt kiezen uit je worp, óf
- Je stopt zonder worm, óf
- Je som is te laag voor alle tegels in het midden

Bij een bust:
1. Je **bovenste eigen tegel** gaat terug naar het midden
2. De **hoogste open tegel** in het midden gaat dicht (uit het spel) — tenzij jouw teruggelegde tegel de hoogste is

### Einde van het spel
Het spel eindigt als er geen open tegels meer in het midden liggen.

**Winnaar:** de speler met de meeste wormen. Bij gelijke stand wint de speler met de hoogste tegel.

---

## 🚀 Online zetten

De app bestaat uit twee delen die apart gehost worden:

| Deel | Waar | Wat |
|------|------|-----|
| **Client** | [Vercel](https://vercel.com) | Statische React-app |
| **Server** | [Railway](https://railway.app) | Socket.IO server |

### Stap 1 — Server op Railway
1. Maak een nieuw project op Railway, koppel deze GitHub repo
2. Stel de **root directory** in op `server/`
3. Start-commando: `npm install && npm run build && npm start`
4. Kopieer de publieke URL (bijv. `https://regenwormen-server.railway.app`)

### Stap 2 — Client op Vercel
1. Importeer deze repo op Vercel
2. Voeg een **Environment Variable** toe:
   - Naam: `VITE_SERVER_URL`
   - Waarde: de Railway-URL uit stap 1
3. Deploy — Vercel pakt automatisch `vercel.json` op

---

## 📜 Licentie

MIT — vrij te gebruiken en aan te passen.

---

*Gebaseerd op het bordspel Regenwormen van 999 Games / Zoch Verlag.*
