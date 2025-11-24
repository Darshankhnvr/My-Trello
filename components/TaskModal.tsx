import React, { useState } from 'react';
import { Task } from '../types';
import { X, CheckSquare, AlignLeft, Layout } from 'lucide-react';

interface TaskModalProps {
  task: Task;
  onClose: () => void;
  onUpdate: (updatedTask: Task) => void;
  columnTitle: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({ task, onClose, onUpdate, columnTitle }) => {
  const [description, setDescription] = useState(task.description || '');
  const [subtasks, setSubtasks] = useState(task.subtasks || []);
  const [newSubtask, setNewSubtask] = useState('');
  
  const handleSave = () => {
    onUpdate({
      ...task,
      description,
      subtasks
    });
    onClose();
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    setSubtasks([...subtasks, { 
      id: crypto.randomUUID(), 
      content: newSubtask, 
      completed: false 
    }]);
    setNewSubtask('');
  };

  const toggleSubtask = (id: string) => {
    setSubtasks(subtasks.map(st => st.id === id ? { ...st, completed: !st.completed } : st));
  };

  const deleteSubtask = (id: string) => {
    setSubtasks(subtasks.filter(s => s.id !== id));
  };

  // Calculate progress
  const completedCount = subtasks.filter(s => s.completed).length;
  const progress = subtasks.length > 0 ? Math.round((completedCount / subtasks.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm py-10 px-4">
      {/* Click outside to close could be implemented here on the wrapper */}
      <div className="bg-[#f4f5f7] rounded-xl shadow-2xl w-full max-w-3xl flex flex-col relative animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="px-8 pt-6 pb-2 flex justify-between items-start">
          <div className="flex items-start gap-4 flex-1 mr-8">
            <Layout className="w-6 h-6 text-gray-700 mt-1" />
            <div>
              <h2 className="text-xl font-bold text-gray-800 leading-tight">{task.content}</h2>
              <p className="text-sm text-gray-500 mt-1">in list <span className="underline decoration-gray-300 font-medium text-gray-700">{columnTitle}</span></p>
            </div>
          </div>
          <button 
            onClick={handleSave} 
            className="p-2 hover:bg-gray-200/80 rounded-full transition-colors text-gray-500 absolute top-4 right-4"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-8 pb-8 flex flex-col md:flex-row gap-8">
          
          {/* Main Column */}
          <div className="flex-1 space-y-6">
            
            {/* Description */}
            <div>
              <div className="flex items-center gap-3 mb-3 text-gray-700 font-semibold">
                <AlignLeft size={20} />
                <h3>Description</h3>
              </div>
              <div className="ml-9">
                <textarea
                  className="w-full p-4 border-2 border-transparent bg-white shadow-sm rounded-md focus:border-blue-500 focus:ring-0 outline-none min-h-[120px] text-sm text-gray-700 transition-all placeholder:text-gray-400"
                  placeholder="Add a more detailed description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            {/* Subtasks */}
            <div>
              <div className="flex items-center justify-between mb-3 text-gray-700 font-semibold">
                <div className="flex items-center gap-3">
                  <CheckSquare size={20} />
                  <h3>Checklist</h3>
                </div>
                {subtasks.length > 0 && (
                   <button 
                     onClick={() => setSubtasks(subtasks.filter(t => !t.completed))}
                     className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded transition-colors"
                   >
                     Delete completed
                   </button>
                )}
              </div>
              
              <div className="ml-9">
                {/* Progress Bar */}
                {subtasks.length > 0 && (
                  <div className="mb-4 flex items-center gap-3">
                    <span className="text-xs text-gray-500 font-medium w-8">{progress}%</span>
                    <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Subtask List */}
                <div className="space-y-2 mb-3">
                  {subtasks.map(st => (
                    <div key={st.id} className="flex items-start gap-3 group hover:bg-gray-100 p-1.5 -mx-1.5 rounded transition-colors">
                      <input 
                        type="checkbox" 
                        checked={st.completed} 
                        onChange={() => toggleSubtask(st.id)}
                        className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className={`text-sm flex-1 break-words transition-all ${st.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                        {st.content}
                      </span>
                      <button 
                        onClick={() => deleteSubtask(st.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-0.5 transition-all"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Subtask Input */}
                <form onSubmit={handleAddSubtask} className="mt-2">
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 focus:bg-white border-2 border-transparent focus:border-blue-500 rounded text-sm outline-none transition-all placeholder:text-gray-500"
                    placeholder="Add an item..."
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                  />
                  {newSubtask && (
                    <div className="mt-2 flex items-center gap-2">
                      <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700">
                        Add
                      </button>
                      <button type="button" onClick={() => setNewSubtask('')} className="p-1.5 text-gray-500 hover:text-gray-700">
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="md:w-48 flex-shrink-0 space-y-6">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Actions</p>
              <button
                onClick={handleSave}
                className="w-full text-left px-3 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-md text-sm transition-colors mb-2"
              >
                Save
              </button>
            </div>
            
            <div className="text-xs text-gray-400 mt-8">
              <p>ID: {task.id.slice(0, 8)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};