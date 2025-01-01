sudo DEBIAN_FRONTEND=noninteractive apt-get update -y 2> /dev/null
sudo DEBIAN_FRONTEND=noninteractive apt-get install nginx -y 2> /dev/null

cat <<EOF | sudo tee /version_config.json > /dev/null
{
    "ips": [],
    "rollout": {
        "size": {{rollout_size}},
        "interval": {{rollout_interval}}
    }
}
EOF
