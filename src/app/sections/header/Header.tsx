import Block from '@/components/block/Block';
import BlockExpandedContent from '@/components/block/content/BlockExpandedContent';
import BlockCollapseTrigger from '@/components/block/triggers/BlockCollapseTrigger';
import BlockExpandTrigger from '@/components/block/triggers/BlockExpandTrigger';
import * as motion from 'framer-motion/client';

export default function Header() {
  return (
    <Block className="p-6 col-span-6 aspect-auto flex flex-col">
      <nav className="flex">
        <BlockExpandTrigger asChild>
          <motion.h1 className="text-primary text-3xl font-black cursor-pointer" layout="position">
            Hugo Hsi
          </motion.h1>
        </BlockExpandTrigger>
      </nav>
      <BlockExpandedContent>
        hello world!<BlockCollapseTrigger>CLose!</BlockCollapseTrigger>
      </BlockExpandedContent>
    </Block>
  );
}
