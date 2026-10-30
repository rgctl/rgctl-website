# Structured graph queries — CoolStore CLI demo
#
# Record: ./docs/videos/scripts/record-guide.sh structured-query
# Burn:   ./docs/videos/scripts/burn-guide-captions.sh structured-query
# Regen:  node docs/videos/scripts/gen-guide-tapes.mjs structured-query

Output "docs/videos/guides/structured-query-no-captions.gif"
Output "docs/videos/guides/structured-query-no-captions.mp4"

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

# 1. Session status + function inventory
Type "# 1. Session status + function inventory"
Enter
Type "rgctl -f json status | jq '{status, nodes, edges, schema_version}'"
Enter
Type `rgctl -f json inventory --by type | jq '.counts[] | select(.key=="function")'`
Enter
Sleep 2.5s

Hide
Type "clear"
Enter
Show

# 2. Exact symbol lookup
Type "# 2. Exact symbol lookup"
Enter
Type "rgctl -f json find priceShoppingCart --exact | jq '.entities[0] | {name, type, file, line}'"
Enter
Sleep 2s

Hide
Type "clear"
Enter
Show

# 3. Callers + typed CALLS relations
Type "# 3. Callers + typed CALLS relations"
Enter
Type "rgctl -f json callers priceShoppingCart | jq '.callers[:4] | map({name, file})'"
Enter
Type "rgctl -f json relations priceShoppingCart --edge calls --direction both | jq '{returned: (.edges|length)}'"
Enter
Sleep 3s
