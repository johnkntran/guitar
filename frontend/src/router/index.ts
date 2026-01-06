import { createRouter, createWebHistory } from 'vue-router'
import AnalyzerView from '../views/AnalyzerView.vue'
import TunerView from '../views/TunerView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'analyzer',
            component: AnalyzerView
        },
        {
            path: '/tuner',
            name: 'tuner',
            component: TunerView
        }
    ]
})

export default router
