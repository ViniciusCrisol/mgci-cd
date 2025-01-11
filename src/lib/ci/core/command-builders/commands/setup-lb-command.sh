sudo DEBIAN_FRONTEND=noninteractive apt-get update -y 2> /dev/null
sudo DEBIAN_FRONTEND=noninteractive apt-get install nginx -y 2> /dev/null

sudo cat <<EOF | sudo tee {{config_file}} > /dev/null
{{config_json}}
EOF
