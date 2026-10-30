# Program slicing — CoolStore CLI demo
#
# Record: ./docs/videos/scripts/record-guide.sh program-slicing
# Burn:   ./docs/videos/scripts/burn-guide-captions.sh program-slicing
# Regen:  node docs/videos/scripts/gen-guide-tapes.mjs program-slicing

Output "docs/videos/guides/program-slicing-no-captions.gif"
Output "docs/videos/guides/program-slicing-no-captions.mp4"

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

# 1. Backward slice — what influences sc?
Type "# 1. Backward slice — what influences sc?"
Enter
Type "rgctl -f json slice src/main/java/com/redhat/coolstore/service/ShoppingCartService.java --line 68 --variable sc --direction backward | jq '{criterion, statements: (.statements|length), files: (.files|length)}'"
Enter
Sleep 3.5s

Hide
Type "clear"
Enter
Show

# 2. Forward slice with alias tracking
Type "# 2. Forward slice with alias tracking"
Enter
Type "rgctl -f json slice src/main/java/com/redhat/coolstore/service/ShoppingCartService.java --line 68 --variable sc --direction forward --with-alias | jq '{direction, statements: (.statements|length)}'"
Enter
Sleep 3s
