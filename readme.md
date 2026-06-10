mac
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxx

powershill
$env:GITHUB_TOKEN="PASTE_YOUR_REAL_TOKEN_HERE"
npm run publish

git tag v1.0.40
git push origin v1.0.40
