import { Injectable, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { RegisterDto } from './dto/register.dto';
import { generateSlug } from '../common/slug';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
    });
    if (existing) {
      throw new ConflictException('Email already in use');
    }
    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma
      .$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            email: normalizedEmail,
            password: hashed,
            name: dto.name,
          },
          select: { id: true, email: true, name: true, createdAt: true, updatedAt: true },
        });

        await tx.organization.create({
          data: {
            name: `${dto.name}'s Workspace`,
            slug: generateSlug(dto.name),
            members: {
              create: {
                userId: createdUser.id,
                role: 'OWNER',
              },
            },
          },
        });

        return createdUser;
      })
      .catch((err) => {
        // A concurrent register for the same email can pass the check above.
        if (err?.code === 'P2002') {
          throw new ConflictException('Email already in use');
        }
        throw err;
      });

    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    return { accessToken: token, user };
  }

  async login(user: any) {
    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  async getUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, createdAt: true, updatedAt: true },
    });
  }

  async validateUser(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    // Prefer the exact normalized row; legacy mixed-case duplicates fall back to a case-insensitive match.
    const user =
      (await this.prisma.user.findUnique({ where: { email: normalizedEmail } })) ??
      (await this.prisma.user.findFirst({
        where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
      }));
    if (!user) return null;
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user;
    return result;
  }
}
