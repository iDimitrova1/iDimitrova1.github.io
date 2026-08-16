(() => {
  "use strict";

  const STORAGE_KEY = "gildedGamesArcade.v2";
  const OLD_ROULETTE_KEY = "virtualRouletteState.v1";
  const STARTING_BALANCE = 1000;
  const MAX_ROULETTE_HISTORY = 16;
  const MAX_SLOT_HISTORY = 8;
  const SLOT_ROWS = 3;
  const SLOT_REEL_COUNT = 5;
  const SLOT_LINE_OPTIONS = [1, 3, 5, 10];
  const SLOT_PAYLINES = [
    [1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0],
    [2, 2, 2, 2, 2],
    [0, 1, 2, 1, 0],
    [2, 1, 0, 1, 2],
    [0, 0, 1, 2, 2],
    [2, 2, 1, 0, 0],
    [1, 0, 0, 0, 1],
    [1, 2, 2, 2, 1],
    [0, 1, 1, 1, 0]
  ];
  const VALID_VIEWS = new Set(["menu", "slots", "roulette", "blackjack"]);

  const WHEEL_SEQUENCE = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23,
    10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
  ];
  const RED_NUMBERS = new Set([
    1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36
  ]);
  const TAU = Math.PI * 2;

  const SLOT_SYMBOLS = {
    cherry: { glyph: "●", label: "Cherry" },
    lemon: { glyph: "◆", label: "Lemon" },
    crown: { glyph: "♛", label: "Crown" },
    star: { glyph: "★", label: "Star" },
    seven: { glyph: "7", label: "Seven" },
    diamond: { glyph: "♦", label: "Diamond" }
  };
  const SLOT_WEIGHTED_KEYS = [
    "cherry", "cherry", "cherry", "cherry", "cherry",
    "lemon", "lemon", "lemon", "lemon",
    "crown", "crown", "crown",
    "star", "star",
    "diamond", "diamond",
    "seven"
  ];
  const SLOT_PAYOUTS = {
    cherry: { 2: 2, 3: 5, 4: 15, 5: 40 },
    lemon: { 2: 2, 3: 7, 4: 20, 5: 50 },
    crown: { 2: 2.5, 3: 10, 4: 25, 5: 70 },
    star: { 2: 3, 3: 12, 4: 35, 5: 90 },
    diamond: { 2: 4, 3: 15, 4: 45, 5: 120 },
    seven: { 2: 5, 3: 20, 4: 60, 5: 200 }
  };

  const SUITS = [
    { symbol: "♠", color: "black", name: "spades" },
    { symbol: "♥", color: "red", name: "hearts" },
    { symbol: "♦", color: "red", name: "diamonds" },
    { symbol: "♣", color: "black", name: "clubs" }
  ];
  const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

  function defaultSlotsState() {
    return {
      selectedBet: 10,
      selectedLines: 5,
      lastPayout: 0,
      history: [],
      spinning: false,
      pendingBet: 0,
      grid: [
        ["seven", "star", "diamond", "crown", "lemon"],
        ["cherry", "seven", "star", "diamond", "crown"],
        ["lemon", "cherry", "seven", "star", "diamond"]
      ],
      winningLines: [],
      resultLabel: "Ready",
      resultText: "Choose a wager and active paylines, then pull the lever.",
      resultTone: ""
    };
  }

  function defaultRouletteState() {
    return {
      selectedChip: 1,
      bets: new Map(),
      betActions: [],
      lastBets: [],
      history: [],
      lastPayout: 0,
      spinning: false,
      pendingSpin: null,
      wheelRotation: 0,
      ballAngle: -Math.PI / 2,
      ballRadiusFactor: 0.78,
      showBall: true,
      resultText: "Choose a chip and select one or more bets.",
      resultTone: ""
    };
  }

  function defaultBlackjackState() {
    return {
      selectedBet: 25,
      wager: 0,
      player: [],
      dealer: [],
      deck: [],
      inRound: false,
      busy: false,
      dealerRevealed: false,
      lastPayout: 0,
      resultLabel: "Table open",
      resultText: "Choose a wager and deal.",
      resultTone: ""
    };
  }

  const state = {
    balance: STARTING_BALANCE,
    currentView: "menu",
    slots: defaultSlotsState(),
    roulette: defaultRouletteState(),
    blackjack: defaultBlackjackState()
  };

  const els = {
    views: Array.from(document.querySelectorAll("[data-view]")),
    navButtons: Array.from(document.querySelectorAll(".game-nav [data-view-target]")),
    allViewButtons: Array.from(document.querySelectorAll("[data-view-target]")),
    globalBalance: document.querySelector("#global-balance"),
    resetCasino: document.querySelector("#reset-casino"),
    toast: document.querySelector("#toast"),

    slotsBalance: document.querySelector("#slots-balance"),
    slotReelWindow: document.querySelector("#slot-reel-window"),
    slotReels: Array.from(document.querySelectorAll("[data-slot-reel]")),
    slotPaylines: document.querySelector("#slot-paylines"),
    slotResult: document.querySelector("#slot-result"),
    slotBets: document.querySelector("#slot-bets"),
    slotLines: document.querySelector("#slot-lines"),
    slotLever: document.querySelector("#slot-lever"),
    slotLeverStatus: document.querySelector("#slot-lever-status"),
    slotLineStake: document.querySelector("#slot-line-stake"),
    slotWagerSummary: document.querySelector("#slot-wager-summary"),
    slotActiveLinesLabel: document.querySelector("#slot-active-lines-label"),
    slotMaxCoefficient: document.querySelector("#slot-max-coefficient"),
    slotPaytableMode: document.querySelector("#slot-paytable-mode"),
    slotPaytableNote: document.querySelector("#slot-paytable-note"),
    slotPaytableValues: Array.from(document.querySelectorAll("[data-slot-base]")),
    slotsLastPayout: document.querySelector("#slots-last-payout"),
    slotHistory: document.querySelector("#slot-history"),
    slotHistoryCount: document.querySelector("#slot-history-count"),

    rouletteBalance: document.querySelector("#roulette-balance"),
    rouletteCurrentBet: document.querySelector("#roulette-current-bet"),
    rouletteLastPayout: document.querySelector("#roulette-last-payout"),
    rouletteSpinCount: document.querySelector("#roulette-spin-count"),
    rouletteWheel: document.querySelector("#roulette-wheel"),
    rouletteTable: document.querySelector("#roulette-table"),
    rouletteNumberGrid: document.querySelector("#roulette-number-grid"),
    rouletteChips: document.querySelector("#roulette-chips"),
    rouletteSpin: document.querySelector("#roulette-spin"),
    rouletteClear: document.querySelector("#roulette-clear"),
    rouletteUndo: document.querySelector("#roulette-undo"),
    rouletteRepeat: document.querySelector("#roulette-repeat"),
    rouletteResultBox: document.querySelector("#roulette-result-box"),
    rouletteResultText: document.querySelector("#roulette-result-text"),
    rouletteHistory: document.querySelector("#roulette-history"),
    rouletteHistoryCount: document.querySelector("#roulette-history-count"),

    blackjackBalance: document.querySelector("#blackjack-balance"),
    blackjackBets: document.querySelector("#blackjack-bets"),
    blackjackDeal: document.querySelector("#blackjack-deal"),
    blackjackHit: document.querySelector("#blackjack-hit"),
    blackjackStand: document.querySelector("#blackjack-stand"),
    blackjackDouble: document.querySelector("#blackjack-double"),
    blackjackResult: document.querySelector("#blackjack-result"),
    blackjackLastPayout: document.querySelector("#blackjack-last-payout"),
    dealerCards: document.querySelector("#dealer-cards"),
    playerCards: document.querySelector("#player-cards"),
    dealerScore: document.querySelector("#dealer-score"),
    playerScore: document.querySelector("#player-score")
  };

  const rouletteContext = els.rouletteWheel.getContext("2d");
  let toastTimer = 0;

  function isFiniteNonNegative(value) {
    return Number.isFinite(value) && value >= 0;
  }

  function formatCredits(value) {
    return new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 2,
      minimumFractionDigits: Number.isInteger(value) ? 0 : Math.min(2, String(value).split(".")[1]?.length || 0)
    }).format(value);
  }

  function roundCredits(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  function formatMultiplier(value) {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
  }

  function isValidSlotGrid(grid) {
    return Array.isArray(grid)
      && grid.length === SLOT_ROWS
      && grid.every((row) => Array.isArray(row)
        && row.length === SLOT_REEL_COUNT
        && row.every((key) => Boolean(SLOT_SYMBOLS[key])));
  }

  function secureRandomInt(maxExclusive) {
    if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) return 0;
    if (!window.crypto?.getRandomValues) return Math.floor(Math.random() * maxExclusive);

    const range = 0x100000000;
    const limit = Math.floor(range / maxExclusive) * maxExclusive;
    const buffer = new Uint32Array(1);
    let value;
    do {
      window.crypto.getRandomValues(buffer);
      value = buffer[0];
    } while (value >= limit);
    return value % maxExclusive;
  }

  function wait(milliseconds) {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.classList.add("show");
    toastTimer = window.setTimeout(() => els.toast.classList.remove("show"), 2400);
  }

  function showInsufficientCredits(required) {
    showToast(`This action requires ${formatCredits(required)} credits.`);
    const wallet = els.globalBalance.closest(".wallet-pill");
    wallet.classList.remove("shake");
    requestAnimationFrame(() => wallet.classList.add("shake"));
  }

  function serializeCard(card) {
    return card && typeof card.rank === "string" && typeof card.suit === "string" && typeof card.color === "string"
      ? { rank: card.rank, suit: card.suit, color: card.color, suitName: card.suitName || "" }
      : null;
  }

  function saveState() {
    try {
      const roulette = state.roulette;
      const blackjack = state.blackjack;
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: 3,
          balance: state.balance,
          slots: {
            selectedBet: state.slots.selectedBet,
            selectedLines: state.slots.selectedLines,
            lastPayout: state.slots.lastPayout,
            history: state.slots.history,
            pendingBet: state.slots.pendingBet,
            grid: state.slots.grid,
            winningLines: state.slots.winningLines,
            resultLabel: state.slots.resultLabel,
            resultText: state.slots.resultText,
            resultTone: state.slots.resultTone
          },
          roulette: {
            selectedChip: roulette.selectedChip,
            bets: Array.from(roulette.bets.entries()),
            betActions: roulette.betActions,
            lastBets: roulette.lastBets,
            history: roulette.history,
            lastPayout: roulette.lastPayout,
            pendingSpin: roulette.pendingSpin,
            wheelRotation: roulette.wheelRotation,
            resultText: roulette.resultText,
            resultTone: roulette.resultTone
          },
          blackjack: {
            selectedBet: blackjack.selectedBet,
            wager: blackjack.wager,
            player: blackjack.player.map(serializeCard).filter(Boolean),
            dealer: blackjack.dealer.map(serializeCard).filter(Boolean),
            deck: blackjack.deck.map(serializeCard).filter(Boolean),
            inRound: blackjack.inRound,
            dealerRevealed: blackjack.dealerRevealed,
            lastPayout: blackjack.lastPayout,
            resultLabel: blackjack.resultLabel,
            resultText: blackjack.resultText,
            resultTone: blackjack.resultTone
          }
        })
      );
    } catch (error) {
      console.warn("Could not save arcade state.", error);
    }
  }

  function loadMigratedRouletteState() {
    try {
      const oldSaved = JSON.parse(localStorage.getItem(OLD_ROULETTE_KEY));
      if (!oldSaved || typeof oldSaved !== "object") return false;
      if (isFiniteNonNegative(oldSaved.balance)) state.balance = oldSaved.balance;
      if (Array.isArray(oldSaved.history)) {
        state.roulette.history = oldSaved.history
          .filter((number) => Number.isInteger(number) && number >= 0 && number <= 36)
          .slice(0, MAX_ROULETTE_HISTORY);
      }
      if (isFiniteNonNegative(oldSaved.lastPayout)) state.roulette.lastPayout = oldSaved.lastPayout;
      if (Array.isArray(oldSaved.lastBets)) {
        state.roulette.lastBets = oldSaved.lastBets.filter(
          (bet) => bet && typeof bet.type === "string" && typeof bet.value === "string" && isFiniteNonNegative(bet.amount) && bet.amount > 0
        );
      }
      return true;
    } catch (error) {
      console.warn("Could not migrate the earlier roulette save.", error);
      return false;
    }
  }

  function loadState() {
    let saved;
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch (error) {
      console.warn("Could not read arcade state.", error);
    }

    if (!saved || typeof saved !== "object") {
      if (loadMigratedRouletteState()) saveState();
      return;
    }

    if (isFiniteNonNegative(saved.balance)) state.balance = saved.balance;

    const slots = saved.slots;
    if (slots && typeof slots === "object") {
      if ([5, 10, 25, 50, 100].includes(slots.selectedBet)) state.slots.selectedBet = slots.selectedBet;
      if (SLOT_LINE_OPTIONS.includes(slots.selectedLines)) state.slots.selectedLines = slots.selectedLines;
      if (isFiniteNonNegative(slots.lastPayout)) state.slots.lastPayout = slots.lastPayout;
      if (Array.isArray(slots.history)) {
        state.slots.history = slots.history
          .filter((entry) => entry
            && isValidSlotGrid(entry.grid)
            && isFiniteNonNegative(entry.payout)
            && isFiniteNonNegative(entry.wager)
            && SLOT_LINE_OPTIONS.includes(entry.lines))
          .slice(0, MAX_SLOT_HISTORY)
          .map((entry) => ({
            grid: entry.grid.map((row) => row.slice()),
            payout: entry.payout,
            wager: entry.wager,
            lines: entry.lines,
            wins: Number.isInteger(entry.wins) && entry.wins >= 0 ? entry.wins : 0
          }));
      }
      if (isValidSlotGrid(slots.grid)) state.slots.grid = slots.grid.map((row) => row.slice());
      if (Array.isArray(slots.winningLines)) {
        state.slots.winningLines = slots.winningLines.filter((line) => Number.isInteger(line) && line >= 1 && line <= 10);
      }
      if (typeof slots.resultLabel === "string") state.slots.resultLabel = slots.resultLabel;
      if (typeof slots.resultText === "string") state.slots.resultText = slots.resultText;
      if (["", "win", "loss"].includes(slots.resultTone)) state.slots.resultTone = slots.resultTone;
      if (isFiniteNonNegative(slots.pendingBet) && slots.pendingBet > 0) {
        state.balance = roundCredits(state.balance + slots.pendingBet);
        state.slots.pendingBet = 0;
        state.slots.winningLines = [];
        state.slots.resultLabel = "Spin restored";
        state.slots.resultText = "An interrupted spin was cancelled and its wager was returned.";
        state.slots.resultTone = "";
      }
    }

    const roulette = saved.roulette;
    if (roulette && typeof roulette === "object") {
      if ([1, 5, 10, 25, 100].includes(roulette.selectedChip)) state.roulette.selectedChip = roulette.selectedChip;
      if (Array.isArray(roulette.bets)) {
        roulette.bets.forEach((entry) => {
          if (!Array.isArray(entry) || entry.length !== 2) return;
          const [key, amount] = entry;
          if (typeof key === "string" && isFiniteNonNegative(amount) && amount > 0) state.roulette.bets.set(key, amount);
        });
      }
      if (Array.isArray(roulette.betActions)) {
        state.roulette.betActions = roulette.betActions.filter(
          (action) => action && typeof action.key === "string" && isFiniteNonNegative(action.amount) && action.amount > 0
        );
      }
      if (Array.isArray(roulette.lastBets)) {
        state.roulette.lastBets = roulette.lastBets.filter(
          (bet) => bet && typeof bet.type === "string" && typeof bet.value === "string" && isFiniteNonNegative(bet.amount) && bet.amount > 0
        );
      }
      if (Array.isArray(roulette.history)) {
        state.roulette.history = roulette.history
          .filter((number) => Number.isInteger(number) && number >= 0 && number <= 36)
          .slice(0, MAX_ROULETTE_HISTORY);
      }
      if (isFiniteNonNegative(roulette.lastPayout)) state.roulette.lastPayout = roulette.lastPayout;
      if (Number.isInteger(roulette.pendingSpin) && roulette.pendingSpin >= 0 && roulette.pendingSpin <= 36) {
        state.roulette.pendingSpin = roulette.pendingSpin;
      }
      if (Number.isFinite(roulette.wheelRotation)) state.roulette.wheelRotation = roulette.wheelRotation;
      if (typeof roulette.resultText === "string") state.roulette.resultText = roulette.resultText;
      if (["", "win", "loss"].includes(roulette.resultTone)) state.roulette.resultTone = roulette.resultTone;
    }

    const blackjack = saved.blackjack;
    if (blackjack && typeof blackjack === "object") {
      if ([10, 25, 50, 100, 250].includes(blackjack.selectedBet)) state.blackjack.selectedBet = blackjack.selectedBet;
      if (isFiniteNonNegative(blackjack.wager)) state.blackjack.wager = blackjack.wager;
      if (Array.isArray(blackjack.player)) state.blackjack.player = blackjack.player.map(serializeCard).filter(Boolean);
      if (Array.isArray(blackjack.dealer)) state.blackjack.dealer = blackjack.dealer.map(serializeCard).filter(Boolean);
      if (Array.isArray(blackjack.deck)) state.blackjack.deck = blackjack.deck.map(serializeCard).filter(Boolean);
      state.blackjack.inRound = Boolean(blackjack.inRound && state.blackjack.wager > 0 && state.blackjack.player.length >= 2 && state.blackjack.dealer.length >= 2);
      state.blackjack.dealerRevealed = Boolean(blackjack.dealerRevealed);
      if (isFiniteNonNegative(blackjack.lastPayout)) state.blackjack.lastPayout = blackjack.lastPayout;
      if (typeof blackjack.resultLabel === "string") state.blackjack.resultLabel = blackjack.resultLabel;
      if (typeof blackjack.resultText === "string") state.blackjack.resultText = blackjack.resultText;
      if (["", "win", "loss", "push"].includes(blackjack.resultTone)) state.blackjack.resultTone = blackjack.resultTone;
      state.blackjack.busy = false;
    }
  }

  function updateBalanceDisplays() {
    const formatted = formatCredits(state.balance);
    els.globalBalance.textContent = formatted;
    els.slotsBalance.textContent = formatted;
    els.rouletteBalance.textContent = formatted;
    els.blackjackBalance.textContent = formatted;
  }

  function canChangeView() {
    if (state.slots.spinning) {
      showToast("The slot reels are still spinning.");
      return false;
    }
    if (state.roulette.spinning) {
      showToast("The roulette wheel is still spinning.");
      return false;
    }
    if (state.blackjack.busy) {
      showToast("The dealer is finishing the current hand.");
      return false;
    }
    return true;
  }

  function showView(view, updateHash = true) {
    const nextView = VALID_VIEWS.has(view) ? view : "menu";
    if (nextView !== state.currentView && !canChangeView()) return;

    state.currentView = nextView;
    els.views.forEach((section) => {
      section.hidden = section.dataset.view !== nextView;
    });
    els.navButtons.forEach((button) => {
      const active = button.dataset.viewTarget === nextView || (nextView === "menu" && button.dataset.viewTarget === "menu");
      button.classList.toggle("active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });

    const titles = {
      menu: "Casino Arcade",
      slots: "Slots — Casino Arcade",
      roulette: "Roulette — Casino Arcade",
      blackjack: "Blackjack — Casino Arcade"
    };
    document.title = titles[nextView];
    if (updateHash) history.replaceState(null, "", `#${nextView}`);
    if (nextView === "roulette") requestAnimationFrame(drawRouletteWheel);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* Slots */
  function getRandomSlotKey() {
    return SLOT_WEIGHTED_KEYS[secureRandomInt(SLOT_WEIGHTED_KEYS.length)];
  }

  function createSlotSymbolCell(key) {
    const symbol = SLOT_SYMBOLS[key] || SLOT_SYMBOLS.cherry;
    const cell = document.createElement("div");
    cell.className = "slot-symbol-cell";
    cell.dataset.symbol = key;
    cell.textContent = symbol.glyph;
    cell.setAttribute("aria-label", symbol.label);
    return cell;
  }

  function setSettledSlotReel(element, keys) {
    const strip = document.createElement("div");
    strip.className = "slot-reel-strip settled";
    keys.forEach((key) => strip.appendChild(createSlotSymbolCell(key)));
    element.classList.remove("spinning");
    element.replaceChildren(strip);
  }

  function renderSlotGrid(grid = state.slots.grid) {
    els.slotReels.forEach((reel, columnIndex) => {
      const keys = Array.from({ length: SLOT_ROWS }, (_, rowIndex) => grid[rowIndex][columnIndex]);
      setSettledSlotReel(reel, keys);
    });
    const readableRows = grid.map((row) => row.map((key) => SLOT_SYMBOLS[key].label).join(", ")).join("; ");
    els.slotReelWindow.setAttribute("aria-label", `Slot result by rows: ${readableRows}.`);
  }

  function generateSlotGrid() {
    return Array.from({ length: SLOT_ROWS }, () =>
      Array.from({ length: SLOT_REEL_COUNT }, () => getRandomSlotKey())
    );
  }

  function selectSlotBet(value) {
    if (state.slots.spinning || ![5, 10, 25, 50, 100].includes(value)) return;
    state.slots.selectedBet = value;
    saveState();
    updateSlotsUI();
  }

  function selectSlotLines(value) {
    const slots = state.slots;
    if (slots.spinning || !SLOT_LINE_OPTIONS.includes(value)) return;
    slots.selectedLines = value;
    slots.winningLines = [];
    slots.resultLabel = "Paylines set";
    slots.resultText = `${value} ${value === 1 ? "payline is" : "paylines are"} active. Each line receives ${formatCredits(slots.selectedBet / value)} credits.`;
    slots.resultTone = "";
    saveState();
    updateSlotsUI();
  }

  function getSlotLineSymbols(grid, payline) {
    return payline.map((rowIndex, columnIndex) => grid[rowIndex][columnIndex]);
  }

  function evaluateSlotLine(symbols, lineNumber, lineStake) {
    const symbolKey = symbols[0];
    let count = 1;
    while (count < symbols.length && symbols[count] === symbolKey) count += 1;
    const baseMultiplier = SLOT_PAYOUTS[symbolKey]?.[count] || 0;
    if (!baseMultiplier) return null;
    return {
      line: lineNumber,
      symbol: symbolKey,
      count,
      baseMultiplier,
      payout: roundCredits(lineStake * baseMultiplier)
    };
  }

  function evaluateSlotGrid(grid, wager, activeLines) {
    const lineStake = wager / activeLines;
    const wins = [];
    for (let index = 0; index < activeLines; index += 1) {
      const symbols = getSlotLineSymbols(grid, SLOT_PAYLINES[index]);
      const win = evaluateSlotLine(symbols, index + 1, lineStake);
      if (win) wins.push(win);
    }
    return {
      wins,
      payout: roundCredits(wins.reduce((sum, win) => sum + win.payout, 0))
    };
  }

  function renderSlotPaylines() {
    const activeLines = state.slots.selectedLines;
    const winning = new Set(state.slots.winningLines);
    const fragment = document.createDocumentFragment();
    for (let index = 0; index < activeLines; index += 1) {
      const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
      const points = SLOT_PAYLINES[index]
        .map((rowIndex, columnIndex) => `${50 + columnIndex * 100},${50 + rowIndex * 100}`)
        .join(" ");
      polyline.setAttribute("points", points);
      polyline.setAttribute("class", `slot-payline-path${winning.has(index + 1) ? " winning" : ""}`);
      polyline.dataset.line = String(index + 1);
      fragment.appendChild(polyline);
    }
    els.slotPaylines.replaceChildren(fragment);
  }

  function renderSlotPaytable() {
    const lines = state.slots.selectedLines;
    const lineStake = state.slots.selectedBet / lines;
    els.slotPaytableValues.forEach((element) => {
      const base = Number(element.dataset.slotBase);
      element.textContent = `${formatMultiplier(base / lines)}×`;
      element.title = `${formatMultiplier(base)}× the line stake`;
    });
    els.slotPaytableMode.textContent = `${lines}-line coefficients`;
    els.slotPaytableNote.textContent = `Coefficients are measured against the total wager. ${formatCredits(state.slots.selectedBet)} credits are split into ${lines} line ${lines === 1 ? "stake" : "stakes"} of ${formatCredits(lineStake)} each.`;
  }

  async function animateSlotReel(element, startingKeys, finalKeys, duration, fillerCount) {
    const height = Math.max(150, element.getBoundingClientRect().height);
    const cellHeight = height / SLOT_ROWS;
    const filler = Array.from({ length: fillerCount }, () => getRandomSlotKey());
    const sequence = [...startingKeys, ...filler, ...finalKeys];
    const strip = document.createElement("div");
    strip.className = "slot-reel-strip animating";
    sequence.forEach((key) => {
      const cell = createSlotSymbolCell(key);
      cell.style.height = `${cellHeight}px`;
      cell.style.flexBasis = `${cellHeight}px`;
      strip.appendChild(cell);
    });
    element.classList.add("spinning");
    element.replaceChildren(strip);

    const travel = (sequence.length - SLOT_ROWS) * cellHeight;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      await wait(40);
    } else {
      const animation = strip.animate(
        [
          { transform: "translateY(0)", filter: "blur(0)" },
          { offset: 0.13, filter: "blur(1.5px)" },
          { offset: 0.84, filter: "blur(1.5px)" },
          { offset: 0.93, transform: `translateY(${-travel - 8}px)`, filter: "blur(0.4px)" },
          { transform: `translateY(${-travel}px)`, filter: "blur(0)" }
        ],
        { duration, easing: "cubic-bezier(0.12, 0.72, 0.16, 1)", fill: "forwards" }
      );
      try {
        await animation.finished;
      } catch (error) {
        // The final reel state is still applied if the browser cancels an animation.
      }
    }
    setSettledSlotReel(element, finalKeys);
  }

  function animateLeverPull() {
    els.slotLever.classList.remove("auto-pull");
    els.slotLever.style.removeProperty("--lever-pull");
    void els.slotLever.offsetWidth;
    els.slotLever.classList.add("auto-pull");
    window.setTimeout(() => els.slotLever.classList.remove("auto-pull"), 560);
  }

  async function spinSlots(options = {}) {
    const slots = state.slots;
    if (slots.spinning) return;
    const wager = slots.selectedBet;
    if (wager > state.balance) {
      showInsufficientCredits(wager);
      return;
    }

    if (!options.leverAlreadyPulled) animateLeverPull();
    state.balance = roundCredits(state.balance - wager);
    slots.pendingBet = wager;
    slots.spinning = true;
    slots.winningLines = [];
    slots.resultLabel = "Spinning";
    slots.resultText = `${slots.selectedLines} ${slots.selectedLines === 1 ? "payline is" : "paylines are"} in play…`;
    slots.resultTone = "";
    saveState();
    updateAllUI();

    const startingGrid = slots.grid.map((row) => row.slice());
    const resultGrid = generateSlotGrid();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const baseDuration = reducedMotion ? 40 : 960;
    await Promise.all(els.slotReels.map((reel, columnIndex) => {
      const startingKeys = Array.from({ length: SLOT_ROWS }, (_, rowIndex) => startingGrid[rowIndex][columnIndex]);
      const finalKeys = Array.from({ length: SLOT_ROWS }, (_, rowIndex) => resultGrid[rowIndex][columnIndex]);
      return animateSlotReel(reel, startingKeys, finalKeys, baseDuration + columnIndex * (reducedMotion ? 12 : 170), 11 + columnIndex * 2);
    }));

    const outcome = evaluateSlotGrid(resultGrid, wager, slots.selectedLines);
    const payout = outcome.payout;
    state.balance = roundCredits(state.balance + payout);
    slots.pendingBet = 0;
    slots.spinning = false;
    slots.lastPayout = payout;
    slots.grid = resultGrid;
    slots.winningLines = outcome.wins.map((win) => win.line);
    slots.history.unshift({
      grid: resultGrid.map((row) => row.slice()),
      payout,
      wager,
      lines: slots.selectedLines,
      wins: outcome.wins.length
    });
    slots.history = slots.history.slice(0, MAX_SLOT_HISTORY);

    if (payout > 0) {
      const net = roundCredits(payout - wager);
      if (outcome.wins.length === 1) {
        const win = outcome.wins[0];
        const symbol = SLOT_SYMBOLS[win.symbol];
        slots.resultLabel = `Line ${win.line} wins`;
        slots.resultText = `${win.count} ${symbol.label}${win.count === 1 ? "" : "s"} paid ${formatCredits(payout)} credits (net ${net >= 0 ? "+" : ""}${formatCredits(net)}).`;
      } else {
        slots.resultLabel = `${outcome.wins.length} winning lines`;
        slots.resultText = `Combined payout ${formatCredits(payout)} credits (net ${net >= 0 ? "+" : ""}${formatCredits(net)}).`;
      }
      slots.resultTone = "win";
    } else {
      slots.resultLabel = "No winning lines";
      slots.resultText = `No payout. ${formatCredits(wager)} credits wagered across ${slots.selectedLines} ${slots.selectedLines === 1 ? "line" : "lines"}.`;
      slots.resultTone = "loss";
    }

    saveState();
    updateAllUI();
  }

  function updateSlotHistory() {
    els.slotHistory.replaceChildren();
    if (state.slots.history.length === 0) {
      const empty = document.createElement("span");
      empty.className = "history-empty";
      empty.textContent = "No spins yet";
      els.slotHistory.appendChild(empty);
    } else {
      state.slots.history.forEach((entry) => {
        const row = document.createElement("div");
        row.className = `slot-history-item${entry.payout > 0 ? " win" : ""}`;

        const miniGrid = document.createElement("div");
        miniGrid.className = "slot-history-grid";
        entry.grid.flat().forEach((key) => {
          const symbol = document.createElement("span");
          symbol.textContent = SLOT_SYMBOLS[key]?.glyph || "?";
          miniGrid.appendChild(symbol);
        });

        const copy = document.createElement("div");
        copy.className = "slot-history-copy";
        const title = document.createElement("strong");
        title.textContent = entry.wins > 0 ? `${entry.wins} winning ${entry.wins === 1 ? "line" : "lines"}` : "No line win";
        const meta = document.createElement("small");
        meta.textContent = `${formatCredits(entry.wager)} wager · ${entry.lines} ${entry.lines === 1 ? "line" : "lines"}`;
        copy.append(title, meta);

        const payout = document.createElement("strong");
        payout.className = "slot-history-payout";
        payout.textContent = entry.payout > 0 ? `+${formatCredits(entry.payout)}` : "0";
        row.append(miniGrid, copy, payout);
        els.slotHistory.appendChild(row);
      });
    }
    const count = state.slots.history.length;
    els.slotHistoryCount.textContent = `${count} ${count === 1 ? "result" : "results"}`;
  }

  function updateSlotsUI() {
    const slots = state.slots;
    els.slotBets.querySelectorAll("[data-slot-bet]").forEach((button) => {
      const selected = Number(button.dataset.slotBet) === slots.selectedBet;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-checked", String(selected));
      button.disabled = slots.spinning;
    });
    els.slotLines.querySelectorAll("[data-slot-lines]").forEach((button) => {
      const selected = Number(button.dataset.slotLines) === slots.selectedLines;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-checked", String(selected));
      button.disabled = slots.spinning;
    });

    const leverDisabled = slots.spinning || slots.selectedBet > state.balance;
    els.slotLever.disabled = leverDisabled;
    els.slotLeverStatus.textContent = slots.spinning ? "Spinning" : leverDisabled ? "Low balance" : "Ready";
    els.slotLineStake.textContent = formatCredits(slots.selectedBet / slots.selectedLines);
    els.slotWagerSummary.textContent = `${formatCredits(slots.selectedBet)} total across ${slots.selectedLines} ${slots.selectedLines === 1 ? "line" : "lines"}`;
    els.slotActiveLinesLabel.textContent = `${slots.selectedLines} active ${slots.selectedLines === 1 ? "line" : "lines"}`;
    els.slotMaxCoefficient.textContent = `${formatMultiplier(200 / slots.selectedLines)}× max per line`;
    els.slotsLastPayout.textContent = formatCredits(slots.lastPayout);

    els.slotResult.classList.remove("win", "loss");
    if (slots.resultTone) els.slotResult.classList.add(slots.resultTone);
    els.slotResult.querySelector("span").textContent = slots.resultLabel;
    els.slotResult.querySelector("strong").textContent = slots.resultText;

    if (!slots.spinning) renderSlotGrid();
    renderSlotPaylines();
    renderSlotPaytable();
    updateSlotHistory();
  }

  /* Roulette */
  function getNumberColor(number) {
    if (number === 0) return "green";
    return RED_NUMBERS.has(number) ? "red" : "black";
  }

  function rouletteBetKey(type, value) {
    return `${type}:${value}`;
  }

  function getRouletteTotalBet() {
    let total = 0;
    state.roulette.bets.forEach((amount) => {
      total += amount;
    });
    return total;
  }

  function buildRouletteNumberGrid() {
    const fragment = document.createDocumentFragment();
    for (let number = 1; number <= 36; number += 1) {
      const button = document.createElement("button");
      const color = getNumberColor(number);
      button.className = `bet-cell number-cell ${color}`;
      const rowIndex = number % 3 === 0 ? 0 : number % 3 === 2 ? 1 : 2;
      const columnIndex = Math.ceil(number / 3) - 1;
      button.style.setProperty("--desktop-order", String(rowIndex * 12 + columnIndex + 1));
      button.style.setProperty("--mobile-order", String(number));
      button.type = "button";
      button.dataset.betType = "straight";
      button.dataset.betValue = String(number);
      button.setAttribute("aria-label", `Bet on ${number} ${color}, pays 35 to 1`);
      button.innerHTML = `<span>${number}</span><small>35:1</small>`;
      fragment.appendChild(button);
    }
    els.rouletteNumberGrid.appendChild(fragment);
  }

  function selectRouletteChip(value) {
    if (state.roulette.spinning || ![1, 5, 10, 25, 100].includes(value)) return;
    state.roulette.selectedChip = value;
    saveState();
    updateRouletteUI();
  }

  function addRouletteBet(type, value, amount = state.roulette.selectedChip, recordAction = true) {
    const roulette = state.roulette;
    if (roulette.spinning) return false;
    if (amount > state.balance) {
      showInsufficientCredits(amount);
      return false;
    }

    const key = rouletteBetKey(type, value);
    roulette.bets.set(key, (roulette.bets.get(key) || 0) + amount);
    state.balance -= amount;
    if (recordAction) roulette.betActions.push({ key, amount });
    saveState();
    updateAllUI();
    return true;
  }

  function undoRouletteBet() {
    const roulette = state.roulette;
    if (roulette.spinning || roulette.betActions.length === 0) return;
    const action = roulette.betActions.pop();
    const current = roulette.bets.get(action.key) || 0;
    const next = current - action.amount;
    if (next > 0) roulette.bets.set(action.key, next);
    else roulette.bets.delete(action.key);
    state.balance += action.amount;
    saveState();
    updateAllUI();
  }

  function clearRouletteBets(refund = true) {
    const roulette = state.roulette;
    if (roulette.spinning) return;
    if (refund) state.balance += getRouletteTotalBet();
    roulette.bets.clear();
    roulette.betActions = [];
    saveState();
    updateAllUI();
  }

  function repeatRouletteBets() {
    const roulette = state.roulette;
    if (roulette.spinning || roulette.lastBets.length === 0) return;
    const required = roulette.lastBets.reduce((sum, bet) => sum + bet.amount, 0);
    const availableAfterRefund = state.balance + getRouletteTotalBet();
    if (required > availableAfterRefund) {
      showInsufficientCredits(required);
      return;
    }

    state.balance += getRouletteTotalBet();
    roulette.bets.clear();
    roulette.betActions = [];
    roulette.lastBets.forEach((bet) => {
      const key = rouletteBetKey(bet.type, bet.value);
      roulette.bets.set(key, (roulette.bets.get(key) || 0) + bet.amount);
      roulette.betActions.push({ key, amount: bet.amount });
      state.balance -= bet.amount;
    });
    saveState();
    updateAllUI();
  }

  function rouletteBetIncludesNumber(type, value, number) {
    if (type === "straight") return number === Number(value);
    if (number === 0) return false;

    switch (type) {
      case "color":
        return getNumberColor(number) === value;
      case "parity":
        return value === "even" ? number % 2 === 0 : number % 2 === 1;
      case "range":
        return value === "low" ? number >= 1 && number <= 18 : number >= 19 && number <= 36;
      case "dozen": {
        const dozen = Number(value);
        return number >= (dozen - 1) * 12 + 1 && number <= dozen * 12;
      }
      case "column": {
        const column = Number(value);
        return ((number - 1) % 3) + 1 === column;
      }
      default:
        return false;
    }
  }

  function getRouletteProfitOdds(type) {
    if (type === "straight") return 35;
    if (type === "dozen" || type === "column") return 2;
    return 1;
  }

  function settleRouletteBets(number) {
    let payout = 0;
    state.roulette.bets.forEach((amount, key) => {
      const separator = key.indexOf(":");
      const type = key.slice(0, separator);
      const value = key.slice(separator + 1);
      if (rouletteBetIncludesNumber(type, value, number)) payout += amount * (getRouletteProfitOdds(type) + 1);
    });
    return payout;
  }

  function easeOutQuint(t) {
    return 1 - Math.pow(1 - t, 5);
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function normalizeAngle(angle) {
    return ((angle % TAU) + TAU) % TAU;
  }

  function animateRouletteSpin(winningNumber) {
    return new Promise((resolve) => {
      const roulette = state.roulette;
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const duration = reducedMotion ? 450 : 4600;
      const segment = TAU / WHEEL_SEQUENCE.length;
      const winningIndex = WHEEL_SEQUENCE.indexOf(winningNumber);
      const desiredRotation = normalizeAngle(-winningIndex * segment - segment / 2);
      const currentMod = normalizeAngle(roulette.wheelRotation);
      const forwardDelta = normalizeAngle(desiredRotation - currentMod);
      const wheelTurns = reducedMotion ? 1 : 7 + secureRandomInt(3);
      const targetWheelRotation = roulette.wheelRotation + wheelTurns * TAU + forwardDelta;
      const startWheelRotation = roulette.wheelRotation;
      const startBallAngle = roulette.ballAngle;
      const ballTurns = reducedMotion ? 1 : 10 + secureRandomInt(4);
      const targetBallAngle = -Math.PI / 2 - ballTurns * TAU;
      const startTime = performance.now();
      roulette.showBall = true;

      function frame(now) {
        const progress = Math.min(1, (now - startTime) / duration);
        roulette.wheelRotation = startWheelRotation + (targetWheelRotation - startWheelRotation) * easeOutQuint(progress);
        roulette.ballAngle = startBallAngle + (targetBallAngle - startBallAngle) * easeInOutCubic(progress);

        if (progress < 0.72) {
          roulette.ballRadiusFactor = 0.79;
        } else {
          const landing = (progress - 0.72) / 0.28;
          const bounce = Math.sin(landing * Math.PI * 5) * (1 - landing) * 0.018;
          roulette.ballRadiusFactor = 0.79 - landing * 0.11 + bounce;
        }
        drawRouletteWheel();

        if (progress < 1) {
          requestAnimationFrame(frame);
        } else {
          roulette.wheelRotation = targetWheelRotation;
          roulette.ballAngle = -Math.PI / 2;
          roulette.ballRadiusFactor = 0.68;
          drawRouletteWheel();
          resolve();
        }
      }
      requestAnimationFrame(frame);
    });
  }

  function completeRouletteSpin(winningNumber, recovered = false) {
    const roulette = state.roulette;
    const wager = getRouletteTotalBet();
    const payout = settleRouletteBets(winningNumber);
    const net = payout - wager;
    state.balance += payout;
    roulette.lastPayout = payout;
    roulette.history.unshift(winningNumber);
    roulette.history = roulette.history.slice(0, MAX_ROULETTE_HISTORY);

    const color = getNumberColor(winningNumber);
    const colorName = color[0].toUpperCase() + color.slice(1);
    if (payout > 0) {
      roulette.resultTone = "win";
      roulette.resultText = `${recovered ? "Recovered result: " : ""}${winningNumber} ${colorName} — payout ${formatCredits(payout)} credits (net ${net >= 0 ? "+" : ""}${formatCredits(net)}).`;
    } else {
      roulette.resultTone = "loss";
      roulette.resultText = `${recovered ? "Recovered result: " : ""}${winningNumber} ${colorName} — no winning bets this spin.`;
    }

    roulette.bets.clear();
    roulette.betActions = [];
    roulette.pendingSpin = null;
    roulette.spinning = false;
    saveState();
    updateAllUI();
  }

  async function spinRoulette() {
    const roulette = state.roulette;
    if (roulette.spinning || getRouletteTotalBet() <= 0) return;

    roulette.spinning = true;
    roulette.lastBets = Array.from(roulette.bets.entries()).map(([key, amount]) => {
      const separator = key.indexOf(":");
      return { type: key.slice(0, separator), value: key.slice(separator + 1), amount };
    });
    roulette.resultTone = "";
    roulette.resultText = "The wheel is spinning…";
    const winningNumber = secureRandomInt(37);
    roulette.pendingSpin = winningNumber;
    saveState();
    updateRouletteUI();

    await animateRouletteSpin(winningNumber);
    completeRouletteSpin(winningNumber);
  }

  function recoverPendingRouletteSpin() {
    const roulette = state.roulette;
    if (roulette.pendingSpin === null) return;
    if (roulette.bets.size === 0) {
      roulette.pendingSpin = null;
      saveState();
      return;
    }
    completeRouletteSpin(roulette.pendingSpin, true);
  }

  function updateRouletteBetMarkers() {
    els.rouletteTable.querySelectorAll(".bet-amount").forEach((marker) => marker.remove());
    state.roulette.bets.forEach((amount, key) => {
      const separator = key.indexOf(":");
      const type = key.slice(0, separator);
      const value = key.slice(separator + 1);
      const button = els.rouletteTable.querySelector(`[data-bet-type="${type}"][data-bet-value="${value}"]`);
      if (!button) return;
      const marker = document.createElement("span");
      marker.className = "bet-amount";
      marker.textContent = formatCredits(amount);
      marker.setAttribute("aria-label", `${formatCredits(amount)} credits bet`);
      button.appendChild(marker);
    });
  }

  function updateRouletteHistory() {
    els.rouletteHistory.replaceChildren();
    if (state.roulette.history.length === 0) {
      const empty = document.createElement("span");
      empty.className = "history-empty";
      empty.textContent = "No spins yet";
      els.rouletteHistory.appendChild(empty);
    } else {
      state.roulette.history.forEach((number) => {
        const item = document.createElement("span");
        const color = getNumberColor(number);
        item.className = `history-number ${color}`;
        item.textContent = String(number);
        item.title = `${number} ${color}`;
        els.rouletteHistory.appendChild(item);
      });
    }
    const count = state.roulette.history.length;
    els.rouletteHistoryCount.textContent = `${count} ${count === 1 ? "result" : "results"}`;
    els.rouletteSpinCount.textContent = formatCredits(count);
  }

  function updateRouletteUI() {
    const roulette = state.roulette;
    const totalBet = getRouletteTotalBet();
    els.rouletteCurrentBet.textContent = formatCredits(totalBet);
    els.rouletteLastPayout.textContent = formatCredits(roulette.lastPayout);

    const canInteract = !roulette.spinning;
    els.rouletteTable.querySelectorAll("[data-bet-type]").forEach((button) => {
      button.disabled = !canInteract;
    });
    els.rouletteChips.querySelectorAll(".chip").forEach((button) => {
      const selected = Number(button.dataset.chip) === roulette.selectedChip;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-checked", String(selected));
      button.disabled = !canInteract;
    });

    els.rouletteUndo.disabled = !canInteract || roulette.betActions.length === 0;
    els.rouletteClear.disabled = !canInteract || totalBet === 0;
    els.rouletteRepeat.disabled = !canInteract || roulette.lastBets.length === 0;
    els.rouletteSpin.disabled = !canInteract || totalBet === 0;
    els.rouletteSpin.querySelector("span").textContent = roulette.spinning ? "Spinning" : "Spin";
    els.rouletteSpin.querySelector("small").textContent = roulette.spinning
      ? "Result pending"
      : totalBet > 0
        ? `${formatCredits(totalBet)} credits wagered`
        : "Place a bet first";

    els.rouletteResultBox.classList.remove("win", "loss");
    if (roulette.resultTone) els.rouletteResultBox.classList.add(roulette.resultTone);
    els.rouletteResultText.textContent = roulette.resultText;
    updateRouletteBetMarkers();
    updateRouletteHistory();
  }

  function drawRouletteWheel() {
    const roulette = state.roulette;
    const canvas = els.rouletteWheel;
    const ctx = rouletteContext;
    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const outerRadius = width * 0.47;
    const pocketOuter = outerRadius * 0.88;
    const pocketInner = outerRadius * 0.56;
    const centerRadius = outerRadius * 0.37;
    const segment = TAU / WHEEL_SEQUENCE.length;

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(cx, cy);

    ctx.fillStyle = "#171914";
    ctx.beginPath();
    ctx.arc(0, 0, outerRadius, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = "#dbbc67";
    ctx.lineWidth = 15;
    ctx.beginPath();
    ctx.arc(0, 0, outerRadius - 8, 0, TAU);
    ctx.stroke();

    ctx.strokeStyle = "#6e511e";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, outerRadius - 18, 0, TAU);
    ctx.stroke();

    for (let index = 0; index < WHEEL_SEQUENCE.length; index += 1) {
      const number = WHEEL_SEQUENCE[index];
      const start = roulette.wheelRotation + index * segment - Math.PI / 2;
      const end = start + segment;
      const color = getNumberColor(number);

      ctx.beginPath();
      ctx.arc(0, 0, pocketOuter, start, end);
      ctx.arc(0, 0, pocketInner, end, start, true);
      ctx.closePath();
      ctx.fillStyle = color === "green" ? "#168450" : color === "red" ? "#b92e39" : "#171d1b";
      ctx.fill();
      ctx.strokeStyle = "rgba(238, 205, 126, 0.72)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const textAngle = start + segment / 2;
      const textRadius = (pocketOuter + pocketInner) / 2;
      ctx.save();
      ctx.rotate(textAngle);
      ctx.translate(textRadius, 0);
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = "#ffffff";
      ctx.font = "800 15px Inter, Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0,0,0,0.45)";
      ctx.shadowBlur = 2;
      ctx.fillText(String(number), 0, 0);
      ctx.restore();
    }

    ctx.fillStyle = "#0e5f3b";
    ctx.beginPath();
    ctx.arc(0, 0, pocketInner - 2, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#d9b75f";
    ctx.lineWidth = 6;
    ctx.stroke();

    const innerGradient = ctx.createRadialGradient(-24, -30, 10, 0, 0, centerRadius);
    innerGradient.addColorStop(0, "#f4da8c");
    innerGradient.addColorStop(0.25, "#ba872c");
    innerGradient.addColorStop(0.58, "#604316");
    innerGradient.addColorStop(1, "#251a09");
    ctx.fillStyle = innerGradient;
    ctx.beginPath();
    ctx.arc(0, 0, centerRadius, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#e5c36b";
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.beginPath();
    ctx.arc(-centerRadius * 0.23, -centerRadius * 0.25, centerRadius * 0.42, 0, TAU);
    ctx.fill();

    const shadowGradient = ctx.createRadialGradient(0, 0, outerRadius * 0.55, 0, 0, outerRadius * 1.03);
    shadowGradient.addColorStop(0, "rgba(0,0,0,0)");
    shadowGradient.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = shadowGradient;
    ctx.beginPath();
    ctx.arc(0, 0, outerRadius, 0, TAU);
    ctx.fill();

    if (roulette.showBall) {
      const ballOrbit = outerRadius * roulette.ballRadiusFactor;
      const ballX = Math.cos(roulette.ballAngle) * ballOrbit;
      const ballY = Math.sin(roulette.ballAngle) * ballOrbit;
      const ballRadius = outerRadius * 0.033;
      const ballGradient = ctx.createRadialGradient(ballX - ballRadius * 0.35, ballY - ballRadius * 0.4, 1, ballX, ballY, ballRadius);
      ballGradient.addColorStop(0, "#ffffff");
      ballGradient.addColorStop(0.65, "#ddd9cd");
      ballGradient.addColorStop(1, "#7f7c73");
      ctx.shadowColor = "rgba(0,0,0,0.65)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = ballGradient;
      ctx.beginPath();
      ctx.arc(ballX, ballY, ballRadius, 0, TAU);
      ctx.fill();
      ctx.shadowColor = "transparent";
    }
    ctx.restore();
  }

  /* Blackjack */
  function createShoe(deckCount = 4) {
    const deck = [];
    for (let deckIndex = 0; deckIndex < deckCount; deckIndex += 1) {
      SUITS.forEach((suit) => {
        RANKS.forEach((rank) => {
          deck.push({ rank, suit: suit.symbol, color: suit.color, suitName: suit.name });
        });
      });
    }
    for (let index = deck.length - 1; index > 0; index -= 1) {
      const swapIndex = secureRandomInt(index + 1);
      [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
    }
    return deck;
  }

  function drawBlackjackCard() {
    const blackjack = state.blackjack;
    if (blackjack.deck.length < 20) blackjack.deck = createShoe();
    return blackjack.deck.pop();
  }

  function cardPointValue(card) {
    if (!card) return 0;
    if (card.rank === "A") return 11;
    if (["K", "Q", "J"].includes(card.rank)) return 10;
    return Number(card.rank);
  }

  function handValue(hand) {
    let value = hand.reduce((sum, card) => sum + cardPointValue(card), 0);
    let aces = hand.filter((card) => card.rank === "A").length;
    while (value > 21 && aces > 0) {
      value -= 10;
      aces -= 1;
    }
    return value;
  }

  function isNaturalBlackjack(hand) {
    return hand.length === 2 && handValue(hand) === 21;
  }

  function selectBlackjackBet(value) {
    if (state.blackjack.inRound || state.blackjack.busy || ![10, 25, 50, 100, 250].includes(value)) return;
    state.blackjack.selectedBet = value;
    saveState();
    updateBlackjackUI();
  }

  function createCardElement(card, hidden = false) {
    const element = document.createElement("div");
    if (hidden) {
      element.className = "playing-card back";
      element.setAttribute("aria-label", "Hidden dealer card");
      return element;
    }

    element.className = `playing-card${card.color === "red" ? " red-card" : ""}`;
    element.setAttribute("aria-label", `${card.rank} of ${card.suitName || "cards"}`);
    const rank = document.createElement("span");
    rank.textContent = card.rank;
    const suit = document.createElement("span");
    suit.className = "card-suit";
    suit.textContent = card.suit;
    element.append(rank, suit);
    return element;
  }

  function renderBlackjackHands() {
    const blackjack = state.blackjack;
    els.playerCards.replaceChildren();
    els.dealerCards.replaceChildren();

    blackjack.player.forEach((card) => els.playerCards.appendChild(createCardElement(card)));
    blackjack.dealer.forEach((card, index) => {
      const hidden = blackjack.inRound && !blackjack.dealerRevealed && index === 1;
      els.dealerCards.appendChild(createCardElement(card, hidden));
    });

    els.playerScore.textContent = blackjack.player.length ? formatCredits(handValue(blackjack.player)) : "—";
    if (!blackjack.dealer.length) {
      els.dealerScore.textContent = "—";
    } else if (blackjack.inRound && !blackjack.dealerRevealed) {
      els.dealerScore.textContent = `${handValue([blackjack.dealer[0]])} + ?`;
    } else {
      els.dealerScore.textContent = formatCredits(handValue(blackjack.dealer));
    }
  }

  function settleBlackjack(outcome, message) {
    const blackjack = state.blackjack;
    let payout = 0;
    if (outcome === "blackjack") payout = blackjack.wager * 2.5;
    if (outcome === "win") payout = blackjack.wager * 2;
    if (outcome === "push") payout = blackjack.wager;

    state.balance += payout;
    blackjack.lastPayout = payout;
    blackjack.inRound = false;
    blackjack.busy = false;
    blackjack.dealerRevealed = true;
    blackjack.resultLabel = outcome === "blackjack" ? "Blackjack" : outcome === "win" ? "Player wins" : outcome === "push" ? "Push" : "Dealer wins";
    blackjack.resultText = message;
    blackjack.resultTone = outcome === "blackjack" || outcome === "win" ? "win" : outcome === "push" ? "push" : "loss";
    blackjack.wager = 0;
    saveState();
    updateAllUI();
  }

  function resolveBlackjackNaturals() {
    const blackjack = state.blackjack;
    const playerNatural = isNaturalBlackjack(blackjack.player);
    const dealerNatural = isNaturalBlackjack(blackjack.dealer);
    if (!playerNatural && !dealerNatural) return false;

    blackjack.dealerRevealed = true;
    if (playerNatural && dealerNatural) {
      settleBlackjack("push", "Both hands have blackjack. Your wager was returned.");
    } else if (playerNatural) {
      const payout = blackjack.wager * 2.5;
      settleBlackjack("blackjack", `Natural 21 — payout ${formatCredits(payout)} credits.`);
    } else {
      settleBlackjack("loss", "The dealer has blackjack.");
    }
    return true;
  }

  function dealBlackjack() {
    const blackjack = state.blackjack;
    if (blackjack.inRound || blackjack.busy) return;
    const wager = blackjack.selectedBet;
    if (wager > state.balance) {
      showInsufficientCredits(wager);
      return;
    }

    state.balance -= wager;
    blackjack.wager = wager;
    blackjack.player = [];
    blackjack.dealer = [];
    if (blackjack.deck.length < 52) blackjack.deck = createShoe();
    blackjack.player.push(drawBlackjackCard());
    blackjack.dealer.push(drawBlackjackCard());
    blackjack.player.push(drawBlackjackCard());
    blackjack.dealer.push(drawBlackjackCard());
    blackjack.inRound = true;
    blackjack.busy = false;
    blackjack.dealerRevealed = false;
    blackjack.resultLabel = "Your move";
    blackjack.resultText = "Hit, stand, or double down.";
    blackjack.resultTone = "";
    saveState();
    updateAllUI();
    resolveBlackjackNaturals();
  }

  async function dealerTurn() {
    const blackjack = state.blackjack;
    if (!blackjack.inRound) return;
    blackjack.busy = true;
    blackjack.dealerRevealed = true;
    blackjack.resultLabel = "Dealer's turn";
    blackjack.resultText = "The dealer is drawing…";
    blackjack.resultTone = "";
    saveState();
    updateAllUI();
    await wait(window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 30 : 330);

    while (handValue(blackjack.dealer) < 17) {
      blackjack.dealer.push(drawBlackjackCard());
      saveState();
      updateAllUI();
      await wait(window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 30 : 390);
    }

    const playerValue = handValue(blackjack.player);
    const dealerValue = handValue(blackjack.dealer);
    if (dealerValue > 21) {
      settleBlackjack("win", `Dealer busts with ${dealerValue}. Payout ${formatCredits(blackjack.wager * 2)} credits.`);
    } else if (playerValue > dealerValue) {
      settleBlackjack("win", `${playerValue} beats the dealer's ${dealerValue}. Payout ${formatCredits(blackjack.wager * 2)} credits.`);
    } else if (playerValue === dealerValue) {
      settleBlackjack("push", `Both hands have ${playerValue}. Your wager was returned.`);
    } else {
      settleBlackjack("loss", `Dealer ${dealerValue} beats your ${playerValue}.`);
    }
  }

  async function hitBlackjack() {
    const blackjack = state.blackjack;
    if (!blackjack.inRound || blackjack.busy) return;
    blackjack.player.push(drawBlackjackCard());
    const value = handValue(blackjack.player);
    saveState();
    updateAllUI();

    if (value > 21) {
      settleBlackjack("loss", `Bust with ${value}.`);
    } else if (value === 21) {
      blackjack.busy = true;
      blackjack.resultLabel = "Twenty-one";
      blackjack.resultText = "The dealer will play the hand.";
      updateAllUI();
      await wait(window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 30 : 280);
      await dealerTurn();
    }
  }

  async function doubleBlackjack() {
    const blackjack = state.blackjack;
    if (!blackjack.inRound || blackjack.busy || blackjack.player.length !== 2) return;
    const additionalWager = blackjack.wager;
    if (additionalWager > state.balance) {
      showInsufficientCredits(additionalWager);
      return;
    }

    state.balance -= additionalWager;
    blackjack.wager += additionalWager;
    blackjack.busy = true;
    blackjack.player.push(drawBlackjackCard());
    saveState();
    updateAllUI();
    await wait(window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 30 : 300);

    const value = handValue(blackjack.player);
    if (value > 21) {
      settleBlackjack("loss", `Double-down bust with ${value}.`);
    } else {
      await dealerTurn();
    }
  }

  function updateBlackjackUI() {
    const blackjack = state.blackjack;
    els.blackjackBets.querySelectorAll("[data-blackjack-bet]").forEach((button) => {
      const selected = Number(button.dataset.blackjackBet) === blackjack.selectedBet;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-checked", String(selected));
      button.disabled = blackjack.inRound || blackjack.busy;
    });

    els.blackjackDeal.disabled = blackjack.inRound || blackjack.busy || blackjack.selectedBet > state.balance;
    els.blackjackDeal.querySelector("span").textContent = blackjack.inRound ? `Wager ${formatCredits(blackjack.wager)}` : "Deal cards";
    els.blackjackDeal.querySelector("small").textContent = blackjack.inRound
      ? "Hand in progress"
      : `Wager ${formatCredits(blackjack.selectedBet)} credits`;
    els.blackjackHit.disabled = !blackjack.inRound || blackjack.busy;
    els.blackjackStand.disabled = !blackjack.inRound || blackjack.busy;
    els.blackjackDouble.disabled = !blackjack.inRound || blackjack.busy || blackjack.player.length !== 2 || blackjack.wager > state.balance;
    els.blackjackLastPayout.textContent = formatCredits(blackjack.lastPayout);

    els.blackjackResult.classList.remove("win", "loss", "push");
    if (blackjack.resultTone) els.blackjackResult.classList.add(blackjack.resultTone);
    els.blackjackResult.querySelector("span").textContent = blackjack.resultLabel;
    els.blackjackResult.querySelector("strong").textContent = blackjack.resultText;
    renderBlackjackHands();
  }

  function updateAllUI() {
    updateBalanceDisplays();
    updateSlotsUI();
    updateRouletteUI();
    updateBlackjackUI();
  }

  function resetCasino() {
    if (state.slots.spinning || state.roulette.spinning || state.blackjack.busy) {
      showToast("Finish the current animation before resetting.");
      return;
    }
    const confirmed = window.confirm("Reset all games, history, active wagers, and the balance to 1,000 credits?");
    if (!confirmed) return;

    state.balance = STARTING_BALANCE;
    state.slots = defaultSlotsState();
    state.roulette = defaultRouletteState();
    state.blackjack = defaultBlackjackState();
    localStorage.removeItem(OLD_ROULETTE_KEY);
    saveState();
    updateAllUI();
    drawRouletteWheel();
    showView("menu");
    showToast("Arcade reset to 1,000 credits.");
  }

  function bindEvents() {
    els.allViewButtons.forEach((button) => {
      button.addEventListener("click", () => showView(button.dataset.viewTarget));
    });

    window.addEventListener("hashchange", () => {
      const view = window.location.hash.replace(/^#/, "");
      showView(VALID_VIEWS.has(view) ? view : "menu", false);
    });

    els.resetCasino.addEventListener("click", resetCasino);

    els.slotBets.addEventListener("click", (event) => {
      const button = event.target.closest("[data-slot-bet]");
      if (button) selectSlotBet(Number(button.dataset.slotBet));
    });
    els.slotLines.addEventListener("click", (event) => {
      const button = event.target.closest("[data-slot-lines]");
      if (button) selectSlotLines(Number(button.dataset.slotLines));
    });

    let leverDrag = null;
    let suppressLeverClick = false;
    const resetLeverPosition = () => {
      els.slotLever.classList.remove("dragging");
      els.slotLever.style.removeProperty("--lever-pull");
    };

    els.slotLever.addEventListener("pointerdown", (event) => {
      if (els.slotLever.disabled || state.slots.spinning) return;
      leverDrag = { pointerId: event.pointerId, startY: event.clientY, progress: 0 };
      suppressLeverClick = false;
      els.slotLever.classList.add("dragging");
      els.slotLever.setPointerCapture(event.pointerId);
      event.preventDefault();
    });

    els.slotLever.addEventListener("pointermove", (event) => {
      if (!leverDrag || leverDrag.pointerId !== event.pointerId) return;
      const distance = Math.max(0, Math.min(104, event.clientY - leverDrag.startY));
      leverDrag.progress = distance / 104;
      if (distance > 5) suppressLeverClick = true;
      els.slotLever.style.setProperty("--lever-pull", `${distance}px`);
    });

    const finishLeverDrag = (event) => {
      if (!leverDrag || leverDrag.pointerId !== event.pointerId) return;
      const shouldSpin = leverDrag.progress >= 0.55;
      try {
        els.slotLever.releasePointerCapture(event.pointerId);
      } catch (error) {
        // Pointer capture may already have been released by the browser.
      }
      leverDrag = null;
      resetLeverPosition();
      if (shouldSpin) {
        suppressLeverClick = true;
        window.setTimeout(() => { suppressLeverClick = false; }, 350);
        spinSlots({ leverAlreadyPulled: true });
      } else if (suppressLeverClick) {
        window.setTimeout(() => { suppressLeverClick = false; }, 350);
      }
    };
    els.slotLever.addEventListener("pointerup", finishLeverDrag);
    els.slotLever.addEventListener("pointercancel", finishLeverDrag);
    els.slotLever.addEventListener("click", (event) => {
      if (suppressLeverClick) {
        suppressLeverClick = false;
        event.preventDefault();
        return;
      }
      spinSlots();
    });

    els.rouletteTable.addEventListener("click", (event) => {
      const button = event.target.closest("[data-bet-type]");
      if (!button || button.disabled) return;
      addRouletteBet(button.dataset.betType, button.dataset.betValue);
    });
    els.rouletteChips.addEventListener("click", (event) => {
      const button = event.target.closest(".chip");
      if (button && !button.disabled) selectRouletteChip(Number(button.dataset.chip));
    });
    els.rouletteSpin.addEventListener("click", spinRoulette);
    els.rouletteClear.addEventListener("click", () => clearRouletteBets(true));
    els.rouletteUndo.addEventListener("click", undoRouletteBet);
    els.rouletteRepeat.addEventListener("click", repeatRouletteBets);

    els.blackjackBets.addEventListener("click", (event) => {
      const button = event.target.closest("[data-blackjack-bet]");
      if (button) selectBlackjackBet(Number(button.dataset.blackjackBet));
    });
    els.blackjackDeal.addEventListener("click", dealBlackjack);
    els.blackjackHit.addEventListener("click", hitBlackjack);
    els.blackjackStand.addEventListener("click", dealerTurn);
    els.blackjackDouble.addEventListener("click", doubleBlackjack);

    window.addEventListener("keydown", (event) => {
      const activeTag = document.activeElement?.tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(activeTag)) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z" && state.currentView === "roulette") {
        event.preventDefault();
        undoRouletteBet();
        return;
      }
      if (event.code === "Space" && activeTag !== "BUTTON") {
        event.preventDefault();
        if (state.currentView === "slots") spinSlots();
        if (state.currentView === "roulette") spinRoulette();
        if (state.currentView === "blackjack" && !state.blackjack.inRound) dealBlackjack();
      }
      if (state.currentView === "blackjack" && state.blackjack.inRound && !state.blackjack.busy) {
        if (event.key.toLowerCase() === "h") hitBlackjack();
        if (event.key.toLowerCase() === "s") dealerTurn();
      }
    });
  }

  buildRouletteNumberGrid();
  loadState();
  bindEvents();
  recoverPendingRouletteSpin();
  updateAllUI();
  drawRouletteWheel();
  const initialView = window.location.hash.replace(/^#/, "");
  showView(VALID_VIEWS.has(initialView) ? initialView : "menu", false);
  saveState();
})();
