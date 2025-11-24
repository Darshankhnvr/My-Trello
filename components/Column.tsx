import React, { useState } from 'react';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Column as ColumnType, Task } from '../types';
import { TaskCard } from './TaskCard';
import { Plus, Trash2, X, MoreHorizontal } from 'lucide-react';

interface ColumnProps {
  column: ColumnType;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: (columnId: string, content: string) => void;
  onDeleteColumn: (columnId: string) => void;
}

export const Column: React.FC<ColumnProps> = ({ column, tasks, onTaskClick, onAddTask, onDeleteColumn }) => {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskContent, setNewTaskContent] = useState('');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: column.id,
    data: {
      type: "Column",
      column,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const handleAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskContent.trim()) return;
    onAddTask(column.id, newTaskContent);
    setNewTaskContent('');
    setIsAddingTask(false);
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="w-[272px] bg-black/10 rounded-xl h-[500px] flex-shrink-0 border-2 border-blue-400/50"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="w-[272px] bg-[#f1f2f4] rounded-xl flex flex-col max-h-full flex-shrink-0 shadow-sm"
    >
      {/* Header */}
      <div
        {...attributes}
        {...listeners}
        className="p-3 pl-4 flex justify-between items-center group cursor-grab active:cursor-grabbing"
      >
        <h3 className="font-semibold text-gray-700 text-sm">{column.title}</h3>
        <div className="flex items-center">
            <span className="text-gray-400 text-xs font-medium mr-2">{tasks.length}</span>
            <button 
                onClick={() => onDeleteColumn(column.id)} 
                className="p-1 hover:bg-gray-300 rounded text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
            >
            <Trash2 size={14} />
            </button>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 space-y-2 custom-scrollbar min-h-[10px]">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} onClick={onTaskClick} />
          ))}
        </SortableContext>
      </div>

      {/* Footer / Add Task */}
      <div className="p-2.5">
        {isAddingTask ? (
          <form onSubmit={handleAddTaskSubmit} className="space-y-2">
            <textarea
              autoFocus
              className="w-full p-2.5 text-sm rounded-lg bg-white shadow-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none block"
              placeholder="Enter a title for this card..."
              rows={3}
              value={newTaskContent}
              onChange={(e) => setNewTaskContent(e.target.value)}
              onKeyDown={(e) => {
                if(e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddTaskSubmit(e);
                }
              }}
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
              >
                Add Card
              </button>
              <button
                type="button"
                onClick={() => setIsAddingTask(false)}
                className="p-1.5 text-gray-500 hover:bg-gray-300 rounded"
              >
                <X size={18} />
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAddingTask(true)}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-gray-600 hover:bg-gray-200/80 rounded-lg text-sm font-medium transition-colors text-left"
          >
            <Plus size={16} />
            Add a card
          </button>
        )}
      </div>
    </div>
  );
};
