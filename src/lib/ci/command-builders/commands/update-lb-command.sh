sudo cat <<EOF | sudo tee {{config_file}} > /dev/null
{{config_json}}
EOF

cat <<EOF | sudo tee /etc/nginx/sites-available/default > /dev/null
upstream target {
{{ips}}
}

server {
    listen 80 default_server;
    listen [::]:80 default_server;

    server_name _;

    location / {
        proxy_pass http://target;

        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        proxy_redirect off;
    }
}
EOF

sudo service nginx restart
