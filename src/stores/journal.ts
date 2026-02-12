/**
 * V9: Journal Store (Pinia)
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  fetchJournals, createJournal, updateJournal, requestAiReview, fetchWeeklyReport,
  type JournalEntry
} from '@/api/client'

export const useJournalStore = defineStore('journal', () => {
  const journals = ref<JournalEntry[]>([])
  const total = ref(0)
  const page = ref(1)
  const loading = ref(false)

  async function load(p: number = 1, size: number = 20, symbol?: string, status?: string, account_id?: string) {
    loading.value = true
    try {
      const resp = await fetchJournals(p, size, symbol, status, account_id)
      journals.value = resp?.items || []
      total.value = resp?.total || 0
      page.value = resp?.page || 1
    } catch (e) {
      console.error('Failed to load journals:', e)
      journals.value = []
    } finally {
      loading.value = false
    }
  }

  async function add(payload: Partial<JournalEntry>) {
    const j = await createJournal(payload)
    journals.value.unshift(j)
    total.value++
    return j
  }

  async function edit(id: number, payload: Partial<JournalEntry>) {
    const j = await updateJournal(id, payload)
    const idx = journals.value.findIndex((x: JournalEntry) => x.id === id)
    if (idx >= 0) journals.value[idx] = j
    return j
  }

  async function aiReview(id: number) {
    const resp = await requestAiReview(id)
    const idx = journals.value.findIndex((x: JournalEntry) => x.id === id)
    if (idx >= 0) {
      journals.value[idx].ai_review = resp.ai_review
      journals.value[idx].journal_status = 'REVIEWED'
    }
    return resp.ai_review
  }

  return { journals, total, page, loading, load, add, edit, aiReview }
})
