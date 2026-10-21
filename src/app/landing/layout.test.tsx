import { describe, it, expect } from 'vitest'
import { metadata } from './layout'

describe('LandingLayout metadata', () => {
  it('title is not the bare word "Home"', () => {
    expect(metadata.title).not.toBe('Home')
  })

  it('title contains the brand name', () => {
    expect(String(metadata.title)).toContain('LiveListen')
  })
})
