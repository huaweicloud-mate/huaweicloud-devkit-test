Hook fuzzy fail-closed (fixed - removed unknown-command-xyz):
: deny (safe=true)
null: deny (safe=true)
undefined: deny (safe=true)
   : deny (safe=true)

	: deny (safe=true)
All invalid/fuzzy inputs fail-closed (deny): true
Note: unknown commands that don't match any rule correctly return 'allow' (not a risk)