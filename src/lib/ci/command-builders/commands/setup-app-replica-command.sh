# TODO: Add some docs here!

sudo DEBIAN_FRONTEND=noninteractive apt-get update -y 2> /dev/null

sudo DEBIAN_FRONTEND=noninteractive apt-get install nginx -y 2> /dev/null

sudo DEBIAN_FRONTEND=noninteractive apt-get install curl -y 2> /dev/null
sudo DEBIAN_FRONTEND=noninteractive apt-get install ca-certificates -y 2> /dev/null

sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

sudo echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
    sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo DEBIAN_FRONTEND=noninteractive apt-get update -y 2> /dev/null
sudo DEBIAN_FRONTEND=noninteractive apt-get install docker-ce -y 2> /dev/null

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
