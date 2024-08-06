import BooleanProperty from '@/components/properties/BooleanProperty.vue';
import IntegerProperty from './components/properties/IntegerProperty.vue';
import RealProperty from './components/properties/RealProperty.vue';
import StringProperty from './components/properties/StringProperty.vue';
import SymbolProperty from './components/properties/SymbolProperty.vue';
import ItemProperty from './components/properties/ItemProperty.vue';

import ReactiveRule from './components/taxonomy/ReactiveRule.vue';
import DeliberativeRule from './components/taxonomy/DeliberativeRule.vue';
import ItemListItem from './components/taxonomy/ItemListItem.vue';
import ItemChart from './components/taxonomy/ItemChart.vue';
import ItemPublisher from './components/taxonomy/ItemPublisher.vue';

export * from './coco';
export * from './taxonomy';
export * from './values';
export { BooleanProperty, IntegerProperty, RealProperty, StringProperty, SymbolProperty, ItemProperty };