require('dotenv').config()
const axios = require('axios')

console.debug = (s) => {
    if (process.env.DEBUG) {
        console.log(s)
    }
}

function get_headers(token) {
    return {
        'Client-ID': process.env.CLIENT_ID,
        Authorization: 'Bearer ' + token,
    }
}

async function get_token(client_id, client_secret, scopes) {
    let token
    await axios({
            method: 'POST',
            url: `https://id.twitch.tv/oauth2/token?client_id=${client_id}&client_secret=${client_secret}&grant_type=client_credentials&scope=${scopes}`,
        })
        .then(res => {
            token = res.data.access_token
            console.debug('Access token: ' + token)
        })
        .catch(err => {
            console.error(err.response.data)
        })
    return token
}

async function revoke_token(client_id, token) {
    await axios({
            method: 'POST',
            url: `https://id.twitch.tv/oauth2/revoke?client_id=${client_id}&token=${token}`,
        })
        .then(res => {
            console.debug('Token revoked.')
        })
        .catch(err => {
            console.error(err.response.data)
        })
}

async function get_streamer_id(token, name) {
    let id
    await axios({
            method: 'GET',
            url: `https://api.twitch.tv/helix/users?login=${name}`,
            headers: get_headers(token),
        })
        .then(res => {
            id = res.data.data[0].id
            console.debug(`Streamer: ${name}, id: ${id}`)
        }).catch(err => {
            console.error(err.response.data)
        })
    return id
}

async function get_subscribed_events(token) {
    let events
    await axios({
            method: 'GET',
            url: 'https://api.twitch.tv/helix/eventsub/subscriptions',
            headers: get_headers(token),
        })
        .then(res => {
            events = res.data.data
            console.debug('Events list: ' + JSON.stringify(events))
        }).catch(err => {
            console.error(err.response.data)
        })
    return events
}

async function subscribe(token, id, topic) {
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
                    callback: process.env.NGROK_URL + '/eventsub',
                    secret: process.env.HMAC_SECRET
                }
            }
        })
        .then(res => {
            console.debug(`Subscribed to ${topic} (${res.data.data[0].id})`)
        })
        .catch(err => {
            console.error('Unable to subscribe to ' + topic, err.response.data)
        })
}

async function unsubscribe(token, event_id) {
    await axios({
            method: 'DELETE',
            url: 'https://api.twitch.tv/helix/eventsub/subscriptions',
            headers: get_headers(token),
            data: {
                id: event_id
            }
        })
        .then(res => {
            console.debug('Unsubscribed from ' + event_id)
        })
        .catch(err => {
            console.error(err.response.data)
        })
}

async function unsubscribe_all(token) {
    const events = await get_subscribed_events(token)
    for (const evt of events) {
        await unsubscribe(token, evt.id)
    }
}

module.exports = {
    get_token,
    revoke_token,
    get_streamer_id,
    get_subscribed_events,
    subscribe,
    unsubscribe,
    unsubscribe_all,
}