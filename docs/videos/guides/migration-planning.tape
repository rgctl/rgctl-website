# Migration planning — CoolStore CLI demo
#
# Record: ./docs/videos/scripts/record-guide.sh migration-planning
# Burn:   ./docs/videos/scripts/burn-guide-captions.sh migration-planning
# Regen:  node docs/videos/scripts/gen-guide-tapes.mjs migration-planning

Output "docs/videos/guides/migration-planning-no-captions.gif"
Output "docs/videos/guides/migration-planning-no-captions.mp4"

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
Type "cd docs/videos/.work/coolstore"
Enter
Sleep 300ms
Type "export PS1='\[\e[1;36m\]coolstore\[\e[0m\] \[\e[1;32m\]❯\[\e[0m\] '"
Enter
Sleep 100ms
Type "clear"
Enter
Show

# 1. Dependency-aware migration roadmap artifact
Type "# 1. Dependency-aware migration roadmap artifact"
Enter
Type "jq '{schema_version, preset, order_mode, steps: (.steps|length)}' .rgctl/migration_plan.json"
Enter
Sleep 2s

Hide
Type "clear"
Enter
Show

# 2. Domain package extraction steps (strangler-fig order)
Type "# 2. Domain package extraction steps (strangler-fig order)"
Enter
Type `jq '[.steps[] | select(.label != "root")][:4] | map({step, label, schedule_step, priority_rank, avg_pagerank})' .rgctl/migration_plan.json`
Enter
Sleep 3s

Hide
Type "clear"
Enter
Show

# 3. Pair with communities + blast-radius
Type "# 3. Pair with communities + blast-radius"
Enter
Type "rgctl -f json communities list | jq '.communities[:3] | map({id, label, member_count})'"
Enter
Type "rgctl blast-radius getShoppingCart --depth 3"
Enter
Sleep 3s
