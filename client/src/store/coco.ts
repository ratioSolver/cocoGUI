import { Knowledge } from '@/knowledge';
import { defineStore } from 'pinia'

export const useCoCoStore = defineStore('CoCo', {
    state: () => ({
        knowledge: new Knowledge(import.meta.env.VITE_COCO_NAME),
        messages: [] as Array<{ me: boolean, timestamp: Date, text: string }>
    }),
    actions: {
        update_knowledge(data: any): void {
            this.knowledge.update_knowledge(data);
        },
        send_message(message: string): void {
            this.messages.push({ 'me': true, 'timestamp': new Date(), 'text': message });
        },
        load_data(item_id: string, from = Date.now() - 1000 * 60 * 60 * 24 * 14, to = Date.now()) {
            console.log('load_data', item_id, from, to);
            fetch('http://' + location.host + '/item/' + item_id + '?' + new URLSearchParams({ from: from.toString(), to: to.toString() }), {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            }).then(res => {
                if (res.ok)
                    res.json().then(data => {
                        console.log(data);
                        useCoCoStore().knowledge.items.get(item_id)!.set_values(data);
                    });
                else
                    res.json().then(data => alert(data.message));
            });
        },
        publish_data(item_id: string, data: JSON) {
            console.log('publish_data', item_id, data);
            fetch('http://' + location.host + '/item/' + item_id, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            }).then(res => {
                if (!res.ok)
                    res.json().then(data => alert(data.message));
            });
        }
    }
});