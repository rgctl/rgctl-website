# CI policy checks — CoolStore CLI demo
#
# Record: ./docs/videos/scripts/record-guide.sh ci-policy-checks
# Burn:   ./docs/videos/scripts/burn-guide-captions.sh ci-policy-checks
# Regen:  node docs/videos/scripts/gen-guide-tapes.mjs ci-policy-checks

Output "docs/videos/guides/ci-policy-checks-no-captions.gif"
Output "docs/videos/guides/ci-policy-checks-no-captions.mp4"

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

# 1. Local policy gate catches high-impact diff changes
Type "# 1. Local policy gate catches high-impact diff changes"
Enter
Type "rgctl -f json check --policy-file ../rgctl-pr-policy.json | jq '{passed, violations: (.violations|length), sample: .violations[:2]}'"
Enter
Sleep 3s

Hide
Type "clear"
Enter
Show

# 2. Blast-radius policy gate on priceShoppingCart
Type "# 2. Blast-radius policy gate on priceShoppingCart"
Enter
Type "rgctl -f json blast-radius priceShoppingCart --policy-file ../rgctl-pr-policy.json | jq '{metrics, gatekeeping}'"
Enter
Sleep 3s
