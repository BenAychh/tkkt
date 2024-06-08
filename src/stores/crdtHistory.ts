import { defineStore } from 'pinia'
import { type CRDTAsHistoryItem, getMostRecentCRDTBatchItems } from '@/db/history'
import { type CRDTMessage, deserializeValue, type TableName } from '@/db/helpers'

export interface HistoryItem {
  icon: string
  text: string
  timestamp: Date
}

interface State {
  items: HistoryItem[]
}

const iconMap: Record<TableName, { creation: string; edit: string }> = {
  access_student_logs: { creation: 'pi-plus', edit: 'pi-pencil' },
  admins: { creation: 'pi-plus', edit: 'pi-pencil' },
  tickets: { creation: 'pi-plus', edit: 'pi-pencil' },
  events: {
    creation: 'pi-calendar-plus',
    edit: 'pi-pen-to-square'
  },
  students: {
    creation: 'pi-user-plus',
    edit: 'pi-user-edit'
  }
}

const joinWithAnd = (strings: string[]): string => {
  if (strings.length === 0) {
    return ''
  }
  if (strings.length === 1) {
    return strings[0]
  }
  const last = strings.pop()
  return `${strings.join(', ')} and ${last}`
}

const getEditMessage = (messages: CRDTMessage): string => {
  const value = deserializeValue(messages.val)
  if (value === null) {
    return `removed ${messages.col}`
  }
  if (typeof value === 'string') {
    if (value.length < 50 || messages.col === 'name') {
      return `changed ${messages.col} to "${value}"`
    }
  }
  return `changed ${messages.col} to ${value}`
}

const rawItemToHistoryItem = (rawItem: CRDTAsHistoryItem): HistoryItem => {
  const firstHlc = rawItem.messages[0].hlc
  const isoDateString = firstHlc.split(' ')[0]
  const timestamp = new Date(isoDateString)
  const iconMapForTable = iconMap[rawItem.messages[0].dataset] || {
    creation: 'pi-plus',
    edit: 'pi-pencil'
  }
  const icon = rawItem.isCreation ? iconMapForTable.creation : iconMapForTable.edit
  if (rawItem.isCreation) {
    const nameMessage = rawItem.messages.find((msg) => msg.col === 'name')
    const name = nameMessage
      ? deserializeValue(nameMessage.val)
      : `a new ${rawItem.messages[0].dataset.slice(0, -1)}`
    return {
      icon,
      text: `${rawItem.messages[0].actor} created ${name}`,
      timestamp
    }
  }
  const editMessageStrings = rawItem.messages.map(getEditMessage)
  return {
    icon,
    text: `${rawItem.messages[0].actor} ${joinWithAnd(editMessageStrings)}`,
    timestamp
  }
}

export const useRealTimeHistory = defineStore('realTimeHistory', {
  state: (): State => ({
    items: []
  }),
  getters: {
    getItems(state): HistoryItem[] {
      return state.items
    }
  },
  actions: {
    async loadHistoryItems() {
      const rawItems = await getMostRecentCRDTBatchItems(10)
      rawItems.sort((a, b) => b.messages[0].hlc.localeCompare(a.messages[0].hlc))
      this.items = rawItems.map(rawItemToHistoryItem)
    }
  }
})
