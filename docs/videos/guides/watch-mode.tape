# Watch mode and incremental update — CoolStore CLI demo
#
# Record: ./docs/videos/scripts/record-guide.sh watch-mode
# Burn:   ./docs/videos/scripts/burn-guide-captions.sh watch-mode
# Regen:  node docs/videos/scripts/gen-guide-tapes.mjs watch-mode

Output "docs/videos/guides/watch-mode-no-captions.gif"
Output "docs/videos/guides/watch-mode-no-captions.mp4"

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

# 1. Detect modified source file (dirty_files: 1)
Type "# 1. Detect modified source file (dirty_files: 1)"
Enter
Type "rgctl -f json status | jq '{status, index_current, dirty_files, files_changed, dirty_sample}'"
Enter
Sleep 2.5s

Hide
Type "clear"
Enter
Show

# 2. One-shot incremental update (no full rediscover)
Type "# 2. One-shot incremental update (no full rediscover)"
Enter
Type "rgctl update --files src/main/java/com/redhat/coolstore/service/ShoppingCartService.java"
Enter
Type "rgctl -f json status | jq '{status, index_current, dirty_files, files_changed}'"
Enter
Sleep 3s
