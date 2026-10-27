export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export enum OrgRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export enum WsEvent {
  BOARD_CREATED = 'board:created',
  BOARD_UPDATED = 'board:updated',
  BOARD_DELETED = 'board:deleted',
  LIST_CREATED = 'list:created',
  LIST_UPDATED = 'list:updated',
  LIST_DELETED = 'list:deleted',
  TASK_CREATED = 'task:created',
  TASK_UPDATED = 'task:updated',
  TASK_DELETED = 'task:deleted',
  TASK_MOVED = 'task:moved',
  JOIN_BOARD = 'board:join',
  LEAVE_BOARD = 'board:leave',
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  role?: OrgRole;
  memberCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: OrgRole;
  createdAt: Date;
  user: Pick<User, 'id' | 'email' | 'name'>;
}

export interface Board {
  id: string;
  title: string;
  description: string | null;
  ownerId: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  lists?: List[];
}

export interface List {
  id: string;
  title: string;
  order: number;
  boardId: string;
  createdAt: Date;
  updatedAt: Date;
  tasks?: Task[];
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: Priority;
  status: TaskStatus;
  order: number;
  listId: string;
  assigneeId: string | null;
  assignee?: Pick<User, 'id' | 'name' | 'email'> | null;
  dueDate: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrganizationDto {
  name: string;
}

export interface AddOrganizationMemberDto {
  email: string;
  role?: OrgRole;
}

export interface UpdateOrganizationMemberDto {
  role: OrgRole;
}

export interface CreateBoardDto {
  title: string;
  description?: string;
  organizationId?: string;
}

export interface UpdateBoardDto {
  title?: string;
  description?: string;
}

export interface CreateListDto {
  title: string;
  boardId: string;
}

export interface UpdateListDto {
  title?: string;
  order?: number;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  priority?: Priority;
  status?: TaskStatus;
  listId: string;
  dueDate?: string;
  assigneeId?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  priority?: Priority;
  status?: TaskStatus;
  order?: number;
  listId?: string;
  dueDate?: string | null;
  assigneeId?: string | null;
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}
