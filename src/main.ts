import { logger } from "@/utils/logger";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import { createPinia } from "pinia";
import { createApp } from "vue";
import App from "./App.vue";
import i18n from "./i18n";
import router from "./router";
import "./style.css";
import "./styles/responsive.css"; // V3.2 全局响应式样式

logger.info("🚀 Frontend application starting...");

if (globalThis.window !== undefined) {
	globalThis.addEventListener("unhandledrejection", (event) => {
		const reason = event.reason;
		let message = "";

		if (typeof reason === "string") {
			message = reason;
		} else if (reason instanceof Error) {
			message = reason.message;
		} else if (reason !== null && typeof reason === "object") {
			const r = reason as Record<string, unknown>;
			message = typeof r["message"] === "string" ? r["message"] : String(reason);
		} else {
			message = String(reason ?? "");
		}

		// Chrome may reject with a DOMException whose .name is "EncodingError" when
		// an in-page SVG is serialized to a data-URL and decoded as an image.
		// Its .message reads "The source image could not be decoded" and does NOT
		// contain the data-URL that Chrome shows in the console.  Match broadly.
		const isSvgImageError =
			message.includes("data:image/svg+xml") ||
			message.includes("Unable to load image") ||
			message.includes("could not be decoded") ||
			message.includes("Failed to decode") ||
			(reason instanceof DOMException && reason.name === "EncodingError");

		const isClosedMessageChannelError =
			message.includes("A listener indicated an asynchronous response by returning true") ||
			message.includes("message channel closed before a response was received");

		const isAbortLikeError =
			message.includes("AbortError") ||
			message.includes("The operation was aborted");

		if (isSvgImageError || isClosedMessageChannelError || isAbortLikeError) {
			logger.debug(`Ignored recoverable promise rejection: ${message}`);
			event.preventDefault();
		}
	});
}

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(ElementPlus);
app.use(i18n);
app.mount("#app");
