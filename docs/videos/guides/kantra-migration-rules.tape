# Kantra migration rules — CLI demo
#
# Record: ./docs/videos/scripts/record-guide.sh kantra-migration-rules
# Burn:   ./docs/videos/scripts/burn-guide-captions.sh kantra-migration-rules
# Regen:  node docs/videos/scripts/gen-guide-tapes.mjs kantra-migration-rules

Output "docs/videos/guides/kantra-migration-rules-no-captions.gif"
Output "docs/videos/guides/kantra-migration-rules-no-captions.mp4"

Require rgctl
Require jq

Set Shell "bash"
Set FontSize 15
Set FontFamily "Menlo, Monaco, Consolas, monospace"
Set Width 1400
Set Height 800
Set Padding 16
Set Margin 20
Set MarginFill "#0d1117"
Set WindowBar Colorful
Set WindowBarSize 40
Set BorderRadius 8
Set Theme "Catppuccin Mocha"
Set TypingSpeed 18ms
Set Framerate 30
Set PlaybackSpeed 1.0
Set CursorBlink true

Hide
Type "cd docs/videos/.work/metasfresh"
Enter
Sleep 300ms
Type "export PS1='\[\e[1;36m\]metasfresh-4.9.8b\[\e[0m\] \[\e[1;32m\]❯\[\e[0m\] '"
Enter
Sleep 100ms
Type "clear"
Enter
Show

# 1. Large Java corpus (old metasfresh snapshot — scale test, not a product scorecard)
Type "# 1. Large Java corpus (old metasfresh snapshot — scale test, not a product scorecard)"
Enter
Type "rgctl -f json status | jq '{status, nodes, edges, kantra_findings, schema_version}'"
Enter
Type `rgctl -f json inventory --by type | jq '[.counts[] | select(.key=="file" or .key=="function" or .key=="class")]'`
Enter
Sleep 3s

Hide
Type "clear"
Enter
Show

# 2. Catalog targets with hit counts (one embedded rules run already on disk)
Type "# 2. Catalog targets with hit counts (one embedded rules run already on disk)"
Enter
Type `rgctl -f json rules targets | jq '{findings_present, catalog_id, targets: [.targets[] | select(.name=="quarkus" or .name=="eap8" or .name=="openjdk17+" or .name=="cloud-readiness") | {name, rules, hits}]}'`
Enter
Sleep 3s

Hide
Type "clear"
Enter
Show

# 3. Token-compact findings for quarkus (summary before --limit sample)
Type "# 3. Token-compact findings for quarkus (summary before --limit sample)"
Enter
Type `rgctl -f json rules findings --target quarkus --limit 2 | jq '{total_matched, summary, rules: [.per_rule[].rule_id], sample: [.violations[] | {rule_id, file: (.file|split("/")[-1]), line}]}'`
Enter
Sleep 3s

Hide
Type "clear"
Enter
Show

# 4. Mandatory openjdk17+ hits (illustrative on this ancient tree)
Type "# 4. Mandatory openjdk17+ hits (illustrative on this ancient tree)"
Enter
Type "rgctl -f json rules findings --target openjdk17+ --category mandatory --limit 2 | jq '{total_matched, summary, per_rule: [.per_rule[] | {rule_id, category, effort, targets}]}'"
Enter
Sleep 3s
