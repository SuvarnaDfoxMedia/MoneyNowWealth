interface GrecaptchaExecuteOptions {
  action: string;
}

interface Grecaptcha {
  ready(callback: () => void): void;
  execute(siteKey: string, options: GrecaptchaExecuteOptions): Promise<string>;
}

interface Window {
  grecaptcha?: Grecaptcha;
}
