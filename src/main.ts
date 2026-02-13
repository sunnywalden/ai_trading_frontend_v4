import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import "./style.css";
import { logger } from "@/utils/logger";

logger.info("🚀 Frontend application starting...");

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount("#app");
