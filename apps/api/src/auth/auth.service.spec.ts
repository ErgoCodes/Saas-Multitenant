import { ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService.register', () => {
  const mockPrisma: any = {
    $transaction: jest.fn((cb) => cb(mockPrisma)),
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    organization: {
      create: jest.fn(),
    },
  };
  const mockJwt = { sign: jest.fn(() => 'token') };

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(mockPrisma as any, mockJwt as any);
  });

  it('returns 409 Conflict when a concurrent register wins the unique email race', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null);
    mockPrisma.user.create.mockRejectedValue({ code: 'P2002' });

    await expect(
      service.register({ email: 'Race@Example.com', password: 'secret123', name: 'Race' }),
    ).rejects.toThrow(new ConflictException('Email already in use'));
  });

  it('stores a normalized email and creates a default workspace with a generated slug', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null);
    mockPrisma.user.create.mockImplementation(({ data }) => ({ id: 'user-1', email: data.email }));
    mockPrisma.organization.create.mockResolvedValue({});

    const result = await service.register({
      email: '  Alice@Example.com ',
      password: 'secret123',
      name: 'Alice Smith',
    });

    expect(result.user.email).toBe('alice@example.com');
    const orgData = mockPrisma.organization.create.mock.calls[0][0].data;
    expect(orgData.name).toBe("Alice Smith's Workspace");
    expect(orgData.slug).toMatch(/^alice-smith-[0-9a-f]{12}$/);
  });

  it('validateUser prefers the exact normalized email over a case-insensitive match', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', password: 'hash' });
    jest.spyOn(require('bcryptjs'), 'compare').mockResolvedValue(true as never);

    const result = await service.validateUser(' Foo@X.com ', 'pw');

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'foo@x.com' } });
    expect(mockPrisma.user.findFirst).not.toHaveBeenCalled();
    expect(result).toEqual({ id: 'user-1' });
  });
});
