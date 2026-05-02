declare module "intl-tel-input" {
  export interface IntlTelInputCountryData {
    dialCode?: string;
    iso2?: string;
  }

  export interface IntlTelInputValidationError {
    INVALID_COUNTRY_CODE: number;
    TOO_SHORT: number;
    TOO_LONG: number;
    NOT_A_NUMBER: number;
  }

  export interface IntlTelInputInstance {
    destroy(): void;
    setNumber(value: string): void;
    getNumber(format?: number): string;
    getSelectedCountryData(): IntlTelInputCountryData;
    isValidNumber(): boolean;
    getValidationError(): number;
  }

  export interface IntlTelInputOptions {
    initialCountry?: string;
    preferredCountries?: string[];
    separateDialCode?: boolean;
    utilsScript?: string;
    customContainer?: string;
    autoPlaceholder?: string;
  }

  export interface IntlTelInputStatic {
    (
      input: HTMLInputElement,
      options?: IntlTelInputOptions,
    ): IntlTelInputInstance;
    utils?: {
      validationError: IntlTelInputValidationError;
    };
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
