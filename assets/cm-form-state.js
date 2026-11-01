var CMFormState = (() => {
  "use strict";
  const ignored = /* @__PURE__ */ new Set(["language", "cm-site-language", "ws-language"]);
  function control(value) {
    return value instanceof HTMLInputElement || value instanceof HTMLSelectElement || value instanceof HTMLTextAreaElement;
  }
  function capture(root, ids) {
    const elements = ids ? ids.map((id) => root.querySelector("#" + CSS.escape(id))) : [...root.querySelectorAll("input[id],select[id],textarea[id]")];
    return elements.filter(control).filter((e) => !ignored.has(e.id) && e.type !== "file").map((e) => ({
      id: e.id,
      value: e.value,
      ...e instanceof HTMLInputElement && ["radio", "checkbox"].includes(e.type) ? { checked: e.checked } : {}
    }));
  }
  function restore(root, saved, emit = true) {
    const changed = [];
    for (const item of saved) {
      const e = root.querySelector("#" + CSS.escape(item.id));
      if (!control(e) || e.type === "file" || ignored.has(e.id)) continue;
      e.value = item.value;
      if (typeof item.checked === "boolean" && e instanceof HTMLInputElement)
        e.checked = item.checked;
      changed.push(e);
    }
    if (emit)
      for (const e of changed) {
        e.dispatchEvent(new Event("input", { bubbles: true }));
        e.dispatchEvent(new Event("change", { bubbles: true }));
      }
  }
  return { capture, restore };
})();
