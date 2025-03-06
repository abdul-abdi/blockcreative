'use client'

import React, { ReactNode } from 'react'
import ContextProvider, { appKitModal } from '@/context'

export function ModalProvider({ children }: { children: ReactNode }) {
  return (
    <ContextProvider cookies={null}>
      {children}
    </ContextProvider>
  )
}

// Export the modal for use in other components
export { appKitModal }