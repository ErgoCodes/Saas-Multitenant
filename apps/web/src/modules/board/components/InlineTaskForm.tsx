import { Priority } from '@task-manager/types';
import { Button, Input, Textarea, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Label } from '@task-manager/ui';

interface InlineTaskFormProps {
  title: string;
  setTitle: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  priority: Priority;
  setPriority: (value: Priority) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export default function InlineTaskForm({
  title,
  setTitle,
  description,
  setDescription,
  priority,
  setPriority,
  loading,
  onSubmit,
  onCancel,
}: InlineTaskFormProps) {
  return (
    <form onSubmit={onSubmit} className="mt-3 space-y-3 rounded-xl bg-white p-4 shadow-sm">
      <div className="space-y-1.5">
        <Label htmlFor="task-title">Title</Label>
        <Input
          id="task-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
          autoFocus
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="task-desc">Description (optional)</Label>
        <Textarea
          id="task-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          rows={2}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Priority</Label>
        <Select value={priority} onValueChange={(value) => setPriority(value as Priority)}>
          <SelectTrigger>
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(Priority).map((p: string) => (
              <SelectItem key={p} value={p}>
                {p.charAt(0) + p.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" loading={loading}>
          Add Task
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
