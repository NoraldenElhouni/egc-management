import type { ReactNode } from "react";

// Renders its children inert when `disabled`: a <fieldset disabled> turns off
// every button, input, select and textarea inside it — mouse AND keyboard —
// without each cell needing a readOnly prop. `display: contents` keeps it out
// of the layout, so it is safe as a direct child of the board's grid rows.
// A courtesy for people who cannot edit; the database enforces the real rule.
export default function EditGuard({ disabled, children }: { disabled: boolean; children: ReactNode }) {
  if (!disabled) return <>{children}</>;
  return (
    <fieldset disabled className="contents min-w-0 border-0 p-0 m-0">
      {children}
    </fieldset>
  );
}
