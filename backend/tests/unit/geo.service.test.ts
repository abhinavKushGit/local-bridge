describe('Geo distance calculation', () => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const haversine = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  it('returns distance greater than 0 for different coords', () => {
    const dist = haversine(28.6469, 77.3910, 28.6519, 77.3910);
    expect(dist).toBeGreaterThan(0);
    expect(dist).toBeLessThan(2);
  });

  it('returns 0 for same coordinates', () => {
    const dist = haversine(28.6469, 77.3910, 28.6469, 77.3910);
    expect(dist).toBe(0);
  });
});
