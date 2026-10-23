// D2-13 probe
// Status: PASS
// R9: auth_status shows s1.configured=true, configuredBySession flag present. When configuredBySession=true, S1 takes priority over env (HW_ACCESS_KEY/HW_SECRET_KEY). Fixture at eval/harness/fixtures/d2-13-s1-env.mjs confirms S1 wins, env falls back after clear.
