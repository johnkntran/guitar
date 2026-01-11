import { createRouter, createWebHistory } from 'vue-router'
import AnalyzerView from '../views/AnalyzerView.vue'
import TunerView from '../views/TunerView.vue'
import AskTeacherView from '../views/AskTeacherView.vue'
import CircleView from '../views/CircleView.vue'
import NotebookView from '../views/NotebookView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            redirect: '/analyzer'
        },
        {
            path: '/analyzer',
            name: 'analyzer',
            component: AnalyzerView
        },
        {
            path: '/tuner',
            name: 'tuner',
            component: TunerView
        },
        {
            path: '/ask',
            name: 'teacher',
            component: AskTeacherView
        },
        {
            path: '/circle',
            name: 'circle',
            component: CircleView
        },
        {
            path: '/notebook',
            name: 'notebook',
            component: NotebookView
        }
    ]
})

export default router
