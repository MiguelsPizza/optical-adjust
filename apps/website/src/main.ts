import { mountApp } from "./app.ts";

const root = document.querySelector<HTMLElement>("#app");

if (!root) {
  throw new Error("Expected #app root element.");
}

mountApp(root);
