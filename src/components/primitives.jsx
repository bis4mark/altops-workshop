/** Shared form control class — defined in index.css. */
export const inputCls = "field";

export function Field({ label, children, full }) {
  return (
    <label className={`flex flex-col gap-1 ${full ? "col-span-full" : ""}`}>
      <span className="label">{label}</span>
      {children}
    </label>
  );
}
