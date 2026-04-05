import '@testing-library/jest-dom'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './msw/server'

// Start MSW server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))

// Reset handlers between tests to avoid state bleed
afterEach(() => server.resetHandlers())

// Shut down after the full suite
afterAll(() => server.close())
