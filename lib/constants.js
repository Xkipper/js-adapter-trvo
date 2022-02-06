module.exports = {
    selectors: {
        loginInput: 'input:near([type="password"])',
        passwordInput: '[type="password"]',
        chatInput: '[placeholder="What\'s up!"]',
        rulesButton: '"Got it!"',
        verificationButton: '"Send"',
        verificationInput: 'ul.show-ul',
        verificationEmail: 'p.text',
        followButton: '"Follow"',
        onlineUsers: '#__layout > div > section > div.header-right > svg > use',
        closeOnlineUsers: '#__layout > div > section > div.gift-rank > svg > use'
    },
    chatType: {
        message: 0,
        streamer: 1,
        channel_manager: 2,
        live_manager: 3,
        super_manager: 4,
        gift: 5, // '{"id":520010002,"num":1}'
        magic_chat: 6, // 'magicChat.magicChatGiftID': '520000995'  
        subscribed: 5001, // 'has subscribed to the channel!'
        system: 5002,
        follow: 5003, // 'just followed channel!'
        welcome: 5004, // 'just joined channel!'
        gifted_sub: 5005,
        hosted: 5006, // '100562599,NotAimbot'
        rocket_launch: 5007, // '{title} has casted a spell rocket and the channel
        // will be boosted to front page!'
        raid: 5008, // {nickname} is carrying {raiderNum} raiders
        // to this channel. Welcome!
        new_gift: 5009, // {"gift":"Emerald","num":1,"sid":100503338}
    }
};