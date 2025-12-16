// Polyfill for crypto.randomUUID() in browsers that don't support it
// Run immediately - don't wait for window
if (typeof crypto !== 'undefined' && !crypto.randomUUID) {
  // @ts-ignore
  crypto.randomUUID = function randomUUID() {
    return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c: any) =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  };
  console.log('✅ crypto.randomUUID polyfill installed');
}

export {};
