const botbuilder = require('botbuilder');
const { chatType } = require('./constants.js');
require('dotenv').config();

const getKeyByValue = val => Object.keys(chatType).find(key =>
    chatType[key] === val) || 'unknown_event';

const makeTime = timestamp => new Date(timestamp / 1000000).getTime()

const Roles = {};

Roles.read = (pbf, end) => pbf.readFields(Roles._readField, { role: '' }, end);
Roles._readField = (tag, obj, pbf) => {
    if (tag === 2) obj.role = pbf.readString();
};

const Decorations = {}

Decorations.read = (pbf, end) => pbf.readFields(Decorations._readField, { name: '' }, end);
Decorations._readField = (tag, obj, pbf) => {
    if (tag === 1) obj.name = pbf.readString()
};

const Chat = {};

Chat.read = (pbf, end) => pbf.readFields(Chat._readField, {
    from: {
        id: 0,
        name: '',
    },
    type: botbuilder.ActivityTypes.Message,
    value: 0,
    text: '',
    entities: [],
    timestamp: 0,
    channelData: {
        userName: '',
        displayName: '',
        roles: [],
        subLevel: '',
        avatar: '',
        decoration: [],
        details: {},
        args: [],
        botkitEventType: '',
        command: '',
    },
    channelId: process.env.CHANNEL,
    id: 'trovo',
    conversation: {
        id: 'trovo',
    },
    recipient: {
        id: 0,
        name: process.env.BOTNAME,
    },
    locale: 'en-US',
    serviceURL: '',
}, end);

Chat._readField = (tag, obj, pbf) => {
    if (tag === 1) obj.from.id = pbf.readVarint();
    else if (tag === 3) obj.from.name = obj.channelData.displayName =
        pbf.readString();
    else if (tag === 5) {
        obj.text = pbf.readString();
        if (obj.text.startsWith('!')) {
            obj.channelData.args = obj.text.split(' ');
            obj.channelData.command = obj.channelData.args.shift();
        }
    } else if (tag === 6) obj.timestamp = makeTime(pbf.readVarint());
    else if (tag === 7) {
        obj.value = pbf.readVarint();
        if (obj.value !== 0) {
            obj.type = botbuilder.ActivityTypes.Event;
            obj.channelData.botkitEventType = getKeyByValue(obj.value);
        }
    } else if (tag === 10) obj.channelData.subLevel = pbf.readString();
    else if (tag === 11) obj.channelData.avatar = pbf.readString();
    else if (tag === 12) obj.channelData.userName = pbf.readString();
    else if (tag === 13) obj.channelData.roles.push(Roles.read(pbf,
        pbf.readVarint() + pbf.pos).role);
    else if (tag === 14) obj.channelData.decoration.push(Decorations.read(pbf,
        pbf.readVarint() + pbf.pos).name);
    else if (tag === 20) {
        const entry = Chat._FieldEntry20.read(pbf, pbf.readVarint() + pbf.pos);
        if (entry.key === 'at' && entry.value) {
            let jsonObj = JSON.parse(entry.value);
            jsonObj.forEach(val => obj.entities.push({
                id: val.uid,
                name: val.name,
            }));
        }
        obj.channelData.details[entry.key] = entry.value;
    }
};

Chat._FieldEntry20 = {};

Chat._FieldEntry20.read = (pbf, end) => pbf.readFields(
    Chat._FieldEntry20._readField, { key: '', value: '' }, end);
Chat._FieldEntry20._readField = (tag, obj, pbf) => {
    if (tag === 1) obj.key = pbf.readString();
    else if (tag === 2) obj.value = pbf.readString();
};

const TrovoMessage = exports.TrovoMessage = {};

TrovoMessage.read = (pbf, end) => pbf.readFields(TrovoMessage._readField, {
    chat: null,
    Field5Timestamp: 0,
    Field6Timestamp: 0
}, end);

TrovoMessage._readField = (tag, obj, pbf) => {
    if (tag === 3) obj.chat = Chat.read(pbf, pbf.readVarint() + pbf.pos);
    else if (tag === 5) obj.Field5Timestamp = makeTime(pbf.readVarint());
    else if (tag === 6) obj.Field6Timestamp = makeTime(pbf.readVarint());
};