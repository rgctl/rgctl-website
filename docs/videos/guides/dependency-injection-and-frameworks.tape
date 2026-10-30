# DI and frameworks — CoolStore CLI demo
#
# Record: ./docs/videos/scripts/record-guide.sh dependency-injection-and-frameworks
# Burn:   ./docs/videos/scripts/burn-guide-captions.sh dependency-injection-and-frameworks
# Regen:  node docs/videos/scripts/gen-guide-tapes.mjs dependency-injection-and-frameworks

Output "docs/videos/guides/dependency-injection-and-frameworks-no-captions.gif"
Output "docs/videos/guides/dependency-injection-and-frameworks-no-captions.mp4"

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

# 1. Route + DI edge inventory
Type "# 1. Route + DI edge inventory"
Enter
Type `rgctl -f json inventory --by edge | jq '.counts[] | select(.key=="exposesroute" or .key=="injects")'`
Enter
Sleep 2s

Hide
Type "clear"
Enter
Show

# 2. JAX-RS routes and Injects wiring
Type "# 2. JAX-RS routes and Injects wiring"
Enter
Type "rgctl -f json relations --edge exposesroute --limit 5 | jq '.edges[:3]'"
Enter
Type "rgctl -f json relations CartEndpoint --edge injects --direction out | jq '.edges'"
Enter
Sleep 3s

Hide
Type "clear"
Enter
Show

# 3. Natural-language endpoint search
Type "# 3. Natural-language endpoint search"
Enter
Type "rgctl -f json semantic query 'hey give me all my end points' --limit 3 | jq '.hits[:3] | map({name, qualified_name, score})'"
Enter
Sleep 2.5s
