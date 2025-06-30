declare module 'braintree-web-drop-in-react' {
  import { Component } from 'react';

  interface DropInOptions {
    authorization: string;
    paypal?: {
      flow: string;
      amount?: string;
      currency?: string;
    };
  }

  interface DropInProps {
    options: DropInOptions;
    onInstance: (instance: any) => void;
  }

  export default class DropIn extends Component<DropInProps> {}
}
