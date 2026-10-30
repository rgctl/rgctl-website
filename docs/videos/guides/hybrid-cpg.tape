# Hybrid CPG — CoolStore CLI demo
#
# Record: ./docs/videos/scripts/record-guide.sh hybrid-cpg
# Burn:   ./docs/videos/scripts/burn-guide-captions.sh hybrid-cpg
# Regen:  node docs/videos/scripts/gen-guide-tapes.mjs hybrid-cpg

Output "docs/videos/guides/hybrid-cpg-no-captions.gif"
Output "docs/videos/guides/hybrid-cpg-no-captions.mp4"

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

# 1. Hybrid CPG archive status
Type "# 1. Hybrid CPG archive status"
Enter
Type "rgctl -f json cpg status | jq '{schema_version, field_write_count, field_write_index_present}'"
Enter
Sleep 2s

Hide
Type "clear"
Enter
Show

# 2. Call overlay + field mutations on ShoppingCart
Type "# 2. Call overlay + field mutations on ShoppingCart"
Enter
Type "rgctl -f json cpg calls priceShoppingCart | jq '{function_name, edges: (.edges|length), sample: .edges[:2]}'"
Enter
Type "rgctl -f json cpg mutations --type ShoppingCart --exclude-ctors | jq '{mutations: (.mutations|length)}'"
Enter
Sleep 3s

Hide
Type "clear"
Enter
Show

# 3. Data-flow façade (cpg flows)
Type "# 3. Data-flow façade (cpg flows)"
Enter
Type "rgctl -f json cpg flows src/main/java/com/redhat/coolstore/service/ShoppingCartService.java --line 68 --variable sc --direction forward --with-alias | jq '{function, variable, lines, steps: (.steps|length)}'"
Enter
Sleep 3s
