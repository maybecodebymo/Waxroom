export const requestConfirmation = (options) => {
  if (typeof window === 'undefined') {
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    window.dispatchEvent(new CustomEvent('waxroom:confirm', {
      detail: {
        ...options,
        resolve,
      },
    }));
  });
};
