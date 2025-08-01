#!/bin/bash

# VPSサーバセットアップスクリプト
# 使用方法: sudo bash vps-setup.sh

set -e

echo "VPSサーバのセットアップを開始します..."

# 必要なパッケージのインストール
apt update
apt install -y nginx nodejs npm git

# Node.jsバージョン管理（オプション）
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# プロジェクトディレクトリの作成
mkdir -p /var/www/vhosts/eclipse-defi-tools.sho43.xyz
cd /var/www/vhosts/eclipse-defi-tools.sho43.xyz

# Gitリポジトリのクローン（初回のみ）
if [ ! -d ".git" ]; then
    echo "Gitリポジトリをクローンします..."
    git clone https://github.com/your-username/eclipse-defi-tools.git .
fi

# 権限設定
chown -R www-data:www-data /var/www/vhosts/eclipse-defi-tools.sho43.xyz
chmod -R 755 /var/www/vhosts/eclipse-defi-tools.sho43.xyz

# Nginxの設定
cat > /etc/nginx/sites-available/eclipse-defi-tools.sho43.xyz << 'EOF'
server {
    listen 80;
    server_name eclipse-defi-tools.sho43.xyz;
    
    root /var/www/vhosts/eclipse-defi-tools.sho43.xyz/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # セキュリティヘッダー
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy strict-origin-when-cross-origin;
}
EOF

# Nginxサイトの有効化
ln -sf /etc/nginx/sites-available/eclipse-defi-tools.sho43.xyz /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
systemctl enable nginx

echo "VPSサーバのセットアップが完了しました！"
echo ""
echo "次の手順を実行してください："
echo "1. GitHubリポジトリのSecretsに以下を設定："
echo "   - VPS_HOST: あなたのVPSのIPアドレス"
echo "   - VPS_USERNAME: SSHユーザー名"
echo "   - VPS_SSH_KEY: SSH秘密鍵"
echo "   - VPS_PORT: SSHポート（デフォルト: 22）"
echo ""
echo "2. SSL証明書の設定（Let's Encrypt推奨）："
echo "   sudo apt install certbot python3-certbot-nginx"
echo "   sudo certbot --nginx -d eclipse-defi-tools.sho43.xyz"