# 🪱 Hoekies Regenwormen

Online multiplayer versie van het dobbelspel **Regenwormen** van 999 Games — voor 2 tot 7 spelers op eigen apparaat, via spel-codes. Speelt soepel op telefoon en desktop, met automatische reconnectie.

**Live:** https://hoekies-regenwormen.vercel.app/

---

## 🎮 Hoe te spelen (online)

### Spel starten
1. Open de app
2. Vul je naam in → druk **Spel starten**
3. Je krijgt een 4-letter spel-code
4. Deel deze code met andere spelers (via WhatsApp, etc.)
5. Zij vullen hun naam in, voegen de spel-code in, en drukken **Joinen**

### In het spel
1. Wacht tot iedereen gejoint is (max. 7 spelers)
2. De host (jij) drukt **START!**
3. Speel totdat alle tegels weg zijn
4. Wie de meeste wormen heeft, wint 🏆

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

## 🚀 Zelf hosten

De app bestaat uit twee delen (monorepo met npm workspaces):

| Deel | Hosting | Tech |
|------|---------|------|
| **Client** | [Vercel](https://vercel.com) | React + Vite (TypeScript) |
| **Server** | [Render](https://render.com) | Node.js + Socket.IO |

### Stap 1 — Server op Render
1. Maak een nieuw **Web Service** op Render, verbind deze GitHub repo
2. Stel **Start Command** in: `npm install && npm start --workspace=server`
3. Zet **Root Directory** op `/` (niet `server/`)
4. Kopieer de publieke URL (bijv. `https://regenwormen-server.onrender.com`)

### Stap 2 — Client op Vercel
1. Importeer deze repo op Vercel
2. Stel **Root Directory** in op `client/`
3. Voeg **Environment Variable** toe:
   - Naam: `VITE_SERVER_URL`
   - Waarde: de Render-URL uit stap 1
4. Deploy — Vercel gebruikt `vercel.json` en `client/index.html` automatisch

### Lokaal draaien
```bash
npm install                 # Install all dependencies
npm run dev                 # Start both server + client (Concurrently)
```
- Client draait op `http://localhost:5174`
- Server draait op `http://localhost:3001`

---

## ✨ Features

- **Realtime multiplayer**: Socket.IO voor live synchronisatie
- **Mobile-friendly**: Volledig responsive, SafeArea support voor notches
- **Reconnectie**: Automatisch herstellen van verbinding (tot 20 pogingen, 60s window)
- **Persistentie**: localStorage sessies, zodat je terug kunt joinen na reconnect
- **Geluid**: Intro-muziek + dobbelsteen geluidseffecten
- **WhatsApp delen**: Directe link naar delen via WhatsApp met preview
- **Responsive design**: 100dvh fullscreen, geen scrolling op mobiel

---

## 🛠️ Tech Stack

| Laag | Technologie |
|------|------------|
| **Frontend** | React 18, TypeScript, Vite, CSS Grid |
| **Backend** | Node.js, Express, Socket.IO, TypeScript |
| **State** | Server-authoritative, pure functions (immutable rules) |
| **Deployment** | Vercel (client), Render (server) |

---

## 📄 Projectstructuur

```
.
├── packages/
│   └── shared/              # Gedeelde types + spelregels
│       ├── types.ts         # GameState, Player, events
│       └── rules.ts         # Pure game logic (no side effects)
├── client/                  # React + Vite webapp
│   ├── src/
│   │   ├── views/           # Lobby, GameTable, Finished
│   │   ├── components/      # DiceButton, TileRow, PlayerStack
│   │   └── hooks/           # useIntroAudio, useDiceSound
│   └── public/img/          # Worm avatars, tegels, geluid
├── server/                  # Node.js + Socket.IO
│   ├── src/
│   │   ├── index.ts         # Express + Socket.IO setup
│   │   ├── gameSocket.ts    # Event handlers
│   │   └── rooms.ts         # Room state management
└── vercel.json, render.yaml # Deployment config
```

---

## 📜 Licentie

MIT — vrij te gebruiken en aan te passen.

---

*Gebaseerd op het bordspel Regenwormen van 999 Games / Zoch Verlag.*
*Gebouwd met ❤️ door Hoekies.*
