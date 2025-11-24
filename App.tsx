import React, { useState, useEffect, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
  DropAnimation,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Board, Task, Column as ColumnType } from './types';
import { Column } from './components/Column';
import { TaskCard } from './components/TaskCard';
import { TaskModal } from './components/TaskModal';
import { createPortal } from 'react-dom';
import { Plus, Trello, Search, ArrowLeft, X, Edit2, Trash2, Loader2, WifiOff, Cloud, Check, AlertCircle } from 'lucide-react';

// Backend API URL
const API_URL = 'http://localhost:5000/api/boards';

export default function App() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Save Status for UX
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  const [currentBoardId, setCurrentBoardId] = useState<string | null>(null);
  const [activeDragItem, setActiveDragItem] = useState<ColumnType | Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // List Creation State
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");

  // Board Management State
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState("");

  const currentBoard = useMemo(() => 
    boards.find(b => b.id === currentBoardId), 
  [boards, currentBoardId]);

  // --- API Functions ---

  const fetchBoards = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Failed to fetch boards');
      const data = await response.json();
      setBoards(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Could not connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  const saveBoardToBackend = async (board: Board) => {
    try {
      setSaveStatus('saving');
      const res = await fetch(`${API_URL}/${board.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(board)
      });
      if (!res.ok) throw new Error("Failed to save");
      
      setSaveStatus('saved');
      // Clear saved status after 3 seconds
      setTimeout(() => setSaveStatus(prev => prev === 'saved' ? 'idle' : prev), 3000);
    } catch (err) {
      console.error("Failed to save board:", err);
      setSaveStatus('error');
    }
  };

  const deleteBoardFromBackend = async (id: string) => {
    try {
      setSaveStatus('saving');
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      setSaveStatus('idle');
    } catch (err) {
      console.error("Failed to delete board:", err);
      setSaveStatus('error');
    }
  };

  const createBoardInBackend = async (board: Board) => {
    try {
      setSaveStatus('saving');
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(board)
      });
      if (!res.ok) throw new Error("Failed to create");
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(prev => prev === 'saved' ? 'idle' : prev), 3000);
    } catch (err) {
      console.error("Failed to create board:", err);
      setSaveStatus('error');
    }
  };

  // Initial Load
  useEffect(() => {
    fetchBoards();
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }, 
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // --- Actions ---

  const createBoard = async () => {
    const newBoard: Board = {
      id: crypto.randomUUID(),
      title: `Project ${boards.length + 1}`,
      columnOrder: [],
      columns: {},
      tasks: {}
    };
    
    // Optimistic Update
    setBoards([...boards, newBoard]);
    setCurrentBoardId(newBoard.id);
    
    // API Call
    await createBoardInBackend(newBoard);
  };

  const handleDeleteBoard = (e: React.MouseEvent, boardId: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      // Optimistic Update
      setBoards(boards.filter(b => b.id !== boardId));
      if (currentBoardId === boardId) setCurrentBoardId(null);
      
      // API Call
      deleteBoardFromBackend(boardId);
    }
  };

  const handleStartRename = (e: React.MouseEvent, board: Board) => {
    e.stopPropagation();
    setEditingBoardId(board.id);
    setRenameTitle(board.title);
  };

  const handleSaveRename = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (editingBoardId && renameTitle.trim()) {
      const updatedBoards = boards.map(b => b.id === editingBoardId ? { ...b, title: renameTitle } : b);
      setBoards(updatedBoards);
      
      const boardToUpdate = updatedBoards.find(b => b.id === editingBoardId);
      if (boardToUpdate) saveBoardToBackend(boardToUpdate);

      setEditingBoardId(null);
      setRenameTitle("");
    }
  };

  const handleCancelRename = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    setEditingBoardId(null);
    setRenameTitle("");
  };

  const handleCreateColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBoard || !newColumnTitle.trim()) return;

    const newColId = crypto.randomUUID();
    const newCol: ColumnType = { id: newColId, title: newColumnTitle, taskIds: [] };
    
    const updatedBoard = {
      ...currentBoard,
      columns: { ...currentBoard.columns, [newColId]: newCol },
      columnOrder: [...currentBoard.columnOrder, newColId]
    };
    
    updateBoard(updatedBoard);
    setNewColumnTitle("");
    setIsAddingColumn(false);
  };

  const createTask = (columnId: string, content: string) => {
    if (!currentBoard) return;
    const taskId = crypto.randomUUID();
    const newTask: Task = { id: taskId, content };
    
    const column = currentBoard.columns[columnId];
    const updatedBoard = {
      ...currentBoard,
      tasks: { ...currentBoard.tasks, [taskId]: newTask },
      columns: {
        ...currentBoard.columns,
        [columnId]: { ...column, taskIds: [...column.taskIds, taskId] }
      }
    };
    updateBoard(updatedBoard);
  };

  const updateTask = (updatedTask: Task) => {
    if (!currentBoard) return;
    updateBoard({
      ...currentBoard,
      tasks: { ...currentBoard.tasks, [updatedTask.id]: updatedTask }
    });
  };

  const updateBoard = (updatedBoard: Board) => {
    // Optimistic Update
    setBoards(boards.map(b => b.id === updatedBoard.id ? updatedBoard : b));
    
    // API Call
    saveBoardToBackend(updatedBoard);
  };

  const deleteColumn = (colId: string) => {
    if(!currentBoard) return;
    const newCols = { ...currentBoard.columns };
    delete newCols[colId];
    const newOrder = currentBoard.columnOrder.filter(id => id !== colId);
    updateBoard({ ...currentBoard, columns: newCols, columnOrder: newOrder });
  };

  // --- Drag & Drop Handlers ---

  const onDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === "Column") {
      setActiveDragItem(event.active.data.current.column);
    } else if (event.active.data.current?.type === "Task") {
      setActiveDragItem(event.active.data.current.task);
    }
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === "Task";
    const isOverTask = over.data.current?.type === "Task";
    
    if (!isActiveTask) return;

    if (!currentBoard) return;

    const activeColumnId = Object.keys(currentBoard.columns).find(key => 
      currentBoard.columns[key].taskIds.includes(activeId as string)
    );
    
    let overColumnId: string | undefined;
    if (isOverTask) {
        overColumnId = Object.keys(currentBoard.columns).find(key => 
          currentBoard.columns[key].taskIds.includes(overId as string)
        );
    } else {
        overColumnId = overId as string;
    }

    if (!activeColumnId || !overColumnId || activeColumnId === overColumnId) return;

    const activeColumn = currentBoard.columns[activeColumnId];
    const overColumn = currentBoard.columns[overColumnId];

    const updatedActiveColumn = {
        ...activeColumn,
        taskIds: activeColumn.taskIds.filter(id => id !== activeId)
    };

    const updatedOverColumn = {
        ...overColumn,
        taskIds: [...overColumn.taskIds, activeId as string]
    };

    // We do NOT save to backend on DragOver (too frequent), only update local state
    setBoards(prevBoards => {
       const board = prevBoards.find(b => b.id === currentBoardId)!;
       const activeCol = board.columns[activeColumnId];
       const overCol = board.columns[overColumnId!];

       const newActiveTaskIds = activeCol.taskIds.filter(id => id !== activeId);
       
       const newOverTaskIds = [...overCol.taskIds];
       const overIndex = over.data.current?.sortable?.index ?? newOverTaskIds.length;
       
       if (!newOverTaskIds.includes(activeId as string)) {
          if(isOverTask) {
             newOverTaskIds.splice(overIndex, 0, activeId as string);
          } else {
             newOverTaskIds.push(activeId as string);
          }
       }

       return prevBoards.map(b => {
          if (b.id !== currentBoardId) return b;
          return {
             ...b,
             columns: {
               ...b.columns,
               [activeColumnId]: { ...activeCol, taskIds: newActiveTaskIds },
               [overColumnId!]: { ...overCol, taskIds: newOverTaskIds }
             }
          }
       });
    });
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveDragItem(null);
    const { active, over } = event;
    if (!over || !currentBoard) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveColumn = active.data.current?.type === "Column";

    let updatedBoard = currentBoard;

    if (isActiveColumn) {
        const oldIndex = currentBoard.columnOrder.indexOf(activeId as string);
        const newIndex = currentBoard.columnOrder.indexOf(overId as string);
        updatedBoard = {
            ...currentBoard,
            columnOrder: arrayMove(currentBoard.columnOrder, oldIndex, newIndex)
        };
    } else {
        const activeColumnId = Object.keys(currentBoard.columns).find(key => 
          currentBoard.columns[key].taskIds.includes(activeId as string)
        );
        const overColumnId = Object.keys(currentBoard.columns).find(key => 
            currentBoard.columns[key].taskIds.includes(overId as string)
        );
        
        // This handles reordering within the SAME column.
        if (activeColumnId && activeColumnId === overColumnId) {
             const column = currentBoard.columns[activeColumnId];
             const oldIndex = column.taskIds.indexOf(activeId as string);
             const newIndex = column.taskIds.indexOf(overId as string);
             
             updatedBoard = {
                 ...currentBoard,
                 columns: {
                     ...currentBoard.columns,
                     [activeColumnId]: {
                         ...column,
                         taskIds: arrayMove(column.taskIds, oldIndex, newIndex)
                     }
                 }
             };
        } else {
            // Because onDragOver updates state for cross-column, 
            // we grab the freshest version of the board from state to save it.
            const freshBoard = boards.find(b => b.id === currentBoardId);
            if(freshBoard) {
                saveBoardToBackend(freshBoard);
                return; 
            }
        }
    }
    
    updateBoard(updatedBoard);
  };

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  };

  // --- Render ---

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#111] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500 w-12 h-12" />
        <p className="text-white ml-4 font-medium">Loading MyTrello...</p>
      </div>
    );
  }

  if (error && boards.length === 0) {
    return (
      <div className="min-h-screen bg-[#111] flex flex-col items-center justify-center p-4 text-center">
         <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
            <WifiOff className="text-red-500 w-8 h-8" />
         </div>
         <h2 className="text-2xl font-bold text-white mb-2">Connection Failed</h2>
         <p className="text-gray-400 mb-8 max-w-md">{error}</p>
         <button 
           onClick={fetchBoards}
           className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
         >
           Try Again
         </button>
      </div>
    );
  }

  if (!currentBoardId || !currentBoard) {
    return (
      <div className="min-h-screen bg-[#111] flex flex-col items-center py-20 px-4 relative overflow-hidden">
        {/* Abstract Background Accents */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px]" />
        </div>

        <div className="w-full max-w-5xl relative z-10">
           <div className="flex items-center justify-center gap-4 mb-16 text-white">
             <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20">
                <Trello size={40} className="text-white" />
             </div>
             <h1 className="text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">MyTrello</h1>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <button 
                onClick={createBoard}
                className="h-40 rounded-xl border border-dashed border-gray-700 hover:border-blue-500 hover:bg-gray-800/50 flex flex-col items-center justify-center text-gray-400 hover:text-white transition-all group"
              >
                 <Plus size={32} className="mb-3 group-hover:scale-110 transition-transform" />
                 <span className="font-medium">Create New Board</span>
              </button>

              {boards.map(b => (
                <div 
                  key={b.id} 
                  onClick={() => setCurrentBoardId(b.id)}
                  className="h-40 bg-gray-800 rounded-xl p-6 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10 border border-gray-700 hover:border-gray-600 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                >
                   {editingBoardId === b.id ? (
                     <div className="flex flex-col h-full justify-center gap-3 animate-in fade-in" onClick={e => e.stopPropagation()}>
                        <input 
                          autoFocus
                          value={renameTitle}
                          onChange={(e) => setRenameTitle(e.target.value)}
                          className="bg-gray-900/50 border border-blue-500 text-white text-lg font-bold rounded px-2 py-1 outline-none w-full placeholder-gray-600"
                          placeholder="Project Name"
                          onClick={e => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if(e.key === 'Enter') handleSaveRename(e);
                            if(e.key === 'Escape') handleCancelRename(e);
                          }}
                        />
                        <div className="flex gap-2">
                          <button onClick={handleSaveRename} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs py-1.5 rounded font-medium transition-colors">Save</button>
                          <button onClick={handleCancelRename} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-xs py-1.5 rounded font-medium transition-colors">Cancel</button>
                        </div>
                     </div>
                   ) : (
                     <>
                       <div className="flex justify-between items-start">
                         <h3 className="font-bold text-white text-xl truncate pr-16">{b.title}</h3>
                         
                         <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                           <button 
                             onClick={(e) => handleStartRename(e, b)}
                             className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                             title="Rename Board"
                           >
                             <Edit2 size={16} />
                           </button>
                           <button 
                             onClick={(e) => handleDeleteBoard(e, b.id)}
                             className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                             title="Delete Board"
                           >
                             <Trash2 size={16} />
                           </button>
                         </div>
                       </div>
                       <span className="text-xs text-gray-400 font-medium">
                         {Object.keys(b.tasks).length} Tasks
                       </span>
                     </>
                   )}
                </div>
              ))}
           </div>
        </div>
      </div>
    );
  }

  // --- Board View ---

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden text-slate-900">
        {/* Navbar */}
        <nav className="h-16 bg-white/5 backdrop-blur-md flex items-center px-6 justify-between border-b border-white/5 shrink-0 z-10">
           <div className="flex items-center gap-6">
              <button 
                onClick={() => setCurrentBoardId(null)} 
                className="text-white/60 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
              >
                 <ArrowLeft size={20} />
              </button>
              <div className="flex items-baseline gap-3">
                <h1 className="text-xl font-bold text-white tracking-tight">{currentBoard.title}</h1>
              </div>
           </div>
           
           <div className="flex items-center gap-4">
              {/* Save Status Indicator */}
              {saveStatus === 'saving' && (
                <div className="flex items-center gap-2 text-blue-300 text-xs font-medium animate-pulse">
                  <Loader2 size={14} className="animate-spin" />
                  <span className="hidden sm:inline">Saving...</span>
                </div>
              )}
              {saveStatus === 'saved' && (
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium animate-in fade-in slide-in-from-top-1 duration-300">
                  <Cloud size={14} />
                  <span className="hidden sm:inline">Saved to Cloud</span>
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="flex items-center gap-2 text-red-400 text-xs font-medium">
                  <AlertCircle size={14} />
                  <span className="hidden sm:inline">Sync Error</span>
                </div>
              )}

              <div className="w-px h-6 bg-white/10 mx-2" />

              <div className="relative group">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-blue-400 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search tasks..." 
                  className="bg-black/20 text-white text-sm pl-9 pr-4 py-2 rounded-lg border border-white/5 focus:border-blue-500/50 focus:bg-black/40 focus:outline-none placeholder-white/30 w-56 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
           </div>
        </nav>

        {/* Board Canvas */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center bg-no-repeat relative">
           <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" /> {/* Overlay for readability */}
           
           <div className="h-full flex px-6 pb-4 pt-8 gap-6 w-max mx-auto md:mx-0 relative z-0">
             <SortableContext items={currentBoard.columnOrder} strategy={horizontalListSortingStrategy}>
               {currentBoard.columnOrder.map(colId => {
                 const column = currentBoard.columns[colId];
                 const tasks = column.taskIds.map(id => currentBoard.tasks[id]).filter(t => 
                   t.content.toLowerCase().includes(searchQuery.toLowerCase())
                 );
                 return (
                   <Column 
                     key={colId} 
                     column={column} 
                     tasks={tasks}
                     onTaskClick={(t) => setSelectedTask(t)}
                     onAddTask={createTask}
                     onDeleteColumn={deleteColumn}
                   />
                 );
               })}
             </SortableContext>
             
             {/* Add List Section */}
             <div className="w-[272px] flex-shrink-0">
               {isAddingColumn ? (
                 <form onSubmit={handleCreateColumn} className="bg-[#f1f2f4] p-3 rounded-xl shadow-lg border border-white/20 animate-in fade-in zoom-in-95 duration-200">
                   <input
                     autoFocus
                     className="w-full px-3 py-2 text-sm rounded-md border-2 border-blue-500 focus:outline-none mb-2"
                     placeholder="Enter list title..."
                     value={newColumnTitle}
                     onChange={(e) => setNewColumnTitle(e.target.value)}
                   />
                   <div className="flex items-center gap-2">
                     <button
                       type="submit"
                       className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors shadow-sm"
                     >
                       Add list
                     </button>
                     <button
                       type="button"
                       onClick={() => setIsAddingColumn(false)}
                       className="p-1.5 text-gray-500 hover:bg-gray-300 rounded"
                     >
                       <X size={20} />
                     </button>
                   </div>
                 </form>
               ) : (
                 <button
                   onClick={() => setIsAddingColumn(true)}
                   className="w-full h-[50px] bg-white/20 hover:bg-white/30 rounded-xl flex items-center gap-2 px-4 text-white font-medium backdrop-blur-md transition-all shadow-lg border border-white/10 active:scale-95"
                 >
                   <Plus size={20} />
                   Add another list
                 </button>
               )}
             </div>
           </div>
        </div>
      </div>

      {createPortal(
        <DragOverlay dropAnimation={dropAnimation}>
          {activeDragItem && (
             'taskIds' in activeDragItem ? (
               <Column 
                 column={activeDragItem} 
                 tasks={activeDragItem.taskIds.map((id:string) => currentBoard.tasks[id])} 
                 onTaskClick={() => {}} 
                 onAddTask={() => {}}
                 onDeleteColumn={() => {}}
               />
             ) : (
               <TaskCard task={activeDragItem} onClick={() => {}} />
             )
          )}
        </DragOverlay>,
        document.body
      )}

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          columnTitle={Object.values(currentBoard.columns).find(c => c.taskIds.includes(selectedTask.id))?.title || "List"}
          onClose={() => setSelectedTask(null)}
          onUpdate={updateTask}
        />
      )}
    </DndContext>
  );
}