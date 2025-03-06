'use client'

import React, { ReactNode } from 'react'
import ContextProvider from '@/context'

export function ModalProvider({ children }: { children: ReactNode }) {
  return (
    <ContextProvider cookies={null}>
      {children}
    </ContextProvider>
  )
}