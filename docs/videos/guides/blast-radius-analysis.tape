# Blast radius analysis — CoolStore CLI demo
#
# Record: ./docs/videos/scripts/record-guide.sh blast-radius-analysis
# Burn:   ./docs/videos/scripts/burn-guide-captions.sh blast-radius-analysis
# Regen:  node docs/videos/scripts/gen-guide-tapes.mjs blast-radius-analysis

Output "docs/videos/guides/blast-radius-analysis-no-captions.gif"
Output "docs/videos/guides/blast-radius-analysis-no-captions.mp4"

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

# 1. Upstream blast radius before you edit
Type "# 1. Upstream blast radius before you edit"
Enter
Type "rgctl blast-radius priceShoppingCart"
Enter
Sleep 2.5s

Hide
Type "clear"
Enter
Show

# 2. Machine-readable score + callers
Type "# 2. Machine-readable score + callers"
Enter
Type "rgctl -f json blast-radius priceShoppingCart | jq '{target: .target.symbol, metrics}'"
Enter
Sleep 2.5s

Hide
Type "clear"
Enter
Show

# 3. Depth-limited impact on getShoppingCart
Type "# 3. Depth-limited impact on getShoppingCart"
Enter
Type "rgctl blast-radius getShoppingCart --depth 3"
Enter
Sleep 2.5s
