# Casino Arcade

A responsive, dependency-free browser arcade with a menu for three virtual-credit games:

- **Slots** — five reels by three rows, 1/3/5/10 selectable paylines, a draggable pull lever, staggered reel animation, dynamic payout coefficients, and recent-spin history.
- **European Roulette** — animated single-zero wheel; straight, color, parity, range, dozen, and column bets.
- **Blackjack** — hit, stand, and double-down actions; dealer stands on all 17; blackjack pays 3:2.

All three games use one shared virtual-credit balance. Balance, history, active roulette wagers, and active blackjack hands are stored in `localStorage`.

## Slot payout model

The slot wager selector sets the **total wager per spin**. That amount is divided evenly across the selected number of active paylines. The paytable automatically converts each line multiplier into a coefficient against the total wager:

- 1 active line uses the full wager on that line.
- 3 active lines use one third of the wager per line.
- 5 active lines use one fifth per line.
- 10 active lines use one tenth per line.

Matches are counted from the leftmost reel. Two through five matching symbols can pay, and payouts from multiple winning lines are added together.

## Files

- `index.html` — page structure and game menu.
- `styles.css` — responsive styling, reel animation, payline overlay, and lever design.
- `app.js` — game logic, navigation, balance management, persistence, paylines, payouts, and animations.
- `standalone.html` — the same project with CSS and JavaScript embedded in one file.

## Deployment

For a normal website project, upload `index.html`, `styles.css`, and `app.js` to the same directory and link to `index.html`.

For the simplest deployment, upload only `standalone.html`. It has no external dependencies or assets.

## Common customizations

- Change `STARTING_BALANCE` near the top of `app.js`.
- Edit `SLOT_PAYLINES` to change line shapes.
- Edit `SLOT_PAYOUTS`, `SLOT_SYMBOLS`, and `SLOT_WEIGHTED_KEYS` to change slot payouts and symbol frequency.
- Adjust blackjack wager buttons in both `index.html` and the accepted values in `app.js`.
- Modify the color palette in the `:root` variables at the top of `styles.css`.

## Integration notes

The application uses URL hashes (`#menu`, `#slots`, `#roulette`, and `#blackjack`) for navigation. It can therefore be linked directly to a game, for example `index.html#slots`.

The app keeps the previous storage key so existing balances can be retained. Earlier three-reel slot history is ignored because it is incompatible with the new 3×5 grid; interrupted wagers are still returned safely.

## Important limitation

This is a client-side virtual-credit implementation intended for entertainment. Users can inspect or modify browser code and storage. Do not use the client-side balance, random results, or payouts for cash, purchasable credits, prizes, rankings with value, withdrawals, or other real-world benefits. Those uses require authenticated accounts, server-authoritative balances, server-side game results, audit logging, and applicable legal review.
