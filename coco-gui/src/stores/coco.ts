import { reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import { coco } from '@/coco'
import { taxonomy } from '@/taxonomy';

export const useCoCoStore = defineStore('coco', () => {
  const name = ref('CoCo');
  const state = reactive(new coco.State());

  return { name, state };
});

/**
 * Retrieves all static properties of a given type and its parent types.
 * 
 * @param type - The type to retrieve static properties from.
 * @returns A map of static property names to their corresponding Property objects.
 */
export function static_properties(type: taxonomy.Type): Map<string, taxonomy.Property> {
  const props = new Map<string, taxonomy.Property>();
  const q = [type];
  while (q.length > 0) {
    const t = q.shift()!;
    for (const [name, property] of t.static_properties)
      props.set(name, property);
    for (const parent of t.parents.values())
      q.push(parent);
  }
  return props;
}

/**
 * Retrieves all dynamic properties of a given type and its parent types.
 * 
 * @param type - The type to retrieve dynamic properties from.
 * @returns A map of dynamic properties, where the key is the property name and the value is the property object.
 */
export function dynamic_properties(type: taxonomy.Type): Map<string, taxonomy.Property> {
  const props = new Map<string, taxonomy.Property>();
  const q = [type];
  while (q.length > 0) {
    const t = q.shift()!;
    for (const [name, property] of t.dynamic_properties)
      props.set(name, property);
    for (const parent of t.parents.values())
      q.push(parent);
  }
  return props;
}