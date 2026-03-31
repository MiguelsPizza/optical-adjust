import "./style.css";
import { bindEvents } from "./app-events.ts";
import { createAppMarkup } from "./app-markup.ts";
import { createRenderContext, paintCanvases } from "./app-render.ts";
import { createInitialAppState } from "./app-state.ts";

export function mountApp(root: HTMLElement) {
  const state = createInitialAppState();

  const render = () => {
    const context = createRenderContext(state);
    root.innerHTML = createAppMarkup(state, context);
    bindEvents(root, state, render);
    paintCanvases(root, context);
  };

  render();
}
