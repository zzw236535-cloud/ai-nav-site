#!/usr/bin/env bash
# ============================================================
# 一键创建 GitHub 仓库并推送（在 gh auth login 成功后运行）
# 用法: bash deploy.sh <仓库名>   例如: bash deploy.sh ai-nav-site
# ============================================================
set -e

REPO="${1:-ai-nav-site}"
GH="/c/Users/31645/.ghcli/bin/gh.exe"

echo "==> 检查 gh 登录状态"
"$GH" auth status

echo "==> 创建仓库并推送: $REPO"
"$GH" repo create "$REPO" --public --source=. --remote=origin --push

echo ""
echo "==> 完成！仓库地址:"
"$GH" repo view --json url -q .url
echo ""
echo "==> 下一步：打开下面链接用 GitHub 登录 Vercel 并导入该仓库（一键部署）"
echo "    https://vercel.com/new"
echo ""
echo "    已包含 vercel.json，Vercel 会自动识别为静态站点，直接点 Deploy 即可。"
