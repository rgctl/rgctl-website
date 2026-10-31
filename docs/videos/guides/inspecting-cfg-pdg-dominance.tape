# Inspect CFG / PDG / dominance — CoolStore CLI demo
#
# Record: ./docs/videos/scripts/record-guide.sh inspecting-cfg-pdg-dominance
# Burn:   ./docs/videos/scripts/burn-guide-captions.sh inspecting-cfg-pdg-dominance
# Regen:  node docs/videos/scripts/gen-guide-tapes.mjs inspecting-cfg-pdg-dominance

Output "docs/videos/guides/inspecting-cfg-pdg-dominance-no-captions.gif"
Output "docs/videos/guides/inspecting-cfg-pdg-dominance-no-captions.mp4"

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

# 1. Control-flow blocks for priceShoppingCart
Type "# 1. Control-flow blocks for priceShoppingCart"
Enter
Type "rgctl -f json inspect priceShoppingCart cfg | jq '{symbol, layer, blocks: (.nodes|length), edges: (.edges|length), sample_blocks: (.nodes[1:3] | map({id, start_line, statements}))}'"
Enter
Sleep 3s

Hide
Type "clear"
Enter
Show

# 2. Program dependence graph (data + control edges)
Type "# 2. Program dependence graph (data + control edges)"
Enter
Type "rgctl -f json inspect priceShoppingCart pdg | jq '{layer, nodes: (.nodes|length), edges: (.edges|length), sample_edges: .edges[:3]}'"
Enter
Sleep 3s

Hide
Type "clear"
Enter
Show

# 3. Immediate dominator tree (idom)
Type "# 3. Immediate dominator tree (idom)"
Enter
Type "rgctl -f json inspect priceShoppingCart dom | jq '{symbol, layer, blocks: (.nodes|length), idom_sample: .idom[:4]}'"
Enter
Sleep 3s
