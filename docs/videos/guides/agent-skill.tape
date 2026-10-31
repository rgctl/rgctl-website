# Agent pack — CoolStore CLI demo
#
# Record: ./docs/videos/scripts/record-guide.sh agent-skill
# Burn:   ./docs/videos/scripts/burn-guide-captions.sh agent-skill
# Regen:  node docs/videos/scripts/gen-guide-tapes.mjs agent-skill

Output "docs/videos/guides/agent-skill-no-captions.gif"
Output "docs/videos/guides/agent-skill-no-captions.mp4"

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

# 1. Supported AI coding agents
Type "# 1. Supported AI coding agents"
Enter
Type "rgctl -f json install --list-agents | jq '.agents[:5] | map({id, skills_path})'"
Enter
Sleep 2s

Hide
Type "clear"
Enter
Show

# 2. Install the Cursor skill pack into CoolStore
Type "# 2. Install the Cursor skill pack into CoolStore"
Enter
Type "rgctl -f json install --skill --tools cursor --force | jq '{schema_version, scope, writes: [.writes[] | {agent, kind, status}]}'"
Enter
Sleep 3s

Hide
Type "clear"
Enter
Show

# 3. Agent loop — blast-radius via the skill
Type "# 3. Agent loop — blast-radius via the skill"
Enter
Type "rgctl -f json blast-radius priceShoppingCart | jq '{target: .target.symbol, metrics}'"
Enter
Sleep 2.5s
