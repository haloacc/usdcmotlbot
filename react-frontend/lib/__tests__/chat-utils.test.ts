import { describe, it, expect } from 'vitest'
import { parseNaturalLanguageToUCP } from '../chat-utils'

describe('parseNaturalLanguageToUCP', () => {
    it('should parse basic buy intent', () => {
        const result = parseNaturalLanguageToUCP('Buy a laptop')
        expect(result).not.toBeNull()
        expect(result!.intent.action).toBe('buy')
        expect(result!.intent.params.item).toBe('laptop')
    })

    it('should parse amount and currency', () => {
        const result = parseNaturalLanguageToUCP('Order a desk for 500 dollars')
        expect(result).not.toBeNull()
        expect(result!.intent.params.item).toBe('desk')
        expect(result!.intent.params.amount).toBe(500)
        expect(result!.intent.params.currency).toBe('USD')
    })

    it('should detect express shipping', () => {
        const result = parseNaturalLanguageToUCP('Buy shoes for $50 with express shipping')
        expect(result).not.toBeNull()
        expect(result!.intent.params.shipping_speed).toBe('express')
    })

    it('should handle currency symbols', () => {
        const result = parseNaturalLanguageToUCP('Buy a book for €20')
        expect(result).not.toBeNull()
        expect(result!.intent.params.amount).toBe(20)
        expect(result!.intent.params.currency).toBe('EUR')
    })

    it('should return null for non-buy intents', () => {
        const result = parseNaturalLanguageToUCP('How are you today?')
        expect(result).toBeNull()
    })
})
