# Community detection — CoolStore CLI demo
#
# Record: ./docs/videos/scripts/record-guide.sh community-detection
# Burn:   ./docs/videos/scripts/burn-guide-captions.sh community-detection
# Regen:  node docs/videos/scripts/gen-guide-tapes.mjs community-detection

Output "docs/videos/guides/community-detection-no-captions.gif"
Output "docs/videos/guides/community-detection-no-captions.mp4"

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

# 1. Fast-Leiden domain communities (non-singleton clusters)
Type "# 1. Fast-Leiden domain communities (non-singleton clusters)"
Enter
Type "rgctl -f json communities list | jq '{modularity, non_singleton_clusters: ([.communities[] | select(.member_count > 1)] | length), top: (.communities[:4] | map({id, label, member_count}))}'"
Enter
Sleep 3s

Hide
Type "clear"
Enter
Show

# 2. Community partition summary
Type "# 2. Community partition summary"
Enter
Type "rgctl -f json metrics --communities | jq '.communities'"
Enter
Sleep 2.5s
