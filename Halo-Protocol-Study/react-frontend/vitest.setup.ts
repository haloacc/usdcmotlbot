import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Phosphor Icons
vi.mock('@phosphor-icons/react', () => ({
    ChatCircleText: () => 'ChatCircleText',
    ShoppingBag: () => 'ShoppingBag',
    SquaresFour: () => 'SquaresFour',
    ClockCounterClockwise: () => 'ClockCounterClockwise',
    Gear: () => 'Gear',
    Plus: () => 'Plus',
    SignOut: () => 'SignOut',
    CheckCircle: () => 'CheckCircle',
    XCircle: () => 'XCircle',
    Info: () => 'Info',
    ShieldCheck: () => 'ShieldCheck',
    Truck: () => 'Truck',
    CreditCard: () => 'CreditCard',
    Calendar: () => 'Calendar',
    ArrowRight: () => 'ArrowRight',
    CircleNotch: () => 'CircleNotch',
    Trash: () => 'Trash',
    ShoppingCart: () => 'ShoppingCart',
    ArrowLeft: () => 'ArrowLeft',
    Printer: () => 'Printer',
    DownloadSimple: () => 'DownloadSimple',
}))

// Mock Cards components
vi.mock('@/components/chat/cards', () => ({
    CheckoutCard: () => 'CheckoutCard',
    RiskBanner: () => 'RiskBanner',
    SuccessBanner: () => 'SuccessBanner',
}))
