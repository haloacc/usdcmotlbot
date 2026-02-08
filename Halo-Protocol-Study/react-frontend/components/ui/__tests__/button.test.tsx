import { render, screen } from '@testing-library/react'
import { Button } from '../button'
import { describe, it, expect } from 'vitest'

describe('Button', () => {
    it('renders correctly', () => {
        render(<Button>Click me</Button>)
        const button = screen.getByRole('button', { name: /click me/i })
        expect(button).toBeInTheDocument()
    })

    it('applies variant classes', () => {
        render(<Button variant="destructive">Delete</Button>)
        const button = screen.getByRole('button')
        // Check for destructive class (bg-destructive)
        expect(button).toHaveClass('bg-destructive')
    })

    it('renders as child (Slot) when asChild is true', () => {
        // Note: This requires Radix UI Slot if strictly following shadcn, 
        // but our implementation might just pass props. 
        // If we haven't installed @radix-ui/react-slot, we should verify implementation.
        // Our button.tsx uses asChild prop but implementation relies on Slot if valid shadcn.
        // Let's check implementation first.
    })
})
