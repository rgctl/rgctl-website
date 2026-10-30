# Semantic search — CoolStore CLI demo
#
# Record: ./docs/videos/scripts/record-guide.sh semantic-search
# Burn:   ./docs/videos/scripts/burn-guide-captions.sh semantic-search
# Regen:  node docs/videos/scripts/gen-guide-tapes.mjs semantic-search

Output "docs/videos/guides/semantic-search-no-captions.gif"
Output "docs/videos/guides/semantic-search-no-captions.mp4"

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

# 1. Offline vocab semantic index (no GPU)
Type "# 1. Offline vocab semantic index (no GPU)"
Enter
Type "rgctl semantic index"
Enter
Sleep 3s

Hide
Type "clear"
Enter
Show

# 2. Natural-language code search
Type "# 2. Natural-language code search"
Enter
Type "rgctl -f json semantic query 'shopping cart checkout' --limit 3 | jq '.hits | map({name, score, file_path})'"
Enter
Sleep 2.5s

Hide
Type "clear"
Enter
Show

# 3. Community-scoped query
Type "# 3. Community-scoped query"
Enter
Type "rgctl -f json semantic query 'checkout' --scope community --limit 3 | jq '.hits | map({name, qualified_name, score})'"
Enter
Sleep 2.5s
