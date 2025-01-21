sudo DEBIAN_FRONTEND=noninteractive apt-get update -y 2> /dev/null
sudo DEBIAN_FRONTEND=noninteractive apt-get install nginx -y 2> /dev/null

{{setup_docker_command}}
sudo docker pull {{image}}
sudo docker run -d -p {{port}}:{{port}} -e MESSAGE=teste {{image}}

sudo cat <<EOF | sudo tee /etc/nginx/sites-available/default > /dev/null
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    server_name _;

    location / {
        proxy_pass http://localhost:{{port}};
    }
}
EOF

sudo service nginx restart
