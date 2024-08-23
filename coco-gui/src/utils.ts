import { MenuOption } from "naive-ui";
import { h } from "vue";
import { Box20Regular, Circle20Regular, BrainCircuit20Regular, PauseCircle20Regular, PlayCircle20Regular, CheckmarkCircle20Regular, ErrorCircle20Regular } from '@vicons/fluent';
import { taxonomy } from "./taxonomy";
import { rule } from "./rule";
import { solver } from "./solver";
import BooleanProperty from './components/properties/BooleanProperty.vue';
import IntegerProperty from './components/properties/IntegerProperty.vue';
import RealProperty from './components/properties/RealProperty.vue';
import StringProperty from './components/properties/StringProperty.vue';
import SymbolProperty from './components/properties/SymbolProperty.vue';
import ItemProperty from './components/properties/ItemProperty.vue';
import { computed } from "vue";

export function property_h(prop: taxonomy.Property, value: Record<string, any> | undefined, disabled: boolean = false) {
    if (prop instanceof taxonomy.BooleanProperty) {
        return h(BooleanProperty, { par: prop, value: value ? value[prop.name] : undefined, disabled: disabled });
    } else if (prop instanceof taxonomy.IntegerProperty) {
        return h(IntegerProperty, { par: prop, value: value ? value[prop.name] : undefined, disabled: disabled });
    } else if (prop instanceof taxonomy.RealProperty) {
        return h(RealProperty, { par: prop, value: value ? value[prop.name] : undefined, disabled: disabled });
    } else if (prop instanceof taxonomy.StringProperty) {
        return h(StringProperty, { par: prop, value: value ? value[prop.name] : undefined, disabled: disabled });
    } else if (prop instanceof taxonomy.SymbolProperty) {
        return h(SymbolProperty, { par: prop, value: value ? value[prop.name] : undefined, disabled: disabled });
    } else if (prop instanceof taxonomy.ItemProperty) {
        return h(ItemProperty, { par: prop, value: value ? value[prop.name] : undefined, disabled: disabled });
    } else {
        return '';
    }
}