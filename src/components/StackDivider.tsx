import { Separator } from '@/components/ui/separator';
import { Project, Skill } from '@/payload-types';

export default function StackDivider({ stack }: { stack: Project['stack'] }) {
  return (
    <div className="flex items-center gap-2 -my-3">
      <Separator className="flex-1" />
      {stack.map(({ technology, id }) => (
        <div key={id}>{(technology as Skill).name}</div>
      ))}
      <Separator className="flex-1" />
    </div>
  );
}
