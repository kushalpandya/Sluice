// Font Awesome icon wrapped in Bulma's .icon, and an icon+text label helper.
// Returned as VNodes so they can be passed around as props (e.g. split-button labels).

export const icon = (name, style = 'fas') => (
  <span class="icon is-small">
    <i class={`${style} fa-${name}`}></i>
  </span>
);

export const label = (name, text, style) => (
  <>
    {icon(name, style)}
    <span>{text}</span>
  </>
);
