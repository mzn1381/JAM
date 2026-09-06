import { Message } from './Chat';

export interface Task {
  id: string;
  title: string;
  datetime: string;
  completed: boolean;
  pinned: boolean;
  category: string;
  categoryColor: string;
}

export interface LocalTask extends Task {
  messages: Message[]; // The additional property
}

// Type for the new post data
export interface NewTask {
  title: string;
  body: string;
}
