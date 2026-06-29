const isProduction = process.env.NODE_ENV === "production";

export const logger = {
  info: (message: any, ...optionalParams: any[]) => {
    if (!isProduction) {
      console.log(message, ...optionalParams);
    }
  },
  warn: (message: any, ...optionalParams: any[]) => {
    console.warn(message, ...optionalParams);
  },
  error: (message: any, ...optionalParams: any[]) => {
    console.error(message, ...optionalParams);
  }
};
