import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);

  const user = await prisma.user.create({
    data: {
      email: 'demo@example.com',
      name: 'Demo User',
      password,
    },
  });

  const board = await prisma.board.create({
    data: {
      title: 'My First Board',
      description: 'Getting started with Task Manager',
      ownerId: user.id,
      lists: {
        create: [
          {
            title: 'To Do',
            order: 0,
            tasks: {
              create: [
                { title: 'Set up project', priority: 'HIGH', status: 'DONE', order: 0 },
                { title: 'Invite team members', priority: 'MEDIUM', status: 'TODO', order: 1 },
              ],
            },
          },
          {
            title: 'In Progress',
            order: 1,
            tasks: {
              create: [
                { title: 'Design board layout', priority: 'HIGH', status: 'IN_PROGRESS', order: 0 },
              ],
            },
          },
          {
            title: 'Done',
            order: 2,
          },
        ],
      },
    },
  });

  // eslint-disable-next-line no-console
  console.log('Seed completed:', { userId: user.id, boardId: board.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
