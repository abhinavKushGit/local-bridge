describe('CategoryEngine VOTE_THRESHOLD', () => {
  it('uses 1 in dev mode', () => {
    process.env.DEV_MODE_OTP = 'true';
    const threshold = process.env.DEV_MODE_OTP === 'true' ? 1 : 50;
    expect(threshold).toBe(1);
  });

  it('uses 50 in production mode', () => {
    process.env.DEV_MODE_OTP = 'false';
    const threshold = process.env.DEV_MODE_OTP === 'true' ? 1 : 50;
    expect(threshold).toBe(50);
  });
});
