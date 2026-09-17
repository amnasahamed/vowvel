/// <reference types="vite/client" />

interface RazorpayOptions {
  key:string;
  amount:number;
  currency:string;
  name:string;
  description:string;
  order_id:string;
  handler:(response:RazorpaySuccessResponse)=>void|Promise<void>;
  prefill:{name:string;email:string};
  theme:{color:string};
  modal?:{ondismiss:()=>void};
}

interface RazorpaySuccessResponse {
  razorpay_payment_id:string;
  razorpay_order_id:string;
  razorpay_signature:string;
}

interface RazorpayFailureResponse {
  error?:{description?:string;reason?:string};
}

interface Window {
  Razorpay?:new(options:RazorpayOptions)=>{open:()=>void;on:(event:'payment.failed',handler:(response:RazorpayFailureResponse)=>void)=>void};
  paypal?:{Buttons:(config:PayPalButtonsConfig)=>{render:(target:HTMLElement)=>Promise<void>|void}};
}

interface PayPalButtonsConfig {
  style?:{layout?:string;label?:string};
  createOrder:()=>string|Promise<string>;
  onApprove:(data:{orderID:string})=>void|Promise<void>;
  onCancel?:()=>void;
  onError?:(err:unknown)=>void;
}
