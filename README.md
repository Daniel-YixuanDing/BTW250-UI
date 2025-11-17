# Illini Union Bowling Reservation Prototype


## What this does
- Simple login (mock) and token-based session
- Browse available lanes (14 lanes modeled) and time slots
- Reserve a lane for 30-min / 1-hr increments
- Check your reservation status and cancel
- In-memory server (for prototype/demo)

## Run locally


1. Install dependencies for server and client:


```bash
# from project root
cd server && npm install
cd ../client && npm install
```


2. Start server and client in separate terminals:


```bash
# terminal 1
cd server && npm run dev


# terminal 2
cd client && npm run dev
```


Server runs on http://localhost:4000
Client runs on http://localhost:5173