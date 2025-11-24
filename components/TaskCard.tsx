import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../types';
import { AlignLeft, CheckSquare } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "Task",
      task,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-white p-3 rounded-lg shadow-xl ring-2 ring-blue-500 rotate-2 cursor-grabbing h-[80px] opacity-90"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(task)}
      className="bg-white p-2.5 rounded-lg shadow-sm border border-gray-200/50 hover:border-blue-400 hover:shadow-md cursor-pointer group transition-all duration-200 relative"
    >
      <div className="flex justify-between items-start mb-1.5">
        <h4 className="text-sm text-gray-700 font-medium leading-snug group-hover:text-blue-700 transition-colors">{task.content}</h4>
      </div>
      
      {/* Indicators */}
      <div className="flex flex-wrap gap-2 text-gray-400">
        {(task.description || (task.subtasks && task.subtasks.length > 0)) && (
          <div className="flex items-center gap-3 mt-1">
            {task.description && <AlignLeft size={14} className="text-gray-400" />}
            
            {task.subtasks && task.subtasks.length > 0 && (
               <div className={`flex items-center gap-1 text-xs rounded px-1 py-0.5 ${completedSubtasks === totalSubtasks ? 'bg-green-100 text-green-600' : 'text-gray-500'}`}>
                 <CheckSquare size={14} />
                 <span>{completedSubtasks}/{totalSubtasks}</span>
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
