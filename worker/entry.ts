import application from './index';
import { checkoutReliability } from './checkout-reliability';
import { readPaymentStatus } from './payment-status';

// Preserve the existing fetch implementation and scheduled maintenance handler.
export default {
  ...application,
  fetch(...args: Parameters<typeof application.fetch>): Promise<Response> {
    const [request, env, ctx] = args;
    return checkoutReliability(request, env, next => application.fetch(next, env, ctx), order => readPaymentStatus(env, order));
  },
};
