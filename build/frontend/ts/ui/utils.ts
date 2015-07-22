module Utils {
  const kDisabledClass = "disabled";

  export function SetVisibility(el : HTMLElement, visible : boolean) : void {
    el.style.display = visible ? 'block' : 'none';
  }

  export function IsVisible(el: HTMLElement) : boolean {
    return el.style.display != 'none';
  }

  export function ToggleVisibility(el : HTMLElement) : void {
    return SetVisibility(el, !IsVisible(el));
  }

  export function ClearNode(el : HTMLElement) {
    var child_node = el.firstChild;
    while (child_node) {
      el.removeChild(child_node);
      child_node = el.firstChild;
    }
  }

  export function CreateDiv(class_name : string) : HTMLDivElement {
    const div = document.createElement("div");
    div.classList.add(class_name);
    return div;
  }

  export function RemoveHelp(default_message : string,
                             event : FocusEvent) : void {
    const element = <Element> event.target;
    element.classList.remove(kDisabledClass);
    if (element.textContent == default_message) {
      element.textContent = "";
    }
  }

  export function ReturnHelp(default_message : string,
                             event : FocusEvent) : void {
    const element = <Element> event.target;
    if (element.textContent.length == 0) {
      element.classList.add(kDisabledClass);
      element.textContent = default_message;
    }
  }
}