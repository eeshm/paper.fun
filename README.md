## Folder Structure 
```
  apps/
  api/
  ws/
  web/
  workers/price-ingestion/

packages/
  config/
  db/
  redis/
  auth/
  pricing/
  trading/
  events/
  utils/

```


“apps/api is responsible for HTTP request handling only.
It does not own business logic or infrastructure details.”

“All database access lives in packages/db.
Apps consume DB functionality through exported functions only.”

“Redis is infrastructure. Infrastructure is centralized.”


"Before touching tables or code, define these rules:
Wallet address is the unique user identity
One wallet = one user
Users are created lazily (on first login)
Authentication = signature verification
Authorization = session validation
These rules will guide every future decision."



Truth before trading logic
(these must always hold:)
- A user can never spend more than their balance
- Every trade is auditable
- Balances must be derivable from history (at least logically)
- Orders are intent, trades are execution
- Postgres is the source of truth
- Redis is never authoritative
If a schema violates these → it’s wrong.



// After Pyth netwrok setup 

- [ ] Add support for more tokens (ETH, BTC)
- [ ] Implement Postgres fallback for price history
- [ ] Add WebSocket real-time price streaming
- [ ] Set up monitoring/alerting for worker health
- [ ] Cache price feed IDs in Redis for faster startup



// implement fees slider and based of that calculate the total amount to be paid
// remove the hardcode fees from 0.1%\




v1 (Live)
- Fixed 0.1% fee simulation
- Spot SOL trading
- Leaderboards & tutorials
- Wallet-based identity

v2

- Jupiter-powered routing
- Dynamic fees & slippage
- Multi-hop swaps
- Trade replay & analysis

v3 (Future)
- Perps simulation
- NFT paper trading
- Copy trading & bot testing
- This is a clean, fundable roadmap.



## Names
SolPlay 
SolQuest 
PreFlight 
Slipstream 
SolLab 
DryRun 
SolArena 