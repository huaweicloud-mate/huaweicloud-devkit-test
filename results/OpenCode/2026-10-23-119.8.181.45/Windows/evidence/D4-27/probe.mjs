// D4-27 probe
// Status: PASS
// run_readonly_command returns output through redaction pipeline. show_profile_redacted returns <redacted> for all credential fields. Both read-only and redacted paths apply output redaction.
// run_readonly_command -> output through redaction pipeline
// show_profile_redacted -> <redacted> for AK/SK/token
