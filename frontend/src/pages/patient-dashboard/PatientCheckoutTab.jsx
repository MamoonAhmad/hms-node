import { CheckoutProvider } from './checkout/CheckoutContext';
import { CheckoutWorkspace } from './checkout/CheckoutWorkspace';

export function PatientCheckoutTab() {
  return (
    <CheckoutProvider>
      <CheckoutWorkspace />
    </CheckoutProvider>
  );
}
