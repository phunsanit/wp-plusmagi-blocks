import { createRouter, createWebHistory } from 'vue-router';
import ProductHome from './pages/ProductHome.vue';

const routes = [
	{ path: '/', component: ProductHome }
];

const router = createRouter({
	history: createWebHistory(),
	routes,
});

export default router;
