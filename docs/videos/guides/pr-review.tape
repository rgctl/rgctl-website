# Pull request review — CoolStore CLI demo
#
# Record: ./docs/videos/scripts/record-guide.sh pr-review
# Burn:   ./docs/videos/scripts/burn-guide-captions.sh pr-review
# Regen:  node docs/videos/scripts/gen-guide-tapes.mjs pr-review

Output "docs/videos/guides/pr-review-no-captions.gif"
Output "docs/videos/guides/pr-review-no-captions.mp4"

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

# 1. Structural PR deltas vs indexed HEAD (worktree synth)
Type "# 1. Structural PR deltas vs indexed HEAD (worktree synth)"
Enter
Type "git status -s"
Enter
Type "rgctl -f json review paths --synthetic-head worktree | jq '{schema_version, command, change_summary}'"
Enter
Sleep 3s

Hide
Type "clear"
Enter
Show

# 2. Inspect symbol-level call-path deltas
Type "# 2. Inspect symbol-level call-path deltas"
Enter
Type `rgctl -f json review paths --synthetic-head worktree | jq '.symbols[] | select(.name=="priceShoppingCart") | {name, kind, deltas: .path_delta[:3]}'`
Enter
Sleep 3s
