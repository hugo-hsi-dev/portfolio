'use client';

import { createContext, Dispatch, ProviderProps, SetStateAction, useContext } from 'react';

type BlockContextType = {
  isExpanded: boolean;
  setIsExpanded: Dispatch<SetStateAction<boolean>>;
  isHighlighted: boolean;
  setIsHighlighted: Dispatch<SetStateAction<boolean>>;
};

const BlockContext = createContext<BlockContextType | null>(null);

export function useBlockContext() {
  const context = useContext(BlockContext);
  if (!context) {
    throw new Error('Block primitives can only be used inside of Block Context Provider');
  }
  return context;
}

type BlockProviderProps = ProviderProps<BlockContextType>;

export default function BlockProvider({ ...props }: BlockProviderProps) {
  return <BlockContext.Provider {...props} />;
}
