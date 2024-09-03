import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import TypeView from '../views/TypeView.vue'
import ItemView from '../views/ItemView.vue'
import SolverView from '../views/SolverView.vue'
import ReactiveRuleView from '../views/ReactiveRuleView.vue'
import DeliberativeRuleView from '@/views/DeliberativeRuleView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/type/:id',
      name: 'type',
      component: TypeView
    },
    {
      path: '/item/:id',
      name: 'item',
      component: ItemView
    },
    {
      path: '/solver/:id',
      name: 'solver',
      component: SolverView
    },
    {
      path: '/reactive_rule/:id',
      name: 'reactive_rule',
      component: ReactiveRuleView
    },
    {
      path: '/deliberative_rule/:id',
      name: 'deliberative_rule',
      component: DeliberativeRuleView
    }
  ]
})

export default router
