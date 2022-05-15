const chatbotSwitch = document.querySelector('#chatbot-switch > input')
const eventsubSwitch = document.querySelector('#eventsub-switch > input')

fetch('/chatbot')
    .then(res => res.json())
    .then(json => {
        chatbotSwitch.checked = json.running
    })

chatbotSwitch.addEventListener('change', e => {
    fetch(`/chatbot?activate=${Number(e.currentTarget.checked)}`)
})