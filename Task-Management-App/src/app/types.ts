// src/app/types.ts

export interface UserProfile {
  name: string;
  email: string;
  avatar: string | null;
  loggedInAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  deadline: string | null;
  attachments: string[];
  status: 'todo' | 'inprogress' | 'done';
  createdTime: string;
  expanded?: boolean;
}