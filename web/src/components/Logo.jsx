// The product mark, served from web/public. BASE_URL keeps it correct under the
// demo's GitHub Pages sub-path (/Sluice/) as well as at a domain root.
export function Logo({ size = 28 }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}favicon.svg`}
      width={size}
      height={size}
      alt=""
      class="shrink-0 rounded-md"
    />
  );
}
