'use client';

import {
  createContext,
  Dispatch,
  ProviderProps,
  SetStateAction,
  useContext,
  useState,
} from 'react';

type BlockIsHighlightedContextType = {
  isHighlighted: boolean;
  setIsHighlighted: Dispatch<SetStateAction<boolean>>;
};

const BlockIsHighlightedContext = createContext<BlockIsHighlightedContextType | null>(null);

export function useBlockIsHighlightedContext() {
  const context = useContext(BlockIsHighlightedContext);
  if (!context) {
    throw new Error('Block primitives can only be used inside of Block Context Provider');
  }
  return context;
}

type BlockProviderProps = Omit<ProviderProps<BlockIsHighlightedContextType>, 'value'>;

export default function BlockIsHighlightedProvider({ ...props }: BlockProviderProps) {
  const [isHighlighted, setIsHighlighted] = useState(false);

  return (
    <BlockIsHighlightedContext.Provider value={{ isHighlighted, setIsHighlighted }} {...props} />
  );
}
