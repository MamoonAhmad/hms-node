import { useState } from 'react';

/**
 * Lets a screening section work both controlled (Patient Dashboard intake, which
 * owns answers + scoring) and uncontrolled (Nurse Dashboard, which just renders
 * the form). When `onChange` is supplied the parent owns the value; otherwise the
 * component keeps its own local state.
 */
export function useScreeningAnswers(answers, onChange, defaultAnswers) {
  const [internal, setInternal] = useState(() => answers ?? defaultAnswers());
  const isControlled = typeof onChange === 'function';
  const value = isControlled ? answers ?? defaultAnswers() : internal;
  const update = isControlled ? onChange : setInternal;
  return [value, update];
}
