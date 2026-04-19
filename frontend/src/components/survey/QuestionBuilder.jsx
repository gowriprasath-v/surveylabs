import { useState } from 'react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ToggleSwitch from '../ui/ToggleSwitch';
import { Trash2, GripVertical, Settings2, Plus, CornerDownRight } from 'lucide-react';

function SortableQuestion({ q, idx, updateQuestion, removeQuestion, addOption, removeOption, handleOptionChange, questions }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: q.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  const [showLogic, setShowLogic] = useState(false);

  const renderTypePills = () => {
    const types = [
      { id: 'mcq', label: 'Choices' },
      { id: 'rating', label: 'Rating' },
      { id: 'text_short', label: 'Text' },
      { id: 'scale', label: 'Scale' },
      { id: 'date', label: 'Date' }
    ];

    return (
      <div className="flex items-center gap-1 p-1 bg-surface-2/50 rounded-lg border border-white/5 overflow-x-auto custom-scrollbar max-w-full">
        {types.map((t) => {
          const isSel = q.type === t.id || (t.id === 'text_short' && q.type.includes('text'));
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                const updates = { type: t.id };
                if (t.id === 'mcq' && (!q.options || q.options.length < 2)) {
                  updates.options = ['', ''];
                }
                updateQuestion(idx, updates);
              }}
              className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all shrink-0 ${
                isSel ? 'bg-primary text-white shadow-glow border border-primary/20' : 'text-text-2 hover:text-text-1 transparent'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div ref={setNodeRef} style={style} className={`relative glass-panel rounded-xl mb-4 transition-all duration-300 ${isDragging ? 'shadow-2xl border-primary scale-105 opacity-90' : 'hover:border-white/20'}`}>
      
      <div className="flex">
        {/* Drag Handle */}
        <div 
          {...attributes} 
          {...listeners} 
          className="w-10 flex flex-col items-center justify-start pt-6 border-r border-white/5 bg-surface-2/30 cursor-grab active:cursor-grabbing rounded-l-xl text-text-2/50 hover:text-primary hover:bg-white/5 transition-colors"
        >
          <GripVertical size={16} />
          <span className="text-[10px] font-bold mt-2 opacity-50">{idx + 1}</span>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 md:p-6 min-w-0">
          <div className="flex flex-col xl:flex-row xl:items-start gap-4 mb-6">
            <div className="flex-1 space-y-4 min-w-0">
              <input
                type="text"
                placeholder="Type your question..."
                value={q.label}
                onChange={(e) => updateQuestion(idx, { label: e.target.value })}
                className="w-full text-lg lg:text-xl font-bold outline-none !bg-transparent !border-t-0 !border-l-0 !border-r-0 !rounded-none focus:ring-0 !shadow-none border-b border-transparent focus:border-primary py-2 transition-all placeholder:text-white/20 placeholder:font-normal text-text-1 focus:shadow-[0_2px_0_rgba(99,102,241,0.2)]"
              />
              <div className="flex flex-wrap items-center gap-4">
                {renderTypePills()}
                <div className="h-4 w-px bg-white/10 hidden sm:block" />
                <ToggleSwitch 
                  label="Required" 
                  checked={q.required === 1 || q.required === true} 
                  onChange={(c) => updateQuestion(idx, { required: c })} 
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                className={`p-2 rounded-lg transition-colors border ${showLogic ? 'bg-accent/20 text-accent border-accent/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'text-text-2 bg-surface-2 border-transparent hover:bg-white/5'}`}
                onClick={() => setShowLogic(!showLogic)}
                title="Branching Logic"
              >
                <Settings2 size={16} />
              </button>
              <button
                type="button"
                className="p-2 text-text-2 hover:text-danger hover:bg-danger/10 rounded-lg bg-surface-2 border border-transparent transition-colors"
                onClick={() => removeQuestion(idx)}
                title="Delete Question"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {/* Options / Formats */}
          {q.type === 'mcq' && (
            <div className="space-y-2 mt-4 ml-1 pl-3 border-l-2 border-white/5">
              {q.options?.map((opt, oIdx) => (
                <div key={oIdx} className="flex items-center gap-3 group">
                  <div className="w-4 h-4 rounded-full border-2 border-text-2/40 group-hover:border-primary transition-colors shrink-0" />
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, oIdx, e.target.value)}
                      className="flex-1 text-sm outline-none px-4 py-2.5 border border-transparent focus:border-primary focus:shadow-[0_0_0_2px_rgba(99,102,241,0.2)] bg-surface rounded-lg transition-all hover:bg-surface-2 text-text-1"
                      placeholder={`Option ${oIdx + 1}`}
                    />
                  {q.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(idx, oIdx)}
                      className="p-2 text-text-2 hover:text-danger opacity-0 group-hover:opacity-100 transition-all rounded-md hover:bg-danger/10"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <div className="flex items-center gap-3 pt-2">
                <div className="w-4 h-4 shrink-0" />
                <button
                  type="button"
                  onClick={() => addOption(idx)}
                  className="text-sm font-semibold text-primary hover:text-primary-hover flex items-center gap-1 transition-colors"
                >
                  <Plus size={14} /> Add Option
                </button>
              </div>
            </div>
          )}

          {/* Logic Panel Visualizer */}
          {showLogic && (
            <div className="mt-6 pt-4 border-t border-white/5 animate-fade-in">
              <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 shadow-[inset_0_0_20px_rgba(245,158,11,0.05)]">
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent mb-4">
                  <CornerDownRight size={14} /> Branching Logic Rules
                </h4>
                
                <div className="space-y-3">
                  {(q.logic_rules || []).map((rule, rIdx) => (
                    <div key={rIdx} className="flex flex-wrap md:flex-nowrap items-center gap-2 text-xs xl:text-sm bg-surface p-2.5 rounded-lg border border-accent/20 shadow-sm">
                      <span className="font-semibold text-text-2">IF Answer</span>
                      <select 
                        className="bg-surface-2 border border-white/10 rounded px-2 py-1 outline-none text-text-1 focus:border-accent"
                        value={rule.operator || 'equals'}
                        onChange={(e) => {
                          const newRules = [...(q.logic_rules || [])];
                          newRules[rIdx] = { ...rule, operator: e.target.value };
                          updateQuestion(idx, { logic_rules: newRules });
                        }}
                      >
                        <option value="equals">is exactly</option>
                        <option value="contains">contains</option>
                      </select>
                      <input 
                        type="text"
                        placeholder="value..."
                        value={rule.value || ''}
                        onChange={(e) => {
                          const newRules = [...(q.logic_rules || [])];
                          newRules[rIdx] = { ...rule, value: e.target.value };
                          updateQuestion(idx, { logic_rules: newRules });
                        }}
                        className="bg-surface-2 border border-white/10 rounded px-2 py-1 outline-none text-text-1 w-24 focus:border-accent"
                      />
                      <span className="font-semibold text-text-2 ml-0 md:ml-2">THEN Skip To</span>
                      <select 
                        className="bg-surface-2 border border-white/10 rounded px-2 py-1 outline-none text-text-1 focus:border-accent flex-1"
                        value={rule.target_id || ''}
                        onChange={(e) => {
                          const newRules = [...(q.logic_rules || [])];
                          newRules[rIdx] = { ...rule, target_id: e.target.value };
                          updateQuestion(idx, { logic_rules: newRules });
                        }}
                      >
                        <option value="">End Survey</option>
                        {questions.map((targetQ, targetIdx) => (
                          targetIdx > idx && <option key={targetQ.id} value={targetQ.id}>Q{targetIdx + 1}</option>
                        ))}
                      </select>
                      <button 
                        onClick={() => {
                          const newRules = [...(q.logic_rules || [])];
                          newRules.splice(rIdx, 1);
                          updateQuestion(idx, { logic_rules: newRules });
                        }}
                        className="ml-auto text-text-2 hover:text-danger hover:bg-danger/10 p-1.5 rounded transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={() => {
                      const newRules = [...(q.logic_rules || []), { operator: 'equals', value: '', target_id: '' }];
                      updateQuestion(idx, { logic_rules: newRules });
                    }}
                    className="text-xs font-semibold text-accent hover:text-white flex items-center gap-1 bg-accent/10 hover:bg-accent focus:ring focus:ring-accent/50 px-3 py-2 rounded-lg transition-all w-fit mt-2"
                  >
                    <Plus size={14} /> Add Logic Condition
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function QuestionBuilder({ questions, onChange }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      const oldIndex = questions.findIndex((q) => q.id === active.id);
      const newIndex = questions.findIndex((q) => q.id === over.id);
      onChange(arrayMove(questions, oldIndex, newIndex));
    }
  };

  const addQuestion = () => {
    onChange([
      ...questions,
      {
        id: crypto.randomUUID(),
        label: '',
        type: 'mcq',
        required: true,
        options: ['', ''],
        logic_rules: []
      }
    ]);
  };

  const updateQuestion = (index, updates) => {
    const nextQ = [...questions];
    nextQ[index] = { ...nextQ[index], ...updates };
    onChange(nextQ);
  };

  const removeQuestion = (index) => {
    onChange(questions.filter((_, i) => i !== index));
  };

  const handleOptionChange = (qIndex, oIndex, val) => {
    const q = questions[qIndex];
    const newOpts = [...q.options];
    newOpts[oIndex] = val;
    updateQuestion(qIndex, { options: newOpts });
  };

  const addOption = (qIndex) => {
    const q = questions[qIndex];
    updateQuestion(qIndex, { options: [...q.options, ''] });
  };

  const removeOption = (qIndex, oIndex) => {
    const q = questions[qIndex];
    if (q.options.length <= 2) return; 
    updateQuestion(qIndex, { options: q.options.filter((_, i) => i !== oIndex) });
  };

  if(!questions || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 glass-panel rounded-xl text-center border-dashed border-white/20 mt-4 h-64">
        <h2 className="text-xl font-display font-semibold text-text-1 mb-2">Build your canvas</h2>
        <p className="text-sm text-text-2 mb-6">Click below to add your first question.</p>
        <button
          onClick={addQuestion}
          className="px-5 py-2.5 bg-primary text-white font-bold text-sm rounded-lg hover:bg-primary-hover transition-colors shadow-glow flex items-center gap-2"
        >
          <Plus size={16} /> Add First Question
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center gap-3 my-6">
        <h2 className="text-xl font-display font-semibold text-text-1">Questions Array</h2>
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs font-bold text-text-2/50 uppercase tracking-widest">{questions.length} active nodes</span>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
          {questions.map((q, idx) => (
            <SortableQuestion 
              key={q.id} 
              q={q} 
              idx={idx} 
              updateQuestion={updateQuestion} 
              removeQuestion={removeQuestion} 
              addOption={addOption} 
              removeOption={removeOption} 
              handleOptionChange={handleOptionChange} 
              questions={questions}
            />
          ))}
        </SortableContext>
      </DndContext>

      <div className="flex justify-center mt-6">
        <button
          onClick={addQuestion}
          className="px-5 py-2.5 border-2 border-dashed border-white/20 hover:border-primary text-text-2 hover:text-primary font-bold text-sm rounded-xl transition-all flex items-center gap-2 w-full justify-center"
        >
          <Plus size={16} /> Add Another Question
        </button>
      </div>
    </div>
  );
}
