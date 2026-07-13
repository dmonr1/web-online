import template from "./admin-sidebar.html?raw";
import "./admin-sidebar.css";

export function createAdminSidebar(onViewChange) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = template.trim();
  const element = wrapper.firstElementChild;

  element.querySelectorAll("[data-view]").forEach((item) => {
    item.addEventListener("click", () => {
      element.querySelectorAll("[data-view]").forEach((button) => button.classList.remove("is-active"));
      item.classList.add("is-active");
      onViewChange(item.dataset.view);
    });
  });

  return element;
}
