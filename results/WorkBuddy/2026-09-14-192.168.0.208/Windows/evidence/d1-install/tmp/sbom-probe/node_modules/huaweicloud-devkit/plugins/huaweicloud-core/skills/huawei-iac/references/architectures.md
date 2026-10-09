# Architecture Templates by Scale

Templates define the resource mix and dependency topology per user scale. Adapt specs to the target region (always verify with `ListFlavors` / `ListImages`), never copy them blindly.

## Scale Classification

**When the user has not stated their scale** (and signals like "生产环境"/"学习用" are absent), present this table as a choice - the user picks the tier, the template follows:

| Scale          | Signals                                            | Product mix                                                           | Cost signal            |
| -------------- | -------------------------------------------------- | --------------------------------------------------------------------- | ---------------------- |
| Personal       | Side project, low traffic, cost-sensitive          | FunctionGraph (free tier) + OBS static hosting, or single minimal ECS | Tens of CNY/month      |
| Small business | Team product, stable traffic, needs SLA-ish uptime | ECS + RDS (single instance) + EIP, frontend OBS+CDN or same ECS       | Hundreds of CNY/month  |
| Enterprise     | Production, HA, compliance                         | CCE + GaussDB (primary/standby) + WAF + CDN + OBS logs                | Thousands of CNY/month |

## Template: Personal - OBS+CDN frontend / FunctionGraph backend (lightest)

```
OBS public bucket -> CDN acceleration -> DNS CNAME -> user domain
  (Vue/React build output)
FunctionGraph (Node.js/Python)
  (Express/FastAPI backend logic)
```

- FunctionGraph has a free tier; personal projects are often near-free
- Persistent data needs a real database (DDS single node in free tier, or minimal RDS). FG filesystem is ephemeral - SQLite data is lost between invocations

## Template: Personal - ECS+EIP frontend / FunctionGraph backend

```
VPC -> Subnet -> ECS(1C1G) -> EIP
  (Nginx serves static files)
FunctionGraph (backend API)
```

## Template: Small business - OBS+CDN frontend / ECS+RDS backend

```
OBS public bucket -> CDN -> DNS -> user domain

VPC -> Subnet -> SG -> ECS(2C4G) -> EIP
                      └─ RDS (MySQL single instance)
```

## Template: Small business - all on ECS

```
VPC -> Subnet -> SG -> ECS(2C4G) -> EIP
                      ├─ Nginx (frontend static)
                      ├─ Node.js (backend)
                      └─ RDS (MySQL single instance)
```

Fewest resources; no CDN, no HTTPS by default. Good for quick validation or intranet scenarios.

## Template: Enterprise

```
OBS public bucket -> CDN -> WAF -> DNS -> user domain

VPC -> Subnet -> SG
        ├─ CCE (3 nodes) -> ELB -> EIP
        ├─ GaussDB (primary/standby)
        └─ OBS (logs)
```

## Dependency Ordering Rules

Creation must follow topological order; destroy is the exact reverse:

1. Network foundation first: VPC → Subnet → Security Group (+ rules)
2. Compute / database next: ECS, RDS, CCE, FunctionGraph
3. Bindings and exposure last: EIP bind, CDN domain, DNS record set
4. Shared foundations (VPC/Subnet) are referenced by many resources - deleting them first always fails with "resource in use"

## Frontend Hosting Decision Matrix

| Aspect               | OBS+CDN+DNS                             | ECS+EIP                               |
| -------------------- | --------------------------------------- | ------------------------------------- |
| Prerequisite         | Registered + ICP-filed domain           | None (IP access)                      |
| Ops                  | Zero server ops                         | Full server management                |
| Backend on same host | No (static only)                        | Yes (SSR / API / Nginx)               |
| Traffic cost         | Pay per GB, cheap at scale              | Fixed bandwidth billing               |
| Best for             | Static sites, SPAs, docs, landing pages | SSR frontends, all-in-one deployments |
