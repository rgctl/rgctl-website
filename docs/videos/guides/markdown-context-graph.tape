# Markdown context graph — CoolStore CLI demo
#
# Record: ./docs/videos/scripts/record-guide.sh markdown-context-graph
# Burn:   ./docs/videos/scripts/burn-guide-captions.sh markdown-context-graph
# Regen:  node docs/videos/scripts/gen-guide-tapes.mjs markdown-context-graph

Output "docs/videos/guides/markdown-context-graph-no-captions.gif"
Output "docs/videos/guides/markdown-context-graph-no-captions.mp4"

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
Type "cd docs/videos/.work/markdown-context"
Enter
Sleep 300ms
Type "export PS1='\[\e[1;36m\]markdown-context\[\e[0m\] \[\e[1;32m\]❯\[\e[0m\] '"
Enter
Sleep 100ms
Type "clear"
Enter
Show

# 1. Index docs + Java in one graph
Type "# 1. Index docs + Java in one graph"
Enter
Type "rm -rf .rgctl"
Enter
Type "rgctl discover . -l markdown,java"
Enter
Sleep 3.5s

Hide
Type "clear"
Enter
Show

# 2. Checkout-related headings
Type "# 2. Checkout-related headings"
Enter
Type "rgctl -f json find 'Checkout*' --type module --limit 5 | jq '{returned, names: [.entities[].name]}'"
Enter
Sleep 2s

Hide
Type "clear"
Enter
Show

# 3. Traverse Markdown section → Java file reference edges
Type "# 3. Traverse Markdown section → Java file reference edges"
Enter
Type `rgctl -f json relations 'Checkout Flow' --edge references --direction out | jq '.edges | map({source: .source.name, edge, target: (.target.name | split("/")[-1]), type: .target.type})'`
Enter
Sleep 3s
