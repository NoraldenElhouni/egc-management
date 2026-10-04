import { createContext, useContext } from "react";

// True while rendering a template board (boards.is_template) or a task on
// one. Template boards reuse the whole board/task UI unchanged; the few
// places that behave differently (date cells show "Day N", no push
// notifications, dependency search stays inside the template) read this
// instead of every cell/section growing an isTemplate prop.
const TemplateModeContext = createContext(false);

export const TemplateModeProvider = TemplateModeContext.Provider;

export function useTemplateMode(): boolean {
  return useContext(TemplateModeContext);
}
