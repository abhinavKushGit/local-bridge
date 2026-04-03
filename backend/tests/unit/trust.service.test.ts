import { TrustService } from '../../src/services/trust.service';

describe('TrustService.getBadge', () => {
  it('returns new for 0 exchanges', () => {
    expect(TrustService.getBadge(0, 0)).toBe('new');
  });

  it('returns reliable for mid score', () => {
    expect(TrustService.getBadge(0.6, 5)).toBe('reliable');
  });

  it('returns champion for high score', () => {
    expect(TrustService.getBadge(0.9, 20)).toBe('champion');
  });
});
