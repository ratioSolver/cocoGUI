export const test_data = [
    {
        type: 'types', types: [
            { id: "1", name: 'type1', description: 'type1 description', static_parameters: [], dynamic_parameters: [] },
            { id: "2", name: 'type2', description: 'type2 description', static_parameters: [], dynamic_parameters: [] }]
    },
    {
        type: 'items', items: [
            { id: "3", name: 'item1', type: "1", description: 'item1 description', parameters: [] },
            { id: "4", name: 'item2', type: "2", description: 'item2 description', parameters: [] }]
    },
    {
        type: 'deliberative_rules', rules: [
            { id: "5", name: 'Clear block', content: `class Clear : StateVariable { Block b; Clear(Block b) : b(b) {} predicate True() { goal us_b = new hand.UnStack(b1:tau.b, end:start); } predicate False() { goal us_b = new hand.Stack(b1:tau.b, end:start); } }` },
            { id: "6", name: 'Block', content: `class Block : StateVariable { Clear clear = new Clear(this); predicate On(Block b) { duration >= 1.0; goal stack = new hand.Stack(b0:tau, b1:b, end:start); fact b1nc = new stack.b1.clear.False(start:start); b1nc.duration >= 1.0; } predicate OnTable() { duration >= 1.0; goal pd = new hand.PutDown(b:tau, end:start); } }` }]
    },
    {
        type: 'reactive_rules', rules: [
            { id: "7", name: 'item_type', content: `(deftemplate item_type (slot id (type SYMBOL)) (slot name (type STRING)) (slot description (type STRING)) (multislot static_parameters) (multislot dynamic_parameters))` },
            { id: "8", name: 'item', content: `(deftemplate item (slot id (type SYMBOL)) (slot name (type STRING)) (slot description (type STRING)) (multislot parameters))` }]
    }
];