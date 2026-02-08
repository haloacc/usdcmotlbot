import { describe, it, expect } from 'vitest'
import { CardValidator } from '../validators'

describe('CardValidator', () => {
    describe('luhnCheck', () => {
        it('should return true for valid card numbers', () => {
            // Valid Visa
            expect(CardValidator.luhnCheck('4242424242424242')).toBe(true)
        })

        it('should return false for invalid card numbers', () => {
            expect(CardValidator.luhnCheck('4242424242424241')).toBe(false)
        })
    })

    describe('detectBrand', () => {
        it('should detect Visa', () => {
            expect(CardValidator.detectBrand('4111111111111').brand).toBe('visa')
        })

        it('should detect Mastercard', () => {
            expect(CardValidator.detectBrand('5100000000000000').brand).toBe('mastercard')
        })

        it('should detect Amex', () => {
            expect(CardValidator.detectBrand('340000000000000').brand).toBe('amex')
        })

        it('should return unknown for other brands', () => {
            expect(CardValidator.detectBrand('0000000000000000').brand).toBe('unknown')
        })
    })

    describe('validateExpiry', () => {
        it('should return true for future dates', () => {
            expect(CardValidator.validateExpiry(12, 2030)).toBe(true)
        })

        it('should return false for past dates', () => {
            expect(CardValidator.validateExpiry(1, 2020)).toBe(false)
        })

        it('should return false for invalid months', () => {
            expect(CardValidator.validateExpiry(13, 2030)).toBe(false)
        })
    })
})
