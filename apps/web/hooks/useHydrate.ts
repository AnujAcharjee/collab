import useAppStore from "@/stores/app-store"
import axios from "axios"
import { useCallback } from "react"
import type { RoomRecord, UserRecord } from "@repo/validation"
import { useShallow } from "zustand/react/shallow"

const httpSrvUrl = process.env.NEXT_PUBLIC_HHTP_SRV_URL
const usersApiUrl = `${httpSrvUrl}/api/v1/users`

export const useHydrate = (userid: string) => {
  const { user, rooms, hasHydrated, hydrateUserState, resetAppState } =
    useAppStore(
      useShallow((state) => ({
        user: state.user,
        rooms: state.rooms,
        hasHydrated: state.hasHydrated,
        hydrateUserState: state.hydrateUserState,
        resetAppState: state.resetAppState,
      }))
    )

  const fetch = useCallback(async () => {
    try {
      const currentUserId = useAppStore.getState().user?.id

      if (currentUserId && currentUserId !== userid) {
        resetAppState()
      }

      const res = await axios.get(`${usersApiUrl}/hydrate/${userid}`)
      hydrateUserState({
        user: res.data.data.user as UserRecord,
        rooms: res.data.data.rooms as RoomRecord[],
      })
    } catch (error) {
      resetAppState()
      console.error("Error while fetching user: ", error)
    }
  }, [hydrateUserState, resetAppState, userid])

  return { hasHydrated, fetch, user, rooms }
}
