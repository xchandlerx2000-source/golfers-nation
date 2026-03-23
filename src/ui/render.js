import { renderAppTemplate } from "./templates.js";

export function createRenderer(root) {
  return function render(state) {
    root.innerHTML = renderAppTemplate(state);
  };
}
