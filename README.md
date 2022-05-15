# twitch-controller
Bunch of code to interact with Twitch

## Create an Application in your Twitch Developers console
https://dev.twitch.tv/console


## Create files to the root of project

### Create .env

```properties
BOT_NAME="insert your bot name"
OAUTH_TOKEN="get your token on https://twitchapps.com/tmi/"
CHANNELS="insert channels you want to connect (comma-separated if multiple)"
CLIENT_ID="Your client id"
CLIENT_SECRET="Your client secret"
SECRET="A randomly generated fixed string"
```

### Create SSL certificate

```bash
openssl genrsa -out key.pem
openssl req -new -key key.pem -out csr.pem
openssl x509 -req -days 9999 -in csr.pem -signkey key.pem -out cert.pem
rm csr.pem
```