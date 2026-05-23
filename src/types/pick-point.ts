export interface PickPointItem {
  id: number
  name: string
  address: string
  leaderName?: string
  leaderUserId?: number | null
  phone?: string
  latitude?: number | null
  longitude?: number | null
}
