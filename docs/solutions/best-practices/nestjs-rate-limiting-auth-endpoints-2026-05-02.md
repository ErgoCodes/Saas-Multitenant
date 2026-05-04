---
title: NestJS rate limiting on auth endpoints with @nestjs/throttler
date: 2026-05-02
category: best-practices
module: api
problem_type: best_practice
component: authentication
severity: medium
applies_when:
  - "Implementing API rate limiting in NestJS applications"
  - "Protecting authentication endpoints from brute-force attacks"
tags:
  - nestjs
  - rate-limiting
  - throttler
  - authentication
  - api-security
  - brute-force-protection
  - turborepo
---

# NestJS rate limiting on auth endpoints with @nestjs/throttler

## Context

During MVP development of a Task Manager API (Turborepo monorepo with NestJS backend + Next.js frontend), security hardening was needed to protect authentication endpoints from brute force attacks. Rate limiting was added using `@nestjs/throttler` with differentiated limits based on endpoint risk profiles.

## Guidance

### Installation

```bash
pnpm add @nestjs/throttler
```

### Global Configuration

Register `ThrottlerModule` in `app.module.ts` with a default TTL and limit:

```typescript
import { ThrottlerModule } from '@nestjs/throttler';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 10 }]),
    // ... other modules
  ],
})
export class AppModule {}
```

### Per-Endpoint Overrides

Use `@Throttle()` decorators on controller methods for stricter limits on sensitive endpoints:

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  async register(@Body() dto: RegisterDto) { ... }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(@Body() dto: LoginDto) { ... }
}
```

### How It Works

- **Global default**: Catches all routes with a baseline (10 req/min)
- **Per-endpoint override**: Tighter limits on high-risk endpoints (auth, password reset)
- **Request tracking**: Throttler tracks by IP automatically
- **Response**: Returns `429 Too Many Requests` with `Retry-After` header when exceeded

## Why This Matters

Rate limiting auth endpoints prevents brute force attacks (3-5 attempts/min makes credential stuffing impractical); a global default protects all routes from API abuse.

## When to Apply

- APIs with authentication endpoints (login, register, password reset, OTP verification)
- Before deploying to production as baseline security hardening

## Examples

### app.module.ts — Global Configuration

```typescript
import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 10 }]),
    // ... other modules
  ],
})
export class AppModule {}
```

### auth.controller.ts — Per-Endpoint Limits

```typescript
import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LocalAuthGuard, JwtAuthGuard } from './guards';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(@Body() dto: LoginDto, @Request() req: RequestWithUser) {
    return this.authService.login(req.user);
  }
}
```

## Related

- None — first security hardening doc in this project
