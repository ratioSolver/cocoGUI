import { h } from "vue";
import { taxonomy } from "./taxonomy";
import BooleanProperty from './components/properties/BooleanProperty.vue';
import IntegerProperty from './components/properties/IntegerProperty.vue';
import RealProperty from './components/properties/RealProperty.vue';
import StringProperty from './components/properties/StringProperty.vue';
import SymbolProperty from './components/properties/SymbolProperty.vue';
import ItemProperty from './components/properties/ItemProperty.vue';

export function property_h(prop: taxonomy.Property, value: Record<string, any>, disabled: boolean = false) {
    if (prop instanceof taxonomy.BooleanProperty) {
        return h(BooleanProperty, { par: prop, value: value[prop.name], disabled: disabled, onUpdate: (v: boolean | undefined) => { if (v === undefined) delete value[prop.name]; else value[prop.name] = v; } });
    } else if (prop instanceof taxonomy.IntegerProperty) {
        return h(IntegerProperty, { par: prop, value: value[prop.name], disabled: disabled, onUpdate: (v: number | undefined) => { if (v === undefined) delete value[prop.name]; else value[prop.name] = v; } });
    } else if (prop instanceof taxonomy.RealProperty) {
        return h(RealProperty, { par: prop, value: value[prop.name], disabled: disabled, onUpdate: (v: number | undefined) => { if (v === undefined) delete value[prop.name]; else value[prop.name] = v; } });
    } else if (prop instanceof taxonomy.StringProperty) {
        return h(StringProperty, { par: prop, value: value[prop.name], disabled: disabled, onUpdate: (v: string | undefined) => { if (v === undefined) delete value[prop.name]; else value[prop.name] = v; } });
    } else if (prop instanceof taxonomy.SymbolProperty) {
        return h(SymbolProperty, { par: prop, value: value[prop.name], disabled: disabled, onUpdate: (v: string | string[] | undefined) => { if (v === undefined) delete value[prop.name]; else value[prop.name] = v; } });
    } else if (prop instanceof taxonomy.ItemProperty) {
        return h(ItemProperty, { par: prop, value: value[prop.name], disabled: disabled, onUpdate: (v: string | string[] | undefined) => { if (v === undefined) delete value[prop.name]; else value[prop.name] = v; } });
    } else {
        return '';
    }
}