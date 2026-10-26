---
layout: ../../layouts/Docs.astro
title: Configuration
description: Server, deployment and database options.
---

# Configuration

Kalendee reads a `ktor.deployment.*` block from `application.conf`. Every value
can also be supplied through an environment variable named after the property in
upper snake case.

## Deployment

The deployment group controls how the server binds and how many requests it
accepts. Defaults are tuned for a single-node self-hosted install.

### Server

| Key | Type | Default | Meaning |
| --- | --- | --- | --- |
| `ktor.deployment.port` | `Int` | `8080` | TCP port the HTTP server binds to. Change this when another process already owns 8080, or when a reverse proxy forwards traffic to a non-default port. |
| `ktor.deployment.host` | `String` | `0.0.0.0` | Interface the server binds to. Use `127.0.0.1` when a local reverse proxy is the only client, so the server is not reachable from the network directly. |
| `ktor.deployment.shutdownGracePeriod` | `Long` | `3000` | Milliseconds to wait for in-flight requests before a graceful shutdown completes. Increase it when large CalDAV exports are common. |
| `ktor.deployment.workers` | `Int` | `4` | Number of request worker threads. Keep it at or below the number of CPU cores available to the container; oversubscribing hurts latency under sync load. |

### Long property names

Configuration keys are not capped, so a very long name can exceed the space a
narrow column would normally take. The table below keeps the prose column
readable and scrolls inside its own box when the key does not fit.

| Key | Note |
| --- | --- |
| `ktor.deployment.veryLongConfigurationPropertyNameWithoutAnySpaces` | A deliberately long key used by the playground to prove the table scrolls inside its own box instead of widening the page. It is not a real Kalendee setting. |

### Database

The database group configures the embedded store. Kalendee ships an embedded
SQLite database for small installs and accepts a PostgreSQL connection string for
larger deployments.

| Key | Type | Default | Meaning |
| --- | --- | --- | --- |
| `ktor.deployment.database.driver` | `String` | `sqlite` | Storage driver. Use `postgres` for multi-node deployments, or keep `sqlite` for a single server with local disk. |
| `ktor.deployment.database.url` | `String` | `jdbc:sqlite:data/kalendee.db` | JDBC URL for the database. Relative paths resolve from the server working directory, so a container must mount a persistent volume at that path. |
| `ktor.deployment.database.maxPoolSize` | `Int` | `10` | Maximum pooled connections. Raise it only when the database itself has headroom; a large pool on a small database increases contention instead of throughput. |
| `ktor.deployment.database.migrateOnStart` | `Boolean` | `true` | Run pending schema migrations at boot. Disable it when migrations are applied by a separate deploy job so several replicas do not race each other. |

### Reverse proxy

Set `trustProxy` when Kalendee runs behind a load balancer, otherwise every
request appears to come from the proxy address and rate limits apply globally.

| Key | Type | Default | Meaning |
| --- | --- | --- | --- |
| `ktor.deployment.trustProxy` | `Boolean` | `false` | Honour `X-Forwarded-For` and `X-Forwarded-Proto` from the immediate peer. Enable it only when the peer is a proxy you control. |
| `ktor.deployment.publicUrl` | `String` | `http://localhost:8080` | Canonical origin used in calendar feeds, invite links and password-reset mail. It must match the URL users actually open. |
| `ktor.deployment.maxRequestSize` | `Long` | `10485760` | Maximum upload size in bytes for `.ics` imports. Large calendar archives need a higher limit and a matching proxy limit. |

## Verifying the result

After changing any value, restart the server and open the health endpoint. The
response reports the effective port, database driver and public URL, which is the
quickest way to confirm that an environment variable override took effect.
