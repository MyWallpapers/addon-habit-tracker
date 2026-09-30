import type { CanvasAddonMountContext } from "../generated/mywallpaper-runtime";
import { card, el } from "./ui";
import { timer } from "./timing";
import "./style.css";
export function mount(context: CanvasAddonMountContext) {
  const view = card(context, "Habitude"),
    title = el("div", "", "quote"),
    days = el("div", "", "row"),
    toggle = el("button", "Fait aujourd’hui");
  view.body.append(title, days, toggle);
  let values = context.layer.settings.get(),
    state = context.layer.deviceSettings.get();
  const key = (date: Date) =>
    date.getFullYear() +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getDate()).padStart(2, "0");
  const render = () => {
    title.textContent = String(values.habit || "Mon habitude");
    days.replaceChildren();
    const dates = new Set(
        String(state.dates || "")
          .split("\n")
          .filter(Boolean),
      ),
      now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - i,
        ),
        item = el(
          "span",
          date.toLocaleDateString("fr-FR", { weekday: "short" }) +
            " " +
            (dates.has(key(date)) ? "●" : "○"),
          "pill",
        );
      item.setAttribute(
        "aria-label",
        date.toLocaleDateString("fr-FR") +
          (dates.has(key(date)) ? " : réalisé" : " : non réalisé"),
      );
      days.append(item);
    }
    toggle.textContent = dates.has(key(now))
      ? "Retirer aujourd’hui"
      : "Fait aujourd’hui";
    view.caption.textContent = "Un petit geste, régulièrement.";
  };
  const change = () => {
    const dates = new Set(
        String(state.dates || "")
          .split("\n")
          .filter(Boolean),
      ),
      today = key(new Date());
    dates.has(today) ? dates.delete(today) : dates.add(today);
    state = { dates: [...dates].sort().slice(-366).join("\n") };
    render();
    void context.layer.deviceSettings.set(state).catch(() => {
      view.caption.textContent = "Habitude non enregistrée";
    });
  };
  toggle.onclick = change;
  const stop = context.layer.settings.subscribe((next) => {
      values = next;
      render();
    }),
    stopDevice = context.layer.deviceSettings.subscribe((next) => {
      state = next;
      render();
    }),
    action = context.layer.actions.on("today", change),
    stopTimer = timer(context, render, 60000);
  render();
  return () => {
    stop();
    stopDevice();
    action();
    stopTimer();
    toggle.onclick = null;
    view.section.remove();
  };
}
