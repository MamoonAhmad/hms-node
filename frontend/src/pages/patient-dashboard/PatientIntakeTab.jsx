import { useState } from 'react';
import { IntakeProvider } from './intake/IntakeContext';
import { IntakeWorkspace } from './intake/IntakeWorkspace';
import { IntakeSectionNav } from './intake/components/IntakeSectionNav';

export function PatientIntakeTab() {
  const [mode, setMode] = useState('nurse-assessment');

  return (
    <IntakeProvider>
      <div className="flex h-full min-h-0 w-full flex-1 overflow-hidden">
        <IntakeSectionNav mode={mode} />
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-background">
          <div className="w-full px-4 py-5 sm:px-5 lg:px-6 lg:py-6">
            <IntakeWorkspace embedded mode={mode} onModeChange={setMode} />
          </div>
        </div>
      </div>
    </IntakeProvider>
  );
}
