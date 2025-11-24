export interface Task {
  id: string;
  content: string;
  description?: string;
  labels?: string[];
  subtasks?: { id: string; content: string; completed: boolean }[];
}

export interface Column {
  id: string;
  title: string;
  taskIds: string[];
}

export interface Board {
  id: string;
  title: string;
  columns: { [key: string]: Column };
  tasks: { [key: string]: Task };
  columnOrder: string[];
}

export type BoardData = {
  boards: Board[];
  currentBoardId: string | null;
};
