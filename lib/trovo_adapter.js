const playwright = require('playwright-chromium');
const pbf = require('pbf');
const botbuilder = require('botbuilder');
const botkit = require('botkit');
const { selectors, chatType } = require('./constants.js');
const { TrovoMessage } = require('./trovoproto.js');
const dotenv = require('dotenv');
dotenv.config();


var UniversalPage = null;
var uCanal = process.env.CHANNEL;


class TrovoAdapter extends botbuilder.BotAdapter {
    name = 'newTrovo Adapter';
    version = require('../package.json').version;
    botkit_worker = botkit.BotWorker;

    constructor() {
        super();

    }

    async init(controller) {
		this.canal = uCanal;
        this._controller = controller;

        await this._login();
        await this._joinChat();
        //await this._isLoggedIn();
        await this._enableNetwork();
        await this._handleExit();
    }

    async _login() {
        console.log("🌐 Starting Browser  ━━━━━ ");
        this._browser = await playwright.chromium.launch({
			                            headless: true,
                                        args: ['--minimal','--lang=en_US','--process-per-site','--silent-launch','--single-process','--incognito','--test-type','--demo']
        });
        this._context = await this._browser.newContext({ viewport: { width: 800, height: 600 } });
        this._page = await this._context.newPage();
        
        await this._page.route('**/*', (route) => {
            const tmp = route.request().url().indexOf('google');
            return route.request().resourceType() === 'image' || 
                    route.request().resourceType() === 'font' || 
                    (tmp > -1)
                ? route.abort()
                : route.continue()
        });

		console.log("\t⌛ Loading Trovo.URL...");
        this.url = new URL('https://trovo.live/?openLogin=1');
        await this._page.goto(this.url.href, { timeout: 60000 });

        console.log("\t🔒 Sending data to Trovo.login...");
        await this._page.fill('input:near([type="password"])', process.env.LOGIN);
        await this._page.keyboard.press('Tab');
        await this._page.fill('[type="password"]', process.env.PASSWORD);
        await this._page.keyboard.press('Enter');
        await this._page.waitForTimeout(5000);

    }


    async _checkSelector(selector) {
        try {
            await this._page.waitForSelector(selector, { timeout: 10000 });
            await this._page.dispatchEvent(selector, 'click');
            if (selector === selectors.verificationButton) {
                this._verificationProcess();
            }
        } catch (e) {
            if (e instanceof playwright.errors.TimeoutError === false) {
                console.error(`_checkSelector:${selector}:`, e);
            }
        }
    }



    async _shutdown() {
        await this._browser.close();
        process.exit(0);
    }

    
    async _joinChat() {
        this.url.searchParams.delete('openLogin');
		this.url.pathname = `/chat/${this.canal}`;
        console.log("\t🔎 Waiting for the streamer: " + this.canal + "...");
        await this._page.goto(this.url.href);
        await this._page.waitForNavigation();
        
        try {
            console.log("\t👀 Enter to the ChatBox...");
            await this._page.locator('button:has-text("Got it!")').click()
            console.log("\t\t\t\t...Done!");
                    
        } catch (e) { ; }

        try {
            await this._page.locator('button:has-text("Follow")').click({ timeout: 10000 })
            console.log("\t📌 Follow!");
                    
        } catch (e) { ; }

        UniversalPage = this._page;
        console.log(" ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    }


    async _isLoggedIn() {
        console.info('[TrovoBot] Checking to see if we logged in correctly...');
        try {
            await this._page.dispatchEvent(selectors.onlineUsers, 'click');
            await this._page.waitForSelector(`"${process.env.BOTNAME}"`);
            await this._page.dispatchEvent(selectors.closeOnlineUsers, 'click');
            console.info("[TrovoBot]", process.env.BOTNAME, 'is logged in and ready!');
        } catch (e) {
            if (e instanceof playwright.errors.TimeoutError) {
                console.error('The bot may not be logged in correctly.',
                    'Restart the bot if you have trouble with it responding.',
                    'You may need to delete the stored cookie.');
            } else {
                console.error('_isLoggedIn', e);
            }
        }
    }


    async _enableNetwork() {
        this._session = await this._context.newCDPSession(this._page);
        this._session.on('Network.webSocketFrameReceived',
            ({ requestId, timestamp, response }) => this._handle(
                response.opcode === 1 ? 'text' : 'binary',
                response.payloadData)
        );
        await this._session.send('Network.enable');
    }

    _handle(payloadType, payload) {
        if (payloadType === 'text') {
            return;
        }
        const buffer = Buffer.from(payload, 'base64');
        const opcode = buffer.readUInt16BE(8);
        if (opcode !== 3) {
            return;
        }
        const frame = {
            totalLength: buffer.readUInt32BE(0),
            dataLength: buffer.readUInt32BE(18),
            get data() {
                return buffer.slice(this.totalLength - this.dataLength);
            }
        }
        this._messageToActivity(frame.data);
    }

    _messageToActivity(buffer) {
        const chat = TrovoMessage.read(new pbf(buffer)).chat;
        if (chat === null || chat.channelData.details.__history__ ||
            chat.channelData.displayName === process.env.BOTNAME) {
            return;
        }
        this.processActivity(chat);
    }

    async processActivity(activity) {
        activity.recipient.id = "999999999"; //this.botUID;
        activity.serviceURL = this.url.href;
        const context = new botbuilder.TurnContext(this, activity);
        await this.runMiddleware(context,
            this._controller.handleTurn.bind(this._controller, context));
    }

    _handleExit() {
        process.on('SIGINT', () => {
            process.exit(0);
        });
    }

    async sendActivities(context, activities) {
        for (let i = 0; i < activities.length; ++i) {
            const activity = activities[i];
            await this._page.fill(selectors.chatInput, activity.text);
            await this._page.keyboard.press('Enter');
        }
    }

    

    async killPage(){
        try {
            await this._page.close();
            await UniversalPage.close()
        } catch (e) {
            this._page = null;
            UniversalPage = null;
            console.error('killPage', e);
        }

    }

    getPage() { return UniversalPage; }
    getStreamer(){ return uCanal; }
    setStreamer(canalUser){ uCanal = canalUser; }
}

exports.TrovoAdapter = TrovoAdapter;