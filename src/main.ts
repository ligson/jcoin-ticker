import {createApp} from 'vue'
import './style.css'
import App from './App.vue'
import Antd, {message} from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';
import {router} from "./config/router.ts"
import store from "./config/store.ts"

const app = createApp(App);
app.config.globalProperties.$message = message;
app.config.globalProperties.$store = store;


app.use(Antd).use(router).mount('#app').$nextTick(() => {
    // Use contextBridge
    window.ipcRenderer.on('main-process-message', (_event, message) => {
        console.log(message)
    })
})
