To install dependencies:

```sh
bun install
```

To run (host, not Docker):

```sh
bun run dev
```

Then open `http://127.0.0.1:3060` (or the port in `BACKEND_PORT`).

`BACKEND_IP=0.0.0.0` is the bind address inside Docker so the process listens on all interfaces; it is not the hostname clients use.

## Docker Compose and Caddy

From the repo root, `docker compose up` starts Caddy, the API, and Redis. Use **`https://localhost`** for `/login` and `/api/*`. Caddy uses `tls internal` (self-signed); trust the local CA from the `caddy-data` volume or accept the browser warning once. Compose sets `REDIS_URL=redis://redis:6379` for the backend container. Postgres URLs still target wherever your databases run (host IP, `host.docker.internal`, or a `postgres` service if you add one).

## db migrations

set env for database to target
export DATABASE_URL="postgresql://<user>:<pass>@<host>:5432/<tenant_db>"

then run your prisma commands
bunx prisma migrate dev --schema=prisma/[registry or tenant]/schema.prisma
