# Graph metrics — CoolStore CLI demo
#
# Record: ./docs/videos/scripts/record-guide.sh graph-metrics
# Burn:   ./docs/videos/scripts/burn-guide-captions.sh graph-metrics
# Regen:  node docs/videos/scripts/gen-guide-tapes.mjs graph-metrics

Output "docs/videos/guides/graph-metrics-no-captions.gif"
Output "docs/videos/guides/graph-metrics-no-captions.mp4"

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

# 1. Production-aware PageRank hotspots
Type "# 1. Production-aware PageRank hotspots"
Enter
Type "rgctl -f json metrics --pagerank | jq '.pagerank.top[:3] | map({kind, qualified_name, pagerank})'"
Enter
Sleep 2.5s

Hide
Type "clear"
Enter
Show

# 2. Sampled betweenness bridges
Type "# 2. Sampled betweenness bridges"
Enter
Type "rgctl -f json metrics --betweenness | jq '.betweenness.top[:3] | map({kind, qualified_name, betweenness})'"
Enter
Sleep 2.5s

Hide
Type "clear"
Enter
Show

# 3. Community metrics overlay
Type "# 3. Community metrics overlay"
Enter
Type "rgctl -f json metrics --communities | jq '{communities: (.communities|length)}'"
Enter
Sleep 2s
