export const requestConfirmation = (options) => {
  if (typeof window === 'undefined') {
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    window.dispatchEvent(new CustomEvent('waxroom:confirm', {
      detail: { ...options, resolve },
    }));
  });
};

export const requestAlert = (options) => {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    window.dispatchEvent(new CustomEvent('waxroom:alert', {
      detail: { ...options, resolve },
    }));
  });
};

export const requestPrompt = (options) => {
  if (typeof window === 'undefined') {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    window.dispatchEvent(new CustomEvent('waxroom:prompt', {
      detail: { ...options, resolve },
    }));
  });
};
