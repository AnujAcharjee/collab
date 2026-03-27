import useAppStore from "@/stores/app-store"
import axios from "axios"
import type { UserRecord } from "@repo/validation"

const httpSrvUrl = process.env.NEXT_PUBLIC_HHTP_SRV_URL
const usersApiUrl = `${httpSrvUrl}/api/v1/users`

export const useMessage = (userid: string) => {
  const { user, setUser } = useAppStore((state) => ({
    user: state.user,
    setUser: state.setUser,
  }))

  const fetchUser = async () => {
    try {
      const res = await axios.get(`${usersApiUrl}?id=${userid}`)
      setUser(res.data.data.user as UserRecord)
    } catch (error) {
      console.error("Error while fetching user: ", error)
    }
  }

  return { user, fetchUser }
}
