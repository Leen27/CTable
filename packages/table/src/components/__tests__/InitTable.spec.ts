import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import InitTable from '../InitTable.vue'

describe('InitTable', () => {
  it('renders properly', () => {
    const wrapper = mount(InitTable, { props: {} })
    expect(wrapper.text()).toContain('In Relationship')
  })
})
