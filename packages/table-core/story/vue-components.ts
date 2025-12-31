import { defineComponent, h } from 'vue'

/**
 * 进度条组件
 */
export const ProgressBar = defineComponent({
  name: 'ProgressBar',
  props: {
    getValue: {
      type: Function,
      required: true
    }
  },
  setup(props) {
    const value = props.getValue()
    return () => h('div', {
      class: 'w-full bg-gray-200 rounded-full h-4 overflow-hidden'
    }, [
      h('div', {
        class: 'h-full rounded-full transition-all duration-300',
        style: {
          width: `${value}%`,
          backgroundColor: '#3b82f6'
        }
      })
    ])
  }
})

/**
 * 状态标签组件
 */
export const StatusTag = defineComponent({
  name: 'StatusTag',
  props: {
    getValue: {
      type: Function,
      required: true
    }
  },
  setup(props) {
    const status = props.getValue()
    const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case 'single':
          return 'bg-green-100 text-green-800'
        case 'in relationship':
          return 'bg-blue-100 text-blue-800'
        case 'married':
          return 'bg-purple-100 text-purple-800'
        case 'complicated':
          return 'bg-yellow-100 text-yellow-800'
        case 'divorced':
          return 'bg-red-100 text-red-800'
        default:
          return 'bg-gray-100 text-gray-800'
      }
    }

    return () => h('span', {
      class: `px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`
    }, status)
  }
})

/**
 * 姓名头像组件
 */
export const Avatar = defineComponent({
  name: 'Avatar',
  props: {
    getValue: {
      type: Function,
      required: true
    },
    row: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const firstName = props.getValue()
    const lastName = props.row.original.lastName
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    
    return () => h('div', {
      class: 'flex items-center space-x-2'
    }, [
      h('div', {
        class: 'w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium'
      }, initials),
      h('div', { class: 'text-sm font-medium' }, `${firstName} ${lastName}`)
    ])
  }
})

/**
 * 数字徽章组件
 */
export const NumberBadge = defineComponent({
  name: 'NumberBadge',
  props: {
    getValue: {
      type: Function,
      required: true
    }
  },
  setup(props) {
    const value = props.getValue()
    const threshold = 50
    const getBadgeClass = () => {
      if (value >= threshold * 2) return 'bg-red-500 text-white'
      if (value >= threshold) return 'bg-yellow-500 text-white'
      return 'bg-green-500 text-white'
    }

    return () => h('span', {
      class: `px-2 py-1 rounded-full text-xs font-bold ${getBadgeClass()}`
    }, value.toString())
  }
})