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

## 🛠️ Technische installatie

### Vereisten
- Node.js 18+
- npm 9+

### Installeren & starten

```bash
# Clone de repo
git clone https://github.com/Hoekies/regenwormen.git
cd regenwormen

# Installeer alle dependencies
npm install

# Start server + client tegelijk
npm run dev
```

- **Client:** http://localhost:5173
- **Server:** http://localhost:3001

### Projectstructuur

```
regenwormen/
  packages/
    shared/          # Spelregels (TypeScript, gedeeld door client en server)
  server/            # Socket.IO server (Node + Express)
  client/            # React + Vite frontend
```

### Tests uitvoeren

```bash
npm test
```

### Bouwen voor productie

```bash
npm run build
```

---

## 🚀 Deployen

- **Server:** deploy `server/` op [Render](https://render.com), [Railway](https://railway.app) of [Fly.io](https://fly.io)
- **Client:** deploy `client/` op [Vercel](https://vercel.com) of [Netlify](https://netlify.com)
- Zet de server-URL in de client socket-verbinding

---

## 🃏 Stack

| Laag | Technologie |
|------|------------|
| Frontend | React 19 + Vite + TypeScript |
| Backend | Node.js + Express + Socket.IO |
| Spelregels | Gedeeld TypeScript pakket |
| Stijl | CSS (geen framework) |
| Tests | Vitest |

---

## 📜 Licentie

MIT — vrij te gebruiken en aan te passen.

---

*Gebaseerd op het bordspel Regenwormen van 999 Games / Zoch Verlag.*
