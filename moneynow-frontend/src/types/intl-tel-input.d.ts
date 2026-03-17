declare module "intl-tel-input" {
  export interface IntlTelInputCountryData {
    dialCode?: string;
  }

  export interface IntlTelInputInstance {
    destroy(): void;
    setNumber(value: string): void;
    getNumber(format?: number): string;
    getSelectedCountryData(): IntlTelInputCountryData;
  }

  export interface IntlTelInputOptions {
    initialCountry?: string;
    separateDialCode?: boolean;
    utilsScript?: string;
    customContainer?: string;
  }

  export interface IntlTelInputStatic {
    (
      input: HTMLInputElement,
      options?: IntlTelInputOptions,
    ): IntlTelInputInstance;
  }

  const intlTelInput: IntlTelInputStatic;
  export default intlTelInput;
}

interface Window {
  intlTelInputUtils?: {
    numberFormat: {
      NATIONAL: number;
    };
  };
}
