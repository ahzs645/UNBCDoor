import { useState } from 'react'

export const useSignState = () => {
  const [signData, setSignData] = useState({
    signType: 'faculty',
    departmentType: '',
    mainDepartment: '',
    subDepartment: '',
    subSubDepartment: '',
    name: '',
    position: '',
    email: '',
    phone: '',
    showEmail: true,
    showPhone: true,
    roomName: '',
    cardHolderType: '',
    showAlumni: false,
    showDesignations: false,
    designations: []
  })

  return [signData, setSignData]
}