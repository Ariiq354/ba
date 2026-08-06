import type { Component } from "vue";
import type { ComponentProps } from "vue-component-type-helpers";

export function openModal<T extends Component>(
  component: T,
  props?: ComponentProps<T>,
) {
  const overlay = useOverlay();
  const modal = overlay.create(component, {
    props,
  });

  return modal.open();
}
