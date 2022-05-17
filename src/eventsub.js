require('dotenv').config()
const fs = require('fs')
const https = require('https')
const express = require('express')
const crypto = require('crypto')
const axios = require('axios')

// Notification request headers
const TWITCH_MESSAGE_ID = 'Twitch-Eventsub-Message-Id'.toLowerCase()
const TWITCH_MESSAGE_TIMESTAMP = 'Twitch-Eventsub-Message-Timestamp'.toLowerCase()
const TWITCH_MESSAGE_SIGNATURE = 'Twitch-Eventsub-Message-Signature'.toLowerCase()
const MESSAGE_TYPE = 'Twitch-Eventsub-Message-Type'.toLowerCase()

// Notification message types
const MESSAGE_TYPE_VERIFICATION = 'webhook_callback_verification'
const MESSAGE_TYPE_NOTIFICATION = 'notification'
const MESSAGE_TYPE_REVOCATION = 'revocation'

const options = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
};

const app = express()

app.use(express.raw({
    type: 'application/json'
}))

const server = https.createServer(options, app)

server.listen(process.env.PORT_SSL, () => {
    console.log('Listening on ' + process.env.PORT_SSL)
})

app.get('/', (req, res) => {
    res.send('Hello World')
})

app.post('/eventsub', (req, res) => {
    const message = getHmacMessage(req)
    const hmac = 'sha256=' + getHmac(message)

    if (true === verifyMessage(hmac, req.headers[TWITCH_MESSAGE_SIGNATURE])) {
        if (MESSAGE_TYPE_NOTIFICATION === req.headers[MESSAGE_TYPE]) {
            // TODO: Do something with event's data.
            console.log(`Event type: ${req.body.subscription.type}`)
            console.log(JSON.stringify(req.body.event, null, 4))

            res.sendStatus(204)
        } else if (MESSAGE_TYPE_VERIFICATION === req.headers[MESSAGE_TYPE]) {
            res.status(200).send(req.body.challenge)
            // res.status(200).type('raw/plain').send(req.body.challenge)
        } else if (MESSAGE_TYPE_REVOCATION === req.headers[MESSAGE_TYPE]) {
            res.sendStatus(204)

            console.log(`${req.body.subscription.type} notifications revoked!`)
            console.log(`reason: ${req.body.subscription.status}`)
            console.log(`condition: ${JSON.stringify(req.body.subscription.condition, null, 4)}`)
        } else {
            res.sendStatus(204)
            console.log(`Unknown message type: ${req.headers[MESSAGE_TYPE]}`)
        }
    } else {
        console.log('403')
        res.sendStatus(403)
    }
})

// Build the message used to get the HMAC.
function getHmacMessage(request) {
    return (request.headers[TWITCH_MESSAGE_ID] + request.headers[TWITCH_MESSAGE_TIMESTAMP] + JSON.stringify(request.body))
}

// Get the HMAC.
function getHmac(message) {
    return crypto.createHmac('sha256', process.env.HMAC_SECRET).update(message).digest('hex')
}

// Verify whether your signature matches Twitch's signature.
function verifyMessage(hmac, verifySignature) {
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(verifySignature))
}

// Get Twitch API call header
function get_headers(token) {
    return {
        'Client-ID': process.env.CLIENT_ID,
        Authorization: 'Bearer ' + token,
    }
}

// Get app token
exports.get_token = async (client_id, client_secret, scopes) => {
    let token
    await axios({
        method: 'POST',
        url: `https://id.twitch.tv/oauth2/token?client_id=${client_id}&client_secret=${client_secret}&grant_type=client_credentials&scope=${scopes}`,
    }).then(res => {
        token = res.data.access_token
    }).catch(err => {
        console.error(err.response.data)
    })
    return token
}

// Revoke app token
exports.revoke_token = async (client_id, token) => {
    await axios({
        method: 'POST',
        url: `https://id.twitch.tv/oauth2/revoke?client_id=${client_id}&token=${token}`,
    }).then(res => {
        console.log('Token revoked.')
    }).catch(err => {
        console.error(err.response.data)
    })
}

// Get streamer id from name
exports.get_streamer_id = async (token, name) => {
    let id
    await axios({
        method: 'GET',
        url: `https://api.twitch.tv/helix/users?login=${name}`,
        headers: get_headers(token),
    }).then(res => {
        id = res.data.data[0].id
    }).catch(err => {
        console.error(err.response.data)
    })
    return id
}

// Get subscribed events
exports.get_subscribed_events = async (token) => {
    let events
    await axios({
        method: 'GET',
        url: 'https://api.twitch.tv/helix/eventsub/subscriptions',
        headers: get_headers(token),
    }).then(res => {
        events = res.data.data
    }).catch(err => {
        console.error(err.response.data)
    })
    return events
}

// Subscribe to an event
exports.subscribe = async (token, id, topic) => {
    await axios({
        method: 'POST',
        url: 'https://api.twitch.tv/helix/eventsub/subscriptions',
        headers: get_headers(token),
        data: {
            type: topic,
            version: '1',
            condition: {
                broadcaster_user_id: id
            },
            transport: {
                method: 'webhook',
                callback: `https://${process.env.HOST}:${process.env.PORT_SSL}/eventsub`,
                secret: process.env.HMAC_SECRET
            }
        }
    }).then(res => {
        console.log(`Subscribed to ${topic} (${res.data.data[0].id})`)
    }).catch(err => {
        console.error('Unable to subscribe to ' + topic, err.response.data)
    })
}

// Unsubscribe from an event
exports.unsubscribe = async (token, event_id) => {
    await axios({
        method: 'DELETE',
        url: 'https://api.twitch.tv/helix/eventsub/subscriptions',
        headers: get_headers(token),
        data: {
            id: event_id
        }
    }).then(res => {
        console.log('Unsubscribed from ' + event_id)
    }).catch(err => {
        console.error(err.response.data)
    })
}

// Unsubscribe from all events
exports.unsubscribe_all = async (token) => {
    const events = await this.get_subscribed_events(token)
    for (const e of events) {
        await this.unsubscribe(token, e.id)
    }
}

(async () => {
    const appToken = await this.get_token(process.env.CLIENT_ID, process.env.CLIENT_SECRET, 'channel:read:subscriptions')
    console.log('Access token: ' + appToken)

    const streamerId = await this.get_streamer_id(appToken, process.env.STREAMER)
    console.log(`Streamer: ${process.env.STREAMER}, id: ${streamerId}`)

    await this.unsubscribe_all(appToken)

    console.log('Events list: ' + JSON.stringify(await this.get_subscribed_events(appToken)))

    await this.subscribe(appToken, streamerId, 'channel.follow')
    await this.subscribe(appToken, streamerId, 'channel.subscribe')

    console.log('Events list: ' + JSON.stringify(await this.get_subscribed_events(appToken)))
})()
