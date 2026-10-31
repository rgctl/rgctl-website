# Clone detection — CoolStore CLI demo
#
# Record: ./docs/videos/scripts/record-guide.sh clone-detection
# Burn:   ./docs/videos/scripts/burn-guide-captions.sh clone-detection
# Regen:  node docs/videos/scripts/gen-guide-tapes.mjs clone-detection

Output "docs/videos/guides/clone-detection-no-captions.gif"
Output "docs/videos/guides/clone-detection-no-captions.mp4"

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

# 1. Exact (Type-1) whole-function clones
Type "# 1. Exact (Type-1) whole-function clones"
Enter
Type "rgctl -f json clones --mode exact --min-loc 3 --exclude test | jq '{mode, group_count, top_group: (.groups[0].members | map({name, start_line, loc}))}'"
Enter
Sleep 2.5s

Hide
Type "clear"
Enter
Show

# 2. Token-bloom structural similarity
Type "# 2. Token-bloom structural similarity"
Enter
Type "rgctl -f json clones --mode bloom --threshold 0.85 --min-loc 8 --exclude test | jq '{mode, group_count, score: .groups[0].score, members: (.groups[0].members | map({name, start_line, loc}))}'"
Enter
Sleep 3s

Hide
Type "clear"
Enter
Show

# 3. Sub-function SESE/WL fragment clones
Type "# 3. Sub-function SESE/WL fragment clones"
Enter
Type "rgctl -f json clones --mode fragment --min-statements 2 --threshold 0.8 | jq '{mode, group_count, top_hash: .groups[0].structural_hash, members: (.groups[0].members[:3] | map({enclosing_function, start_line, end_line}))}'"
Enter
Sleep 3s
