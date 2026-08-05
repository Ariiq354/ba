export function openModal(
  component: any,
  props?: object,
) {
  const overlay = useOverlay();
  const modal = overlay.create(component, {
    props,
  });

  return modal.open();
}
