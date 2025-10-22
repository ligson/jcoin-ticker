import {createRouter, createWebHistory} from "vue-router";
// 两种方式引入页面
const routes = [
    {
        path: '/home',
        name: 'home',
        component: () => import("../components/home/HomePage.vue")
    },
    {
        path: '/setting',
        name: 'setting',
        // 方法一
        component: () => import("../components/setting/SettingPage.vue"),
        children: [
            {
                path: 'ticker-coin',
                name: 'ticker-coin',
                component: () => import("../components/setting/pages/tickercoin/TickerCoinPage.vue")
            },
            {
                path: 'about',
                name: 'about',
                component: () => import("../components/setting/pages/about/AboutPage.vue")
            },
            {
                path: '', // 默认子路由
                name: "default-setting",
                redirect: '/setting/ticker-coin'
            }
        ]
    },
    {
        path: '/help',
        name: 'help',
        component: () => import("../components/help/HelpPage.vue")
    },
]

export const router = createRouter({
    // 4. 内部提供了 history 模式的实现。为了简单起见，我们在这里使用 hash 模式。
    history: createWebHistory("/icoin/"),
    routes, // `routes: routes` 的缩写
})
//export default router;
