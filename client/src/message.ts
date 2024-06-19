export class Message {

    me: boolean;
    timestamp: Date;
    text: string;

    constructor(me: boolean, timestamp: Date, text: string) {
        this.me = me;
        this.timestamp = timestamp;
        this.text = text;
    }
}