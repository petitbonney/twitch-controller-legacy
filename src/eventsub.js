require('dotenv').config()
const express = require('express')
const crypto = require('crypto')
const twitch = require('./twitch.js')

const app = express()
const PORT = process.env.PORT
const STREAMER = process.env.STREAMER
const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET
let appToken, STREAMER_ID

// Notification request headers
const TWITCH_MESSAGE_ID = 'Twitch-Eventsub-Message-Id'.toLowerCase()
const TWITCH_MESSAGE_TIMESTAMP = 'Twitch-Eventsub-Message-Timestamp'.toLowerCase()
const TWITCH_MESSAGE_SIGNATURE = 'Twitch-Eventsub-Message-Signature'.toLowerCase()
const MESSAGE_TYPE = 'Twitch-Eventsub-Message-Type'.toLowerCase()

// Notification message types
const MESSAGE_TYPE_VERIFICATION = 'webhook_callback_verification'
const MESSAGE_TYPE_NOTIFICATION = 'notification'
const MESSAGE_TYPE_REVOCATION = 'revocation'

// Prepend this string to the HMAC that you create from the message
const HMAC_PREFIX = 'sha256='

appToken = await twitch.get_token(CLIENT_ID, CLIENT_SECRET, 'channel:read:subscriptions')
STREAMER_ID = await twitch.get_streamer_id(appToken, STREAMER)

await twitch.unsubscribe_all(appToken)
await twitch.subscribe(appToken, STREAMER_ID, 'channel.follow')
await twitch.subscribe(appToken, STREAMER_ID, 'channel.subscribe')
await twitch.get_subscribed_events()

app.use(express.json())

app.get('/', (req, res) => {
    res.send('Hello World')
})

app.post('/eventsub', (req, res) => {
    let message = getHmacMessage(req)
    let hmac = HMAC_PREFIX + getHmac(message)

    if (true === verifyMessage(hmac, req.headers[TWITCH_MESSAGE_SIGNATURE])) {
        if (MESSAGE_TYPE_NOTIFICATION === req.headers[MESSAGE_TYPE]) {
            // TODO: Do something with event's data.
            console.log(`Event type: ${req.body.subscription.type}`)
            console.log(JSON.stringify(req.body.event, null, 4))

            res.sendStatus(204)
        } else if (MESSAGE_TYPE_VERIFICATION === req.headers[MESSAGE_TYPE]) {
            res.status(200).type('raw/plain').send(req.body.challenge)
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

app.listen(PORT, () => {
    console.log('Listening on http://localhost:' + PORT)
})

// Build the message used to get the HMAC.
function getHmacMessage(request) {
    return (request.headers[TWITCH_MESSAGE_ID] +
        request.headers[TWITCH_MESSAGE_TIMESTAMP] +
        JSON.stringify(request.body))
}

// Get the HMAC.
function getHmac(message) {
    return crypto.createHmac('sha256', process.env.HMAC_SECRET)
        .update(message)
        .digest('hex')
}

// Verify whether your signature matches Twitch's signature.
function verifyMessage(hmac, verifySignature) {
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(verifySignature))
}
