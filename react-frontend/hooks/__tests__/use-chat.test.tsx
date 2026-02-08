import { renderHook, act } from '@testing-library/react'
import { useChat } from '../use-chat'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as api from '@/lib/api'

// Mock the API request
vi.mock('@/lib/api', () => ({
    apiRequest: vi.fn()
}))

describe('useChat', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    process.on('unhandledRejection', (reason) => {
        console.error('Unhandled Rejection at:', reason);
    });

    process.on('uncaughtException', (error) => {
        console.error('Uncaught Exception:', error);
    });

    it('should initialize with idle state', () => {
        const { result } = renderHook(() => useChat())
        expect(result.current.chatState.type).toBe('idle')
        expect(result.current.messages).toHaveLength(1)
        expect((result.current.messages[0].content as string)).toContain('Hello')
    })

    it('should transition to awaiting_quantity when item is provided without quantity', async () => {
        const { result } = renderHook(() => useChat())

        await act(async () => {
            await result.current.sendMessage('Buy a laptop')
        })

        expect(result.current.chatState.type).toBe('awaiting_quantity')
        if (result.current.chatState.type === 'awaiting_quantity') {
            expect(result.current.chatState.intent.intent.params.item).toBe('laptop')
        }
    })

    it('should transition to awaiting_confirmation when quantity is provided', async () => {
        const { result } = renderHook(() => useChat())

        // First step: Buy item
        await act(async () => {
            await result.current.sendMessage('Buy a laptop')
        })

        // Second step: Provide quantity
        await act(async () => {
            await result.current.sendMessage('2')
        })

        expect(result.current.chatState.type).toBe('awaiting_confirmation')
        if (result.current.chatState.type === 'awaiting_confirmation') {
            expect(result.current.chatState.quantity).toBe(2)
        }
    })
})
