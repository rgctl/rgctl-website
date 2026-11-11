# Lossless write-back and migration — CLI demo
#
# Record: ./docs/videos/scripts/record-guide.sh lossless-writeback-migration
# Burn:   ./docs/videos/scripts/burn-guide-captions.sh lossless-writeback-migration
# Regen:  node docs/videos/scripts/gen-guide-tapes.mjs lossless-writeback-migration

Output "docs/videos/guides/lossless-writeback-migration-no-captions.gif"
Output "docs/videos/guides/lossless-writeback-migration-no-captions.mp4"

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
Type "cd docs/videos/.work/coolstore-migrate"
Enter
Sleep 300ms
Type "export PS1='\[\e[1;36m\]coolstore\[\e[0m\] \[\e[1;32m\]❯\[\e[0m\] '"
Enter
Sleep 100ms
Type "clear"
Enter
Show

# 1. Index CoolStore with lossless Red-Green CST/content sidecars + javax.* census
Type "# 1. Index CoolStore with lossless Red-Green CST/content sidecars + javax.* census"
Enter
Type "rgctl -f json discover . -l java --lossless | jq '{command, metrics}'"
Enter
Type "rgctl -f json inventory --by import-prefix --prefix javax. | jq '.counts[:6]'"
Enter
Sleep 2.5s

Hide
Type "clear"
Enter
Show

# 2. Census Java EE stereotypes with raw attributes (--show-attributes)
Type "# 2. Census Java EE stereotypes with raw attributes (--show-attributes)"
Enter
Type "rgctl -f json find --annotation Stateless,Singleton,Stateful,MessageDriven --show-attributes | jq '.entities[:5] | map({name, type, attributes})'"
Enter
Sleep 3s

Hide
Type "clear"
Enter
Show

# 3. Container-level blast radius & callers across ShoppingCartService
Type "# 3. Container-level blast radius & callers across ShoppingCartService"
Enter
Type "rgctl -f json blast-radius ShoppingCartService --depth 2 --summary | jq '{target: .target.symbol, score, distance_buckets}'"
Enter
Type "rgctl -f json callers ShoppingCartService --depth 2 | jq '{total, callers: [.callers[:4][] | {name, type}]}'"
Enter
Sleep 3s

Hide
Type "clear"
Enter
Show

# 4. Verify lossless BLAKE3/CST sidecars & preview token-aware rename patch
Type "# 4. Verify lossless BLAKE3/CST sidecars & preview token-aware rename patch"
Enter
Type "rgctl -f json writeback verify | jq '{files_processed, files_verified_identical}'"
Enter
Type "rgctl -f json writeback patch --rename ShoppingCartOrderProcessor=CartOrderProcessor --dry-run | jq '{files_processed, edits_applied, entries: [.entries[] | {file, status}]}'"
Enter
Sleep 3.5s
