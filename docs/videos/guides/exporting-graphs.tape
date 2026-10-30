# Exporting graphs — CoolStore CLI demo
#
# Record: ./docs/videos/scripts/record-guide.sh exporting-graphs
# Burn:   ./docs/videos/scripts/burn-guide-captions.sh exporting-graphs
# Regen:  node docs/videos/scripts/gen-guide-tapes.mjs exporting-graphs

Output "docs/videos/guides/exporting-graphs-no-captions.gif"
Output "docs/videos/guides/exporting-graphs-no-captions.mp4"

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

# 1. Export a Mermaid slice for ShoppingCartService
Type "# 1. Export a Mermaid slice for ShoppingCartService"
Enter
Type "rgctl export --export-format mermaid --export-output /tmp/coolstore-cart.mmd --query 'name:ShoppingCartService'"
Enter
Type "wc -l /tmp/coolstore-cart.mmd && head -12 /tmp/coolstore-cart.mmd"
Enter
Sleep 3s

Hide
Type "clear"
Enter
Show

# 2. GraphML for Function nodes
Type "# 2. GraphML for Function nodes"
Enter
Type "rgctl export --export-format graphml --export-output /tmp/coolstore-fns.graphml --query 'type:Function'"
Enter
Type "wc -c /tmp/coolstore-fns.graphml"
Enter
Sleep 2.5s
