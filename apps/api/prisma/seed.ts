import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function addDays(base: Date, days: number): Date {
  const result = new Date(base);
  result.setDate(result.getDate() + days);
  return result;
}

async function ensurePersonalWorkspace(user: { id: string; name: string }) {
  const fullSlug = `workspace-${user.id}`;
  const legacySlug = `workspace-${user.id.slice(0, 8)}`;
  const existing = await prisma.organization.findFirst({
    where: { slug: { in: [fullSlug, legacySlug] } },
  });
  const org = existing
    ? await prisma.organization.update({
        where: { id: existing.id },
        data: { name: `${user.name}'s Workspace`, slug: fullSlug },
      })
    : await prisma.organization.create({
        data: {
          name: `${user.name}'s Workspace`,
          slug: fullSlug,
        },
      });

  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: org.id,
        userId: user.id,
      },
    },
    update: { role: 'OWNER' },
    create: {
      organizationId: org.id,
      userId: user.id,
      role: 'OWNER',
    },
  });

  return org;
}

async function seedBoardsForOrg(
  organizationId: string,
  ownerId: string,
  secondMemberId?: string,
) {
  const seedTitles = ['Product Launch Q4', 'Multi-Tenancy Architecture'];

  await prisma.board.deleteMany({
    where: {
      organizationId,
      title: { in: seedTitles },
    },
  });

  const today = new Date();

  const productBoard = await prisma.board.create({
    data: {
      title: 'Product Launch Q4',
      description: 'Core tasks organized by workstream with independent status tracking',
      ownerId,
      organizationId,
      lists: {
        create: [
          {
            title: 'Discovery & Design',
            order: 0,
            tasks: {
              create: [
                {
                  title: 'Define domain model (Freeform Lists + Task Status)',
                  description:
                    'Decouple list columns from task workflow state so lists act as flexible groupings.',
                  priority: 'HIGH',
                  status: 'DONE',
                  order: 0,
                  dueDate: addDays(today, -2),
                  assigneeId: ownerId,
                },
                {
                  title: 'Audit Kanban and Calendar UX flows',
                  description:
                    'Review task creation, inline status toggling, and calendar drag-and-drop.',
                  priority: 'URGENT',
                  status: 'DONE',
                  order: 1,
                  dueDate: today,
                  assigneeId: secondMemberId ?? ownerId,
                },
              ],
            },
          },
          {
            title: 'Frontend & Real-Time',
            order: 1,
            tasks: {
              create: [
                {
                  title: 'Build TaskDetailSheet for full task editing',
                  description:
                    'Allow editing title, description, status, priority, list, assignee, and due date.',
                  priority: 'HIGH',
                  status: 'IN_PROGRESS',
                  order: 0,
                  dueDate: addDays(today, 1),
                  assigneeId: ownerId,
                },
                {
                  title: 'Wire Socket.IO room subscriptions on Board & Calendar',
                  description:
                    'Emit board:join and invalidate React Query caches on task/list mutations.',
                  priority: 'MEDIUM',
                  status: 'IN_PROGRESS',
                  order: 1,
                  dueDate: addDays(today, 3),
                  assigneeId: secondMemberId ?? ownerId,
                },
                {
                  title: 'Add keyboard shortcuts for quick task creation',
                  description: 'Press N to open inline task form in the first list.',
                  priority: 'LOW',
                  status: 'TODO',
                  order: 2,
                  dueDate: null,
                },
              ],
            },
          },
          {
            title: 'QA & Release',
            order: 2,
            tasks: {
              create: [
                {
                  title: 'End-to-end verification of Organization RBAC',
                  description:
                    'Verify OWNER, ADMIN, and MEMBER permissions across boards and calendar.',
                  priority: 'URGENT',
                  status: 'TODO',
                  order: 0,
                  dueDate: addDays(today, 5),
                  assigneeId: ownerId,
                },
                {
                  title: 'Write release notes for v0.3 Multi-Tenancy',
                  priority: 'LOW',
                  status: 'TODO',
                  order: 1,
                  dueDate: null,
                },
              ],
            },
          },
        ],
      },
    },
  });

  const architectureBoard = await prisma.board.create({
    data: {
      title: 'Multi-Tenancy Architecture',
      description: 'Organizations, Memberships, and Role-Based Access Control',
      ownerId,
      organizationId,
      lists: {
        create: [
          {
            title: 'Database & Prisma',
            order: 0,
            tasks: {
              create: [
                {
                  title: 'Add Organization and OrganizationMember models',
                  description:
                    'Introduce roles (OWNER, ADMIN, MEMBER) and link Board to organizationId.',
                  priority: 'URGENT',
                  status: 'DONE',
                  order: 0,
                  dueDate: addDays(today, 2),
                  assigneeId: ownerId,
                },
                {
                  title: 'Backfill personal workspaces for existing users',
                  description: 'Zero-loss migration for pre-existing boards.',
                  priority: 'HIGH',
                  status: 'DONE',
                  order: 1,
                  dueDate: null,
                  assigneeId: secondMemberId ?? ownerId,
                },
              ],
            },
          },
          {
            title: 'Authorization Layer',
            order: 1,
            tasks: {
              create: [
                {
                  title: 'Update BoardAccessService to verify org membership',
                  description:
                    'Replace single ownerId check with organization membership and role assertion.',
                  priority: 'HIGH',
                  status: 'DONE',
                  order: 0,
                  dueDate: addDays(today, 4),
                  assigneeId: ownerId,
                },
              ],
            },
          },
        ],
      },
    },
  });

  return [productBoard.id, architectureBoard.id];
}

async function main() {
  const password = await bcrypt.hash('password123', 10);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {
      name: 'Demo User',
      password,
    },
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
      password,
    },
  });

  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true },
  });

  for (const u of users) {
    const personalOrg = await ensurePersonalWorkspace(u);
    await seedBoardsForOrg(personalOrg.id, u.id);
  }

  // Create shared Acme Corp organization with all users as members
  const acmeOrg = await prisma.organization.upsert({
    where: { slug: 'acme-corp' },
    update: { name: 'Acme Corp (Shared)' },
    create: {
      name: 'Acme Corp (Shared)',
      slug: 'acme-corp',
    },
  });

  const primaryOwner =
    users.find((u) => u.email !== 'demo@example.com') ?? demoUser;

  for (const u of users) {
    const role = u.id === primaryOwner.id ? 'OWNER' : 'ADMIN';
    await prisma.organizationMember.upsert({
      where: {
        organizationId_userId: {
          organizationId: acmeOrg.id,
          userId: u.id,
        },
      },
      update: { role },
      create: {
        organizationId: acmeOrg.id,
        userId: u.id,
        role,
      },
    });
  }

  await seedBoardsForOrg(acmeOrg.id, primaryOwner.id, demoUser.id);

  // eslint-disable-next-line no-console
  console.log('Multi-tenant seed completed for users:', users.map((u) => u.email));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
