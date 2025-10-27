import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0",
        className
      )}
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999
      }}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 grid w-full max-w-[calc(100%-2rem)] gap-6 duration-200 sm:max-w-lg",
          className
        )}
        style={{
          background: 'hsl(var(--celo-white))',
          border: 'var(--outline-thick)',
          padding: '2rem',
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10000,
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        {...props}
      >
        <div style={{
          position: 'absolute',
          top: '15px',
          left: '15px',
          width: '40px',
          height: '6px',
          background: 'hsl(var(--celo-yellow))'
        }}></div>
        
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="btn-industrial"
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'hsl(var(--celo-black))',
              color: 'hsl(var(--celo-white))',
              border: 'var(--outline-thin)',
              padding: '0.5rem 0.8rem',
              fontSize: '0.8rem',
              fontFamily: 'var(--font-body)',
              fontWeight: 'var(--font-weight-body-black)',
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              cursor: 'pointer',
              transition: 'var(--transition-fast)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'hsl(var(--celo-yellow))';
              e.currentTarget.style.color = 'hsl(var(--celo-black))';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'hsl(var(--celo-black))';
              e.currentTarget.style.color = 'hsl(var(--celo-white))';
            }}
          >
            CLOSE
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-headline-thin", className)}
      style={{
        fontSize: 'clamp(1.5rem, 4vw, 2rem)',
        fontFamily: 'var(--font-headline)',
        fontWeight: 'var(--font-weight-headline-thin)',
        letterSpacing: '-0.02em',
        textTransform: 'uppercase',
        color: 'hsl(var(--celo-black))',
        marginBottom: '1rem'
      }}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-body-heavy", className)}
      style={{
        fontSize: '0.9rem',
        fontFamily: 'var(--font-body)',
        fontWeight: 'var(--font-weight-body-heavy)',
        color: 'hsl(var(--celo-brown))',
        textTransform: 'uppercase',
        letterSpacing: '0.01em',
        lineHeight: '1.4'
      }}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
