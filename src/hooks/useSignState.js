import { useState } from 'react'
import { INITIAL_SIGN_DATA } from '../sign/signData'

export const useSignState = () => {
  const [signData, setSignData] = useState(() => ({ ...INITIAL_SIGN_DATA }))

  return [signData, setSignData]
}
