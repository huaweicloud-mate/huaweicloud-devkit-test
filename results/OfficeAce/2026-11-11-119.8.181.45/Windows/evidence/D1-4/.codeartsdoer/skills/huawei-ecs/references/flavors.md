# ECS Flavor Selection

**Always discover flavors dynamically before recommending a specific flavor name.** Flavor availability varies by region and changes over time.

## Step 1: List available flavors

Use JMESPath to filter in-line — raw output returns hundreds of records and floods context:

```bash
# Filter by family prefix (e.g. ac7), return name + specs only
hcloud ECS ListFlavors --cli-region=<region> --cli-output=json \
  --cli-query="flavors[?contains(name, 'ac7')].{name:name, vcpus:vcpus, ram:ram}"

# Filter by vCPU range
hcloud ECS ListFlavors --cli-region=<region> --cli-output=json \
  --cli-query="flavors[?vcpus >= '2' && vcpus <= '4'].{name:name, vcpus:vcpus, ram:ram}"
```

> Always use `--cli-query` with JMESPath to narrow results. Never run bare `ListFlavors` without filtering.

## Step 2: Filter by scenario

| Scenario                | Look for                             | Preference             |
| ----------------------- | ------------------------------------ | ---------------------- |
| Web app / microservices | General-purpose families (ac, s, sn) | 2-4 vCPU, 4-8 GB RAM   |
| Database / big data     | Memory-optimized families (m, r)     | 4-8 vCPU, 16-64 GB RAM |
| AI inference / training | GPU families (g, p)                  | 8+ vCPU, 64+ GB RAM    |
| HPC / high throughput   | High-IO families (h, ir, i)          | 8+ vCPU, local SSD     |

## Step 3: Match spec from ListFlavors output

Common naming pattern: `<family><gen>.<type>x<ratio>`

- `ac6.2xlarge.2` = ac6 family, 2xlarge (8 vCPU), ratio 2 (vCPU:RAM = 1:2 → 16 GB)

## Do Not Hardcode

Flavor family names are region-dependent. Example discrepancies seen in testing:

- cn-south-1: ac6/ac7/kc/r-c7e (s6/m6/g6 NOT available)
- Other regions may have s6/m6/g6 families

Always run ListFlavors and pick from actual results.

## Step 3: Filter out abandoned / sold-out specs

`ListFlavors` returns ALL specs including abandoned ones. Before selecting a spec, check the `os_extra_specs` field in the JSON response:

| Field                                  | Values                         | Meaning                                                                              |
| -------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------ |
| `os_extra_specs.cond:operation:status` | `normal`, `abandon`, `sellout` | Only `normal` specs can be created. `abandon` = deprecated, `sellout` = out of stock |
| `os_extra_specs.cond:operation:az`     | e.g. `cn-north-4g(normal)`     | Spec is available in this AZ. Multiple entries = multiple AZ support                 |

A flavor can be `normal` globally but `abandon` in specific AZs. Selecting an `abandon` or `sellout` spec will fail with **`Ecs.0019`** at creation time — there is no pre-flight validation in `ListFlavors`. If creation fails:

1. Switch to a different AZ: `hcloud ECS NovaListAvailabilityZones --cli-region=<region>`
2. Or switch to a different flavor family (e.g., `at7` → `ac7`)

## Conflict rule: `cond:operation:status` vs `cond:operation:az` (#922)

The two fields can contradict each other (实测：`kc2.small.2` with `cond:operation:status=abandon` while
`cond:operation:az=cn-north-4a(normal)`). **The AZ-level field (`cond:operation:az`) WINS for the target AZ**:

| Global `status`     | Target AZ in `cond:operation:az`              | Verdict                                                                                                             |
| ------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `normal`            | `<az>(normal)`                                | Usable in that AZ                                                                                                   |
| `abandon`/`sellout` | `<az>(normal)`                                | **Usable in that AZ** — the AZ-level field wins; do not refuse to order just because the global status says abandon |
| `normal`            | `<az>(sellout)` / `<az>(abandon)` / AZ absent | NOT usable in that AZ — pick another AZ or flavor                                                                   |

Decision procedure:

1. Find the target AZ entry in `cond:operation:az` (e.g. `cn-north-4a(normal)`).
2. If the entry exists for the target AZ, its parenthesized state decides — ignore the global `cond:operation:status`.
3. If the target AZ has no entry, fall back to the global `cond:operation:status` (only `normal` is usable).

Note: flavor availability is only half of the check — an image TYPE mismatch fails independently with
**`Ecs.0707 the product does not exist`** (market-type images fail with KunPeng flavors like `kc2.small.2`;
switch to a gold-type image or a compatible flavor, e.g. `s6.medium.2` + gold). The `huaweicloud_explain_error`
error map covers `Ecs.0707` with the full combination-troubleshooting procedure.
